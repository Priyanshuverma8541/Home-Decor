'use strict';
const webpush = require('web-push');
const config = require('../config/env');
const PushSubscription = require('../models/PushSubscription');
const DeliveryAttempt = require('../models/DeliveryAttempt');
const Campaign = require('../models/Campaign');
const { clickToken } = require('../utils/ids');

webpush.setVapidDetails(config.vapid.subject, config.vapid.publicKey, config.vapid.privateKey);

/** Builds the audience filter on PushSubscription. Disabled/unsubscribed/expired subscriptions are never targeted. */
function audienceFilter(campaign) {
  const f = { status: 'active' };
  if (campaign.audienceType === 'PROJECT') f.projectId = campaign.projectId;
  if (campaign.audienceType === 'SUBSCRIBER') f.subscriberId = campaign.selectedSubscriberId;
  return f;
}
const countTargets = (campaign) => PushSubscription.countDocuments(audienceFilter(campaign));

function buildPayload(campaign, attemptId) {
  return JSON.stringify({
    title: campaign.title,
    body: campaign.body,
    icon: campaign.iconUrl || undefined,
    badge: campaign.badgeUrl || undefined,
    image: campaign.imageUrl || undefined,
    tag: campaign.notificationTag || undefined,
    requireInteraction: !!campaign.requireInteraction,
    url: campaign.targetUrl,
    campaignId: String(campaign._id),
    sendId: String(attemptId),
    clickToken: clickToken(String(attemptId)),
    trackUrl: `${config.publicApiUrl}/api/v1/public/click`
  });
}

function classifyError(err) {
  const status = err?.statusCode;
  if (status === 404 || status === 410) return { result: 'STALE_SUBSCRIPTION', category: 'SUBSCRIPTION_GONE', status };
  if (status === 401 || status === 403) return { result: 'FAILED', category: 'AUTH_VAPID_MISMATCH', status };
  if (status === 400) return { result: 'FAILED', category: 'BAD_REQUEST', status };
  if (status === 413) return { result: 'FAILED', category: 'PAYLOAD_TOO_LARGE', status };
  if (status === 429) return { result: 'FAILED', category: 'RATE_LIMITED', status };
  if (status >= 500) return { result: 'FAILED', category: 'PUSH_SERVICE_ERROR', status };
  return { result: 'FAILED', category: 'NETWORK_OR_UNKNOWN', status };
}
// Error text can embed the endpoint URL; strip URLs/keys and bound the length.
const sanitizeMessage = (m) => String(m || '').replace(/https?:\/\/\S+/g, '[url]').replace(/[A-Za-z0-9_-]{40,}/g, '[redacted]').slice(0, 200);

async function sendOne(sub, payload) {
  try {
    const res = await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload,
      { TTL: config.push.ttl, urgency: 'normal', timeout: 15000 }
    );
    return { result: 'ACCEPTED_BY_PUSH_SERVICE', status: res.statusCode };
  } catch (err) {
    const c = classifyError(err);
    return { result: c.result, status: c.status, category: c.category, message: sanitizeMessage(err.body || err.message) };
  }
}

async function pool(items, limit, worker) {
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; await worker(items[idx], idx); }
  });
  await Promise.all(runners);
}

async function processBatch(campaign, batch, totals) {
  const now = new Date();
  const attempts = await DeliveryAttempt.insertMany(batch.map((s) => ({
    campaignId: campaign._id, projectId: s.projectId, subscriberRef: s.subscriber, subscriberId: s.subscriberId,
    subscriptionId: s._id, attemptedAt: now, result: 'ATTEMPTED'
  })), { ordered: false });

  const outcomes = new Array(batch.length);
  await pool(batch, config.push.concurrency, async (sub, idx) => {
    outcomes[idx] = await sendOne(sub, buildPayload(campaign, attempts[idx]._id));
  });

  const attemptOps = []; const subOps = [];
  let accepted = 0; let failed = 0; let stale = 0;
  outcomes.forEach((o, idx) => {
    const set = { result: o.result, pushServiceStatus: o.status };
    if (o.category) { set.errorCategory = o.category; set.errorMessage = o.message; }
    attemptOps.push({ updateOne: { filter: { _id: attempts[idx]._id }, update: { $set: set } } });
    if (o.result === 'ACCEPTED_BY_PUSH_SERVICE') {
      accepted++;
      subOps.push({ updateOne: { filter: { _id: batch[idx]._id }, update: { $set: { lastSuccessAt: new Date(), failureCount: 0 } } } });
    } else if (o.result === 'STALE_SUBSCRIPTION') {
      stale++;
      subOps.push({ updateOne: { filter: { _id: batch[idx]._id }, update: { $set: { status: 'expired', lastFailureAt: new Date() } } } });
    } else {
      failed++;
      subOps.push({ updateOne: { filter: { _id: batch[idx]._id }, update: { $set: { lastFailureAt: new Date() }, $inc: { failureCount: 1 } } } });
    }
  });
  await Promise.all([DeliveryAttempt.bulkWrite(attemptOps, { ordered: false }), PushSubscription.bulkWrite(subOps, { ordered: false })]);

  totals.attempted += batch.length; totals.accepted += accepted; totals.failed += failed; totals.stale += stale;
  await Campaign.updateOne({ _id: campaign._id }, { $inc: {
    'stats.attempted': batch.length, 'stats.accepted': accepted, 'stats.failed': failed, 'stats.stale': stale
  } });
}

/**
 * Streams the audience in batches with bounded concurrency (never Promise.all over the whole audience).
 * Every attempt is recorded; one failing subscription never stops the run.
 */
async function sendCampaign(campaign) {
  const filter = audienceFilter(campaign);
  const totals = { targeted: await PushSubscription.countDocuments(filter), attempted: 0, accepted: 0, failed: 0, stale: 0 };
  await Campaign.updateOne({ _id: campaign._id }, { $set: { 'stats.targeted': totals.targeted } });

  const cursor = PushSubscription.find(filter).select('+endpoint +p256dh +auth').lean().cursor({ batchSize: config.push.batchSize });
  let batch = [];
  for await (const sub of cursor) {
    batch.push(sub);
    if (batch.length >= config.push.batchSize) { await processBatch(campaign, batch, totals); batch = []; }
  }
  if (batch.length) await processBatch(campaign, batch, totals);
  return totals;
}
module.exports = { sendCampaign, countTargets, audienceFilter, webpush };
