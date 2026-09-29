'use strict';
const Subscriber = require('../models/Subscriber');
const PushSubscription = require('../models/PushSubscription');
const DeliveryAttempt = require('../models/DeliveryAttempt');
const Project = require('../models/Project');
const Campaign = require('../models/Campaign');
const asyncHandler = require('../utils/asyncHandler');
const { notFound, bad } = require('../utils/appError');
const { parsePage, pageMeta, escapeRegex } = require('../utils/pagination');
const { audit } = require('../services/auditService');
const campaigns = require('../services/campaignService');

exports.buildFilter = (q) => {
  const f = { status: { $ne: 'deleted' } };
  if (q.projectId && /^[a-f\d]{24}$/i.test(q.projectId)) f.projectId = q.projectId;
  if (['active', 'inactive', 'disabled'].includes(q.status)) f.status = q.status;
  if (['mobile', 'tablet', 'desktop', 'other'].includes(q.deviceType)) f['device.deviceType'] = q.deviceType;
  if (q.q) {
    const rx = { $regex: escapeRegex(q.q), $options: 'i' };
    f.$or = [{ subscriberId: rx }, { 'device.browser': rx }, { 'device.os': rx }, { 'location.city': rx }, { 'location.country': rx }];
  }
  return f;
};

exports.list = asyncHandler(async (req, res) => {
  const pg = parsePage(req.query, ['createdAt', 'lastSeenAt', 'status', 'subscriberId'], '-createdAt');
  const f = exports.buildFilter(req.query);
  const [items, total] = await Promise.all([
    Subscriber.find(f).sort(pg.sort).skip(pg.skip).limit(pg.limit).populate('projectId', 'name').lean(),
    Subscriber.countDocuments(f)
  ]);
  const counts = await PushSubscription.aggregate([{ $match: { subscriber: { $in: items.map((i) => i._id) } } }, { $group: { _id: '$subscriber', total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } } } }]);
  const map = new Map(counts.map((c) => [String(c._id), c]));
  const data = items.map((s) => ({ ...s, project: s.projectId, projectId: s.projectId?._id, subscriptionCount: map.get(String(s._id))?.total || 0, activeSubscriptions: map.get(String(s._id))?.active || 0 }));
  res.json({ success: true, data, meta: pageMeta(pg, total) });
});

exports.get = asyncHandler(async (req, res) => {
  const s = await Subscriber.findOne({ subscriberId: req.params.subscriberId, status: { $ne: 'deleted' } }).populate('projectId', 'name publicProjectId websiteUrl').lean();
  if (!s) throw notFound('Subscriber');
  const [subs, recent, failures, clicks] = await Promise.all([
    PushSubscription.find({ subscriber: s._id }).select('status createdAt updatedAt lastSuccessAt lastFailureAt failureCount').lean(), // endpoint/keys are select:false
    DeliveryAttempt.find({ subscriberRef: s._id }).sort({ attemptedAt: -1 }).limit(15).populate('campaignId', 'campaignName title').lean(),
    DeliveryAttempt.find({ subscriberRef: s._id, result: { $in: ['FAILED', 'STALE_SUBSCRIPTION'] } }).sort({ attemptedAt: -1 }).limit(10).populate('campaignId', 'campaignName').lean(),
    DeliveryAttempt.countDocuments({ subscriberRef: s._id, clickedAt: { $exists: true } })
  ]);
  const fmt = (a) => ({ _id: a._id, campaign: a.campaignId, attemptedAt: a.attemptedAt, result: a.result, pushServiceStatus: a.pushServiceStatus, errorCategory: a.errorCategory, errorMessage: a.errorMessage, clickedAt: a.clickedAt });
  res.json({ success: true, data: { ...s, project: s.projectId, subscriptions: subs, recentActivity: recent.map(fmt), recentFailures: failures.map(fmt), trackedClicks: clicks } });
});

exports.testPush = asyncHandler(async (req, res) => {
  const s = await Subscriber.findOne({ subscriberId: req.params.subscriberId, status: 'active' }).lean();
  if (!s) throw notFound('Active subscriber');
  const project = await Project.findById(s.projectId).lean();
  if (!project?.allowedOrigins?.length) throw bad('The subscriber project has no allowed origins configured');
  const data = await campaigns.prepareContent({
    campaignName: `Test push to ${s.subscriberId}`, type: 'TRANSACTIONAL', isTest: true,
    title: req.body.title || 'SavitriBridge test notification', body: req.body.body || 'If you can read this, real remote Web Push works.',
    targetUrl: project.websiteUrl && project.allowedOrigins.includes(new URL(project.websiteUrl).origin) ? project.websiteUrl : project.allowedOrigins[0],
    iconUrl: project.defaultIconUrl, badgeUrl: project.defaultBadgeUrl, notificationTag: 'sb-test',
    audienceType: 'SUBSCRIBER', selectedSubscriberId: s.subscriberId, projectId: project._id
  });
  const c = await Campaign.create({ ...data, createdBy: req.admin._id });
  await audit(req, 'TEST_PUSH_SENT', 'Subscriber', s.subscriberId, { campaignId: c._id });
  const sent = await campaigns.sendNow(c._id);
  res.status(202).json({ success: true, data: { campaignId: sent._id, message: 'Test push queued. Check the device in a few seconds.' } });
});

async function setStatus(req, res, to) {
  const s = await Subscriber.findOne({ subscriberId: req.params.subscriberId, status: { $ne: 'deleted' } });
  if (!s) throw notFound('Subscriber');
  if (to === 'disabled') {
    await PushSubscription.updateMany({ subscriber: s._id, status: 'active' }, { $set: { status: 'disabled' } });
    s.status = 'disabled';
  } else { // Re-enabling only reactivates platform-side delivery; browser permission is untouched and may still be blocked.
    const r = await PushSubscription.updateMany({ subscriber: s._id, status: 'disabled' }, { $set: { status: 'active' } });
    s.status = r.modifiedCount || (await PushSubscription.exists({ subscriber: s._id, status: 'active' })) ? 'active' : 'inactive';
  }
  await s.save();
  await audit(req, to === 'disabled' ? 'SUBSCRIBER_DISABLED' : 'SUBSCRIBER_ENABLED', 'Subscriber', s.subscriberId);
  res.json({ success: true, data: { subscriberId: s.subscriberId, status: s.status } });
}
exports.disable = asyncHandler((req, res) => setStatus(req, res, 'disabled'));
exports.enable = asyncHandler((req, res) => setStatus(req, res, 'active'));

// Removes push credentials and personal/device/location data; keeps an anonymous shell so aggregate campaign statistics stay intact.
exports.remove = asyncHandler(async (req, res) => {
  const s = await Subscriber.findOne({ subscriberId: req.params.subscriberId, status: { $ne: 'deleted' } });
  if (!s) throw notFound('Subscriber');
  await PushSubscription.deleteMany({ subscriber: s._id });
  await Subscriber.updateOne({ _id: s._id }, { $set: { status: 'deleted', tags: [], languages: [], permissions: { push: 'unknown', location: 'unknown' } }, $unset: { device: 1, location: 1, language: 1, timezone: 1 } });
  await audit(req, 'SUBSCRIBER_DELETED', 'Subscriber', s.subscriberId);
  res.json({ success: true, data: { message: 'Subscriber data deleted. Aggregate campaign statistics are preserved without personal data.' } });
});
