'use strict';
const AuditLog = require('../models/AuditLog');
const DeliveryAttempt = require('../models/DeliveryAttempt');
const asyncHandler = require('../utils/asyncHandler');
const { parsePage, pageMeta, escapeRegex } = require('../utils/pagination');

exports.audit = asyncHandler(async (req, res) => {
  const pg = parsePage(req.query, ['createdAt', 'action'], '-createdAt');
  const f = {};
  if (req.query.action) f.action = String(req.query.action).slice(0, 60);
  if (req.query.q) f.$or = [{ actorEmail: { $regex: escapeRegex(req.query.q), $options: 'i' } }, { resourceId: { $regex: escapeRegex(req.query.q), $options: 'i' } }];
  const [items, total] = await Promise.all([AuditLog.find(f).sort(pg.sort).skip(pg.skip).limit(pg.limit).lean(), AuditLog.countDocuments(f)]);
  res.json({ success: true, data: items, meta: pageMeta(pg, total) });
});

exports.failures = asyncHandler(async (req, res) => {
  const pg = parsePage(req.query, ['attemptedAt'], '-attemptedAt');
  const f = { result: { $in: ['FAILED', 'STALE_SUBSCRIPTION'] } };
  if (req.query.category) f.errorCategory = String(req.query.category).slice(0, 40);
  const [items, total] = await Promise.all([
    DeliveryAttempt.find(f).sort(pg.sort).skip(pg.skip).limit(pg.limit).populate('campaignId', 'campaignName').select('campaignId subscriberId attemptedAt result pushServiceStatus errorCategory errorMessage').lean(),
    DeliveryAttempt.countDocuments(f)
  ]);
  res.json({ success: true, data: items.map((a) => ({ ...a, campaign: a.campaignId })), meta: pageMeta(pg, total) });
});
