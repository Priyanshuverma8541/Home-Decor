'use strict';
const Subscriber = require('../models/Subscriber');
const Campaign = require('../models/Campaign');
const DeliveryAttempt = require('../models/DeliveryAttempt');
const asyncHandler = require('../utils/asyncHandler');
const { toCsv } = require('../utils/csv');
const { audit } = require('../services/auditService');
const { buildFilter } = require('./subscribersController');

// Exports contain only safe reporting fields: never endpoints, p256dh/auth keys, tokens or credentials.
const LIMIT = 50000;
function send(res, name, csv) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
}
const pct = (a, b) => (b ? ((a / b) * 100).toFixed(2) + '%' : '0.00%');

exports.subscribers = asyncHandler(async (req, res) => {
  const rows = await Subscriber.find(buildFilter(req.query)).sort({ createdAt: -1 }).limit(LIMIT).populate('projectId', 'name').lean();
  await audit(req, 'DATA_EXPORTED', 'Export', 'subscribers', { rows: rows.length });
  send(res, 'Subscribers', toCsv([
    { label: 'Subscriber ID', key: 'subscriberId' }, { label: 'Project', value: (r) => r.projectId?.name }, { label: 'Status', key: 'status' },
    { label: 'Device type', value: (r) => r.device?.deviceType }, { label: 'Browser', value: (r) => r.device?.browser }, { label: 'OS', value: (r) => r.device?.os },
    { label: 'Language', key: 'language' }, { label: 'Timezone', key: 'timezone' },
    { label: 'Push permission', value: (r) => r.permissions?.push }, { label: 'Location permission', value: (r) => r.permissions?.location },
    { label: 'Country', value: (r) => r.location?.country }, { label: 'State', value: (r) => r.location?.state }, { label: 'City', value: (r) => r.location?.city },
    { label: 'Created', key: 'createdAt' }, { label: 'Last seen', key: 'lastSeenAt' }
  ], rows));
});

exports.campaigns = asyncHandler(async (req, res) => {
  const rows = await Campaign.find({ isTest: { $ne: true } }).sort({ createdAt: -1 }).limit(LIMIT).populate('projectId', 'name').lean();
  await audit(req, 'DATA_EXPORTED', 'Export', 'campaigns', { rows: rows.length });
  send(res, 'Campaigns', toCsv([
    { label: 'Campaign', key: 'campaignName' }, { label: 'Project', value: (r) => r.projectId?.name }, { label: 'Type', key: 'type' }, { label: 'Status', key: 'status' },
    { label: 'Audience', key: 'audienceType' }, { label: 'Title', key: 'title' }, { label: 'Target URL', key: 'targetUrl' },
    { label: 'Scheduled at (UTC)', key: 'scheduledAt' }, { label: 'Sent at (UTC)', key: 'sentAt' }, { label: 'Created', key: 'createdAt' }
  ], rows));
});

exports.campaignPerformance = asyncHandler(async (req, res) => {
  const rows = await Campaign.find({ isTest: { $ne: true }, status: { $in: ['COMPLETED', 'PARTIALLY_FAILED', 'FAILED'] } }).sort({ sentAt: -1 }).limit(LIMIT).populate('projectId', 'name').lean();
  await audit(req, 'DATA_EXPORTED', 'Export', 'campaign-performance', { rows: rows.length });
  send(res, 'Campaign_Performance', toCsv([
    { label: 'Campaign', key: 'campaignName' }, { label: 'Project', value: (r) => r.projectId?.name }, { label: 'Status', key: 'status' }, { label: 'Sent at (UTC)', key: 'sentAt' },
    { label: 'Targeted subscriptions', value: (r) => r.stats.targeted }, { label: 'Push attempts', value: (r) => r.stats.attempted },
    { label: 'Accepted by push service', value: (r) => r.stats.accepted }, { label: 'Failed', value: (r) => r.stats.failed }, { label: 'Stale subscriptions', value: (r) => r.stats.stale },
    { label: 'Tracked clicks', value: (r) => r.stats.clicks }, { label: 'Click rate (clicks / accepted)', value: (r) => pct(r.stats.clicks, r.stats.accepted) }
  ], rows));
});

exports.failures = asyncHandler(async (req, res) => {
  const rows = await DeliveryAttempt.find({ result: { $in: ['FAILED', 'STALE_SUBSCRIPTION'] } }).sort({ attemptedAt: -1 }).limit(LIMIT).populate('campaignId', 'campaignName').lean();
  await audit(req, 'DATA_EXPORTED', 'Export', 'push-failures', { rows: rows.length });
  send(res, 'Push_Failures', toCsv([
    { label: 'Attempted at (UTC)', key: 'attemptedAt' }, { label: 'Campaign', value: (r) => r.campaignId?.campaignName }, { label: 'Subscriber ID', key: 'subscriberId' },
    { label: 'Result', key: 'result' }, { label: 'Push service HTTP status', key: 'pushServiceStatus' }, { label: 'Error category', key: 'errorCategory' }, { label: 'Error (sanitised)', key: 'errorMessage' }
  ], rows));
});

exports.clicks = asyncHandler(async (req, res) => {
  const rows = await DeliveryAttempt.find({ clickedAt: { $exists: true } }).sort({ clickedAt: -1 }).limit(LIMIT).populate('campaignId', 'campaignName').lean();
  await audit(req, 'DATA_EXPORTED', 'Export', 'click-tracking', { rows: rows.length });
  send(res, 'Click_Tracking', toCsv([
    { label: 'Clicked at (UTC)', key: 'clickedAt' }, { label: 'Campaign', value: (r) => r.campaignId?.campaignName }, { label: 'Subscriber ID', key: 'subscriberId' }, { label: 'Attempted at (UTC)', key: 'attemptedAt' }
  ], rows));
});
