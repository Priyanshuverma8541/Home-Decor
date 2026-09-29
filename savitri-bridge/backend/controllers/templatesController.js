'use strict';
const Template = require('../models/Template');
const Campaign = require('../models/Campaign');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const { notFound, conflict, bad } = require('../utils/appError');
const { validateMediaUrl, validateTargetUrl } = require('../utils/urlSafety');
const { parsePage, pageMeta, escapeRegex } = require('../utils/pagination');
const { audit } = require('../services/auditService');

async function normalise(b) {
  const out = { ...b };
  out.projectId = b.projectId ? b.projectId : undefined;
  ['iconUrl', 'badgeUrl', 'imageUrl'].forEach((k) => { out[k] = validateMediaUrl(b[k], k); });
  if (b.targetUrl) {
    if (out.projectId) {
      const p = await Project.findById(out.projectId).lean();
      if (!p) throw notFound('Project');
      out.targetUrl = validateTargetUrl(b.targetUrl, p.allowedOrigins);
    } else {
      try { const u = new URL(b.targetUrl); if (!['http:', 'https:'].includes(u.protocol)) throw new Error(); } catch { throw bad('Target URL must be a valid http(s) URL'); }
    }
  }
  return out;
}

exports.list = asyncHandler(async (req, res) => {
  const pg = parsePage(req.query, ['createdAt', 'templateName'], '-createdAt');
  const f = {};
  if (req.query.projectId && /^[a-f\d]{24}$/i.test(req.query.projectId)) f.$or = [{ projectId: req.query.projectId }, { projectId: { $exists: false } }, { projectId: null }];
  if (req.query.active === 'true') f.active = true;
  if (req.query.q) f.templateName = { $regex: escapeRegex(req.query.q), $options: 'i' };
  const [items, total] = await Promise.all([Template.find(f).sort(pg.sort).skip(pg.skip).limit(pg.limit).populate('projectId', 'name').lean(), Template.countDocuments(f)]);
  res.json({ success: true, data: items.map((t) => ({ ...t, project: t.projectId, projectId: t.projectId?._id })), meta: pageMeta(pg, total) });
});
exports.get = asyncHandler(async (req, res) => {
  const t = await Template.findById(req.params.id).lean();
  if (!t) throw notFound('Template');
  res.json({ success: true, data: t });
});
exports.create = asyncHandler(async (req, res) => {
  const t = await Template.create({ ...(await normalise(req.body)), createdBy: req.admin._id });
  await audit(req, 'TEMPLATE_CREATED', 'Template', t._id, { name: t.templateName });
  res.status(201).json({ success: true, data: t });
});
exports.update = asyncHandler(async (req, res) => {
  const t = await Template.findById(req.params.id);
  if (!t) throw notFound('Template');
  const data = await normalise(req.body);
  if (!data.projectId) t.projectId = undefined;
  Object.assign(t, data);
  await t.save();
  await audit(req, 'TEMPLATE_UPDATED', 'Template', t._id);
  res.json({ success: true, data: t });
});
exports.duplicate = asyncHandler(async (req, res) => {
  const o = await Template.findById(req.params.id).lean();
  if (!o) throw notFound('Template');
  const { _id, createdAt, updatedAt, ...rest } = o;
  const t = await Template.create({ ...rest, templateName: `${o.templateName} (copy)`, createdBy: req.admin._id });
  await audit(req, 'TEMPLATE_CREATED', 'Template', t._id, { duplicatedFrom: String(o._id) });
  res.status(201).json({ success: true, data: t });
});
exports.toggle = asyncHandler(async (req, res) => {
  const t = await Template.findById(req.params.id);
  if (!t) throw notFound('Template');
  t.active = !t.active;
  await t.save();
  await audit(req, t.active ? 'TEMPLATE_ENABLED' : 'TEMPLATE_DISABLED', 'Template', t._id);
  res.json({ success: true, data: t });
});
// Safe delete: blocked while a scheduled/processing campaign was built from it (disable it instead).
exports.remove = asyncHandler(async (req, res) => {
  if (await Campaign.exists({ templateId: req.params.id, status: { $in: ['SCHEDULED', 'PROCESSING'] } })) throw conflict('A scheduled or running campaign uses this template. Disable it instead.');
  const t = await Template.findByIdAndDelete(req.params.id);
  if (!t) throw notFound('Template');
  await audit(req, 'TEMPLATE_DELETED', 'Template', t._id);
  res.json({ success: true, data: { deleted: true } });
});
