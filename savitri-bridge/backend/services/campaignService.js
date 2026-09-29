'use strict';
const Campaign = require('../models/Campaign');
const Project = require('../models/Project');
const Subscriber = require('../models/Subscriber');
const { bad, notFound, conflict } = require('../utils/appError');
const { validateTargetUrl, validateMediaUrl } = require('../utils/urlSafety');
const push = require('./pushService');

/** Origins a campaign's target URL may point to, given its audience. */
async function allowedOriginsFor(data) {
  if (data.audienceType === 'ALL_ACTIVE') {
    const list = await Project.find({ status: 'active' }).distinct('allowedOrigins');
    if (!list.length) throw bad('No active project has allowed origins configured');
    return list;
  }
  if (!data.projectId) throw bad('projectId is required for this audience');
  const project = await Project.findById(data.projectId).lean();
  if (!project) throw notFound('Project');
  return project.allowedOrigins;
}

/** Validates + normalises campaign content. Used by create/update/test-send. */
async function prepareContent(data) {
  if (data.audienceType === 'SUBSCRIBER') {
    const sub = await Subscriber.findOne({ subscriberId: data.selectedSubscriberId }).lean();
    if (!sub) throw notFound('Subscriber');
    data.projectId = sub.projectId; // subscriber decides project
  }
  const origins = await allowedOriginsFor(data);
  data.targetUrl = validateTargetUrl(data.targetUrl, origins);
  data.iconUrl = validateMediaUrl(data.iconUrl, 'Icon URL');
  data.badgeUrl = validateMediaUrl(data.badgeUrl, 'Badge URL');
  data.imageUrl = validateMediaUrl(data.imageUrl, 'Image URL');
  if (data.audienceType !== 'SUBSCRIBER') delete data.selectedSubscriberId;
  if (data.audienceType === 'ALL_ACTIVE') data.projectId = undefined;
  return data;
}

/** Atomic claim: only ONE caller can move a campaign into PROCESSING, so no duplicate sends. */
function claim(filter) {
  return Campaign.findOneAndUpdate(filter, { $set: { status: 'PROCESSING', lockedAt: new Date(), sentAt: new Date(), lastError: '' } }, { new: true });
}

/** Runs the actual send for an already-claimed (PROCESSING) campaign and records the final status. */
async function run(campaign) {
  try {
    const t = await push.sendCampaign(campaign);
    let status = 'COMPLETED';
    let lastError = '';
    if (t.targeted === 0) { status = 'FAILED'; lastError = 'No active subscriptions matched the audience'; }
    else if (t.accepted === 0) { status = 'FAILED'; lastError = 'The push service accepted none of the attempts'; }
    else if (t.failed + t.stale > 0) status = 'PARTIALLY_FAILED';
    await Campaign.updateOne({ _id: campaign._id }, { $set: { status, completedAt: new Date(), lastError }, $unset: { lockedAt: 1 } });
  } catch (e) {
    console.error('[campaign] run failed:', campaign._id.toString(), e.message);
    await Campaign.updateOne({ _id: campaign._id }, { $set: { status: 'FAILED', completedAt: new Date(), lastError: String(e.message).slice(0, 200) }, $unset: { lockedAt: 1 } });
  }
}

/** Send now: claim synchronously (so the API can answer fast and safely), deliver in the background. */
async function sendNow(id) {
  const c = await claim({ _id: id, status: { $in: ['DRAFT', 'SCHEDULED'] } });
  if (!c) throw conflict('Campaign is not in a sendable state (already processing, completed or cancelled)');
  setImmediate(() => run(c));
  return c;
}

async function schedule(id, scheduledAt, timezone) {
  const when = new Date(scheduledAt);
  if (Number.isNaN(when.getTime())) throw bad('Invalid schedule date/time');
  if (when.getTime() < Date.now() + 30 * 1000) throw bad('Scheduled time must be in the future');
  const c = await Campaign.findOneAndUpdate({ _id: id, status: { $in: ['DRAFT', 'SCHEDULED'] } },
    { $set: { status: 'SCHEDULED', scheduledAt: when, timezone } }, { new: true });
  if (!c) throw conflict('Only draft or scheduled campaigns can be (re)scheduled');
  return c;
}

async function cancel(id) {
  const c = await Campaign.findOneAndUpdate({ _id: id, status: { $in: ['DRAFT', 'SCHEDULED'] } }, { $set: { status: 'CANCELLED' } }, { new: true });
  if (!c) throw conflict('Only draft or scheduled campaigns can be cancelled (processing campaigns cannot be stopped)');
  return c;
}
module.exports = { prepareContent, sendNow, schedule, cancel, claim, run };
