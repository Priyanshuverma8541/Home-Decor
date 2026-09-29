'use strict';
const Project = require('../models/Project');
const Subscriber = require('../models/Subscriber');
const Campaign = require('../models/Campaign');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/env');
const { notFound, bad } = require('../utils/appError');
const { normalizeOrigin, validateMediaUrl } = require('../utils/urlSafety');
const { newPublicProjectId } = require('../utils/ids');
const { parsePage, pageMeta, escapeRegex } = require('../utils/pagination');
const { audit } = require('../services/auditService');
const { invalidateOrigins } = require('../services/originCache');

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'project';
async function uniqueSlug(name) {
  const base = slugify(name); let slug = base; let i = 2;
  while (await Project.exists({ slug })) slug = `${base}-${i++}`;
  return slug;
}
function cleanBody(b) {
  const out = { ...b };
  out.allowedOrigins = [...new Set((b.allowedOrigins || []).filter(Boolean).map(normalizeOrigin))];
  if (b.websiteUrl) { try { new URL(b.websiteUrl); } catch { throw bad('Website URL is invalid'); } }
  out.defaultIconUrl = validateMediaUrl(b.defaultIconUrl, 'Default icon URL');
  out.defaultBadgeUrl = validateMediaUrl(b.defaultBadgeUrl, 'Default badge URL');
  return out;
}
async function withCounts(p) {
  const [subscribers, campaigns] = await Promise.all([
    Subscriber.countDocuments({ projectId: p._id, status: 'active' }),
    Campaign.countDocuments({ projectId: p._id })
  ]);
  return { ...p, subscriberCount: subscribers, campaignCount: campaigns };
}
const integration = (p) => ({
  publicProjectId: p.publicProjectId, apiBase: `${config.publicApiUrl}/api/v1/public`,
  vapidPublicKey: config.vapid.publicKey, allowedOrigins: p.allowedOrigins
});

exports.list = asyncHandler(async (req, res) => {
  const pg = parsePage(req.query, ['name', 'createdAt', 'status'], '-createdAt');
  const f = {};
  if (req.query.status === 'active' || req.query.status === 'inactive') f.status = req.query.status;
  if (req.query.q) f.name = { $regex: escapeRegex(req.query.q), $options: 'i' };
  const [items, total] = await Promise.all([Project.find(f).sort(pg.sort).skip(pg.skip).limit(pg.limit).lean(), Project.countDocuments(f)]);
  res.json({ success: true, data: await Promise.all(items.map(withCounts)), meta: pageMeta(pg, total) });
});

exports.create = asyncHandler(async (req, res) => {
  const body = cleanBody(req.body);
  const p = await Project.create({ ...body, slug: await uniqueSlug(body.name), publicProjectId: newPublicProjectId(), createdBy: req.admin._id });
  invalidateOrigins();
  await audit(req, 'PROJECT_CREATED', 'Project', p._id, { name: p.name });
  res.status(201).json({ success: true, data: { ...p.toObject(), integration: integration(p) } });
});

exports.get = asyncHandler(async (req, res) => {
  const p = await Project.findById(req.params.id).lean();
  if (!p) throw notFound('Project');
  res.json({ success: true, data: { ...(await withCounts(p)), integration: integration(p) } });
});

exports.update = asyncHandler(async (req, res) => {
  const p = await Project.findById(req.params.id);
  if (!p) throw notFound('Project');
  const body = cleanBody({ ...p.toObject(), ...req.body });
  ['name', 'description', 'websiteUrl', 'allowedOrigins', 'defaultIconUrl', 'defaultBadgeUrl'].forEach((k) => { p[k] = body[k]; });
  if (req.body.status) p.status = req.body.status;
  await p.save();
  invalidateOrigins();
  await audit(req, 'PROJECT_UPDATED', 'Project', p._id, { fields: Object.keys(req.body) });
  res.json({ success: true, data: { ...p.toObject(), integration: integration(p) } });
});

exports.setStatus = asyncHandler(async (req, res) => {
  const status = req.body.status === 'inactive' ? 'inactive' : 'active';
  const p = await Project.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!p) throw notFound('Project');
  invalidateOrigins();
  await audit(req, 'PROJECT_UPDATED', 'Project', p._id, { status });
  res.json({ success: true, data: p });
});
