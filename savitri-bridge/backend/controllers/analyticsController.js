'use strict';
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Subscriber = require('../models/Subscriber');
const PushSubscription = require('../models/PushSubscription');
const Campaign = require('../models/Campaign');
const DeliveryAttempt = require('../models/DeliveryAttempt');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

const oid = (v) => (v && /^[a-f\d]{24}$/i.test(v) ? new mongoose.Types.ObjectId(v) : null);
function range(q) {
  const to = q.to && !Number.isNaN(Date.parse(q.to)) ? new Date(q.to) : new Date();
  const from = q.from && !Number.isNaN(Date.parse(q.from)) ? new Date(q.from) : new Date(to.getTime() - 30 * 86400000);
  if (q.to && /^\d{4}-\d{2}-\d{2}$/.test(q.to)) to.setUTCHours(23, 59, 59, 999);
  return { from, to };
}
const unitOf = (i) => (['day', 'week', 'month'].includes(i) ? i : 'day');
const trunc = (field, unit) => ({ $dateTrunc: { date: field, unit, timezone: 'UTC' } });

// Definitions (also documented in the Guide):
//  attempt  = backend tried to send to a push service
//  accepted = push service accepted the request (NOT proof of device delivery)
//  click    = Service Worker reported a notification click
//  click rate = attempts with a tracked click / accepted attempts, same period & filters
exports.overview = asyncHandler(async (req, res) => {
  const [projects, activeSubscribers, activeSubs, inactiveSubs, totalCampaigns, completed, scheduled, agg, recentCampaigns] = await Promise.all([
    Project.countDocuments(),
    Subscriber.countDocuments({ status: 'active' }),
    PushSubscription.countDocuments({ status: 'active' }),
    PushSubscription.countDocuments({ status: { $ne: 'active' } }),
    Campaign.countDocuments({ isTest: { $ne: true } }),
    Campaign.countDocuments({ status: { $in: ['COMPLETED', 'PARTIALLY_FAILED'] }, isTest: { $ne: true } }),
    Campaign.countDocuments({ status: 'SCHEDULED' }),
    DeliveryAttempt.aggregate([{ $group: { _id: null,
      attempts: { $sum: 1 },
      accepted: { $sum: { $cond: [{ $eq: ['$result', 'ACCEPTED_BY_PUSH_SERVICE'] }, 1, 0] } },
      failed: { $sum: { $cond: [{ $in: ['$result', ['FAILED', 'STALE_SUBSCRIPTION']] }, 1, 0] } },
      clicks: { $sum: { $cond: [{ $ifNull: ['$clickedAt', false] }, 1, 0] } } } }]),
    Campaign.find({ isTest: { $ne: true } }).sort({ createdAt: -1 }).limit(6).populate('projectId', 'name').select('campaignName status stats scheduledAt createdAt projectId').lean()
  ]);
  const a = agg[0] || { attempts: 0, accepted: 0, failed: 0, clicks: 0 };
  let recentActivity = [];
  if (['SUPER_ADMIN', 'ADMIN', 'VIEWER'].includes(req.admin.role)) recentActivity = await AuditLog.find().sort({ createdAt: -1 }).limit(8).select('action actorEmail resourceType resourceId createdAt').lean();
  res.json({ success: true, data: {
    totalProjects: projects, activeSubscribers, activeSubscriptions: activeSubs, inactiveSubscriptions: inactiveSubs,
    totalCampaigns, campaignsCompleted: completed, campaignsScheduled: scheduled,
    pushAttempts: a.attempts, accepted: a.accepted, failures: a.failed, trackedClicks: a.clicks,
    clickRate: a.accepted ? a.clicks / a.accepted : 0,
    recentCampaigns: recentCampaigns.map((c) => ({ ...c, project: c.projectId })), recentActivity
  } });
});

exports.report = asyncHandler(async (req, res) => {
  const { from, to } = range(req.query); const unit = unitOf(req.query.interval); const projectId = oid(req.query.projectId);
  const attemptMatch = { attemptedAt: { $gte: from, $lte: to }, ...(projectId ? { projectId } : {}) };
  const subMatch = { status: { $ne: 'deleted' }, ...(projectId ? { projectId } : {}) };

  const [growth, before, activity, clicks, totals, campaigns, byProject, dev, browser, os, country, state, city, mobile] = await Promise.all([
    Subscriber.aggregate([{ $match: { ...subMatch, createdAt: { $gte: from, $lte: to } } }, { $group: { _id: trunc('$createdAt', unit), n: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Subscriber.countDocuments({ ...subMatch, createdAt: { $lt: from } }),
    DeliveryAttempt.aggregate([{ $match: attemptMatch }, { $group: { _id: trunc('$attemptedAt', unit),
      attempted: { $sum: 1 },
      accepted: { $sum: { $cond: [{ $eq: ['$result', 'ACCEPTED_BY_PUSH_SERVICE'] }, 1, 0] } },
      failed: { $sum: { $cond: [{ $in: ['$result', ['FAILED', 'STALE_SUBSCRIPTION']] }, 1, 0] } } } }, { $sort: { _id: 1 } }]),
    DeliveryAttempt.aggregate([{ $match: { clickedAt: { $gte: from, $lte: to }, ...(projectId ? { projectId } : {}) } }, { $group: { _id: trunc('$clickedAt', unit), n: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    DeliveryAttempt.aggregate([{ $match: attemptMatch }, { $group: { _id: null,
      attempted: { $sum: 1 },
      accepted: { $sum: { $cond: [{ $eq: ['$result', 'ACCEPTED_BY_PUSH_SERVICE'] }, 1, 0] } },
      failed: { $sum: { $cond: [{ $eq: ['$result', 'FAILED'] }, 1, 0] } },
      stale: { $sum: { $cond: [{ $eq: ['$result', 'STALE_SUBSCRIPTION'] }, 1, 0] } },
      clicked: { $sum: { $cond: [{ $ifNull: ['$clickedAt', false] }, 1, 0] } } } }]),
    Campaign.find({ isTest: { $ne: true }, sentAt: { $gte: from, $lte: to }, ...(projectId ? { projectId } : {}) }).sort({ sentAt: -1 }).limit(15).select('campaignName stats sentAt').lean(),
    DeliveryAttempt.aggregate([{ $match: attemptMatch }, { $group: { _id: '$projectId',
      attempted: { $sum: 1 },
      accepted: { $sum: { $cond: [{ $eq: ['$result', 'ACCEPTED_BY_PUSH_SERVICE'] }, 1, 0] } },
      failed: { $sum: { $cond: [{ $in: ['$result', ['FAILED', 'STALE_SUBSCRIPTION']] }, 1, 0] } },
      clicked: { $sum: { $cond: [{ $ifNull: ['$clickedAt', false] }, 1, 0] } } } }, { $sort: { attempted: -1 } }, { $limit: 20 }]),
    ...['device.deviceType', 'device.browser', 'device.os', 'location.country', 'location.state', 'location.city'].map((f) =>
      Subscriber.aggregate([{ $match: { ...subMatch, [f]: { $exists: true, $ne: null } } }, { $group: { _id: `$${f}`, n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 12 }])),
    Subscriber.countDocuments(subMatch)
  ]);

  const projectDocs = await Project.find({ _id: { $in: byProject.map((p) => p._id).filter(Boolean) } }).select('name').lean();
  const pname = new Map(projectDocs.map((p) => [String(p._id), p.name]));
  let cumulative = before;
  const t = totals[0] || { attempted: 0, accepted: 0, failed: 0, stale: 0, clicked: 0 };
  const lab = (arr) => arr.map((x) => ({ label: x._id, count: x.n }));
  res.json({ success: true, data: {
    range: { from, to, interval: unit, projectId: projectId ? String(projectId) : null },
    subscriberGrowth: growth.map((g) => ({ date: g._id, count: g.n, cumulative: (cumulative += g.n) })),
    pushActivity: activity.map((a) => ({ date: a._id, attempted: a.attempted, accepted: a.accepted, failed: a.failed })),
    clickTrend: clicks.map((c) => ({ date: c._id, clicks: c.n })),
    totals: { ...t, failedTotal: t.failed + t.stale, clickRate: t.accepted ? t.clicked / t.accepted : 0 },
    campaignPerformance: campaigns.map((c) => ({ name: c.campaignName, sentAt: c.sentAt, accepted: c.stats.accepted, failed: c.stats.failed + c.stats.stale, clicks: c.stats.clicks, clickRate: c.stats.accepted ? c.stats.clicks / c.stats.accepted : 0 })),
    projectPerformance: byProject.map((p) => ({ project: pname.get(String(p._id)) || 'Unknown', attempted: p.attempted, accepted: p.accepted, failed: p.failed, clicks: p.clicked, clickRate: p.accepted ? p.clicked / p.accepted : 0 })),
    breakdowns: { deviceType: lab(dev), browser: lab(browser), os: lab(os), country: lab(country), state: lab(state), city: lab(city) },
    subscribersConsidered: mobile,
    definitions: {
      attempt: 'The backend tried to send a push message to a push service.',
      accepted: 'The push service (Google/Mozilla/Apple) accepted the message. This is NOT proof that it reached or was shown on the device.',
      failed: 'The attempt failed or the subscription was gone (stale).',
      click: 'The Service Worker reported that the notification was clicked.',
      clickRate: 'Tracked clicks divided by push-service-accepted attempts in the same period and filters. Opens/views/impressions are not measurable with Web Push.'
    }
  } });
});
