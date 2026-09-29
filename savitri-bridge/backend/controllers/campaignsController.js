'use strict';
const Campaign = require('../models/Campaign');
const DeliveryAttempt = require('../models/DeliveryAttempt');
const asyncHandler = require('../utils/asyncHandler');
const { notFound, conflict } = require('../utils/appError');
const { parsePage, pageMeta, escapeRegex } = require('../utils/pagination');
const { audit } = require('../services/auditService');
const svc = require('../services/campaignService');
const push = require('../services/pushService');

const EDITABLE = ['DRAFT', 'SCHEDULED'];
const oid = /^[a-f\d]{24}$/i;

exports.list = asyncHandler(async (req, res) => {
  const pg = parsePage(req.query, ['createdAt', 'scheduledAt', 'sentAt', 'status', 'campaignName'], '-createdAt');
  const f = {};
  if (req.query.status && Campaign.STATUSES.includes(req.query.status)) f.status = req.query.status;
  if (req.query.projectId && oid.test(req.query.projectId)) f.projectId = req.query.projectId;
  if (['MARKETING', 'TRANSACTIONAL'].includes(req.query.type)) f.type = req.query.type;
  if (req.query.includeTests !== 'true') f.isTest = { $ne: true };
  if (req.query.q) f.campaignName = { $regex: escapeRegex(req.query.q), $options: 'i' };
  const [items, total] = await Promise.all([Campaign.find(f).sort(pg.sort).skip(pg.skip).limit(pg.limit).populate('projectId', 'name').lean(), Campaign.countDocuments(f)]);
  res.json({ success: true, data: items.map((c) => ({ ...c, project: c.projectId, projectId: c.projectId?._id })), meta: pageMeta(pg, total) });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await svc.prepareContent({ ...req.body });
  const c = await Campaign.create({ ...data, createdBy: req.admin._id });
  await audit(req, 'CAMPAIGN_CREATED', 'Campaign', c._id, { name: c.campaignName, audience: c.audienceType });
  res.status(201).json({ success: true, data: c });
});

exports.get = asyncHandler(async (req, res) => {
  const c = await Campaign.findById(req.params.id).populate('projectId', 'name publicProjectId').populate('createdBy', 'name').lean();
  if (!c) throw notFound('Campaign');
  const breakdown = await DeliveryAttempt.aggregate([{ $match: { campaignId: c._id } }, { $group: { _id: '$result', n: { $sum: 1 } } }]);
  const errors = await DeliveryAttempt.aggregate([{ $match: { campaignId: c._id, errorCategory: { $exists: true } } }, { $group: { _id: '$errorCategory', n: { $sum: 1 } } }, { $sort: { n: -1 } }]);
  const clickedAttempts = await DeliveryAttempt.countDocuments({ campaignId: c._id, clickedAt: { $exists: true } });
  res.json({ success: true, data: { ...c, project: c.projectId, projectId: c.projectId?._id, breakdown: Object.fromEntries(breakdown.map((b) => [b._id, b.n])), errorBreakdown: errors, trackedClicks: clickedAttempts } });
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await Campaign.findById(req.params.id);
  if (!existing) throw notFound('Campaign');
  if (!EDITABLE.includes(existing.status)) throw conflict('Only draft or scheduled campaigns can be edited');
  const data = await svc.prepareContent({ ...req.body });
  if (!data.projectId) existing.projectId = undefined;
  Object.assign(existing, data);
  await existing.save();
  await audit(req, 'CAMPAIGN_UPDATED', 'Campaign', existing._id);
  res.json({ success: true, data: existing });
});

exports.remove = asyncHandler(async (req, res) => {
  const c = await Campaign.findOneAndDelete({ _id: req.params.id, status: { $in: ['DRAFT', 'CANCELLED'] } });
  if (!c) throw conflict('Only draft or cancelled campaigns can be deleted. Sent campaigns are kept for reporting.');
  await audit(req, 'CAMPAIGN_DELETED', 'Campaign', c._id);
  res.json({ success: true, data: { deleted: true } });
});

exports.estimate = asyncHandler(async (req, res) => {
  const filter = push.audienceFilter({ audienceType: req.body.audienceType, projectId: req.body.projectId, selectedSubscriberId: req.body.selectedSubscriberId });
  res.json({ success: true, data: { targetSubscriptions: await require('../models/PushSubscription').countDocuments(filter) } });
});

exports.send = asyncHandler(async (req, res) => {
  const c = await svc.sendNow(req.params.id);
  await audit(req, 'CAMPAIGN_SENT', 'Campaign', c._id, { name: c.campaignName });
  res.status(202).json({ success: true, data: { _id: c._id, status: c.status, message: 'Campaign is sending. Refresh to follow progress.' } });
});

exports.schedule = asyncHandler(async (req, res) => {
  const c = await svc.schedule(req.params.id, req.body.scheduledAt, req.body.timezone);
  await audit(req, 'CAMPAIGN_SCHEDULED', 'Campaign', c._id, { scheduledAt: c.scheduledAt, timezone: c.timezone });
  res.json({ success: true, data: c });
});

exports.cancel = asyncHandler(async (req, res) => {
  const c = await svc.cancel(req.params.id);
  await audit(req, 'CAMPAIGN_CANCELLED', 'Campaign', c._id);
  res.json({ success: true, data: c });
});

exports.duplicate = asyncHandler(async (req, res) => {
  const o = await Campaign.findById(req.params.id).lean();
  if (!o) throw notFound('Campaign');
  const { _id, createdAt, updatedAt, status, stats, sentAt, completedAt, scheduledAt, lockedAt, lastError, isTest, ...rest } = o;
  const c = await Campaign.create({ ...rest, campaignName: `${o.campaignName} (copy)`, createdBy: req.admin._id });
  await audit(req, 'CAMPAIGN_CREATED', 'Campaign', c._id, { duplicatedFrom: String(o._id) });
  res.status(201).json({ success: true, data: c });
});

exports.attempts = asyncHandler(async (req, res) => {
  const pg = parsePage(req.query, ['attemptedAt'], '-attemptedAt');
  const f = { campaignId: req.params.id };
  if (['ACCEPTED_BY_PUSH_SERVICE', 'FAILED', 'STALE_SUBSCRIPTION'].includes(req.query.result)) f.result = req.query.result;
  const [items, total] = await Promise.all([DeliveryAttempt.find(f).sort(pg.sort).skip(pg.skip).limit(pg.limit).select('subscriberId attemptedAt result pushServiceStatus errorCategory errorMessage clickedAt').lean(), DeliveryAttempt.countDocuments(f)]);
  res.json({ success: true, data: items, meta: pageMeta(pg, total) });
});
