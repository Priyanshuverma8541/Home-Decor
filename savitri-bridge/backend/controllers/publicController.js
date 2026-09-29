'use strict';
const Project = require('../models/Project');
const Subscriber = require('../models/Subscriber');
const PushSubscription = require('../models/PushSubscription');
const DeliveryAttempt = require('../models/DeliveryAttempt');
const Campaign = require('../models/Campaign');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/env');
const { AppError, notFound } = require('../utils/appError');
const { newSubscriberId, sha256, subscriberToken, verifySubscriberToken, verifyClickToken } = require('../utils/ids');
const { buildDeviceInfo, clip } = require('../utils/deviceInfo');
const { reverseGeocode } = require('../services/geocodingService');

// Public endpoints are protected by: input validation, rate limits, project allowed-origin checks and
// per-subscriber tokens. CORS alone is never treated as authentication.
function assertOrigin(req, project) {
  const origin = req.headers.origin;
  if (!origin || !project.allowedOrigins.includes(origin)) throw new AppError(403, 'ORIGIN_NOT_ALLOWED', 'This website origin is not allowed for the project');
}
const deny = () => new AppError(403, 'INVALID_SUBSCRIBER_TOKEN', 'Subscriber credentials are invalid');

async function loadOwned(req) {
  const { subscriberId, token } = req.body;
  if (!verifySubscriberToken(subscriberId, token)) throw deny();
  const sub = await Subscriber.findOne({ subscriberId, status: { $ne: 'deleted' } });
  if (!sub) throw deny();
  const project = await Project.findById(sub.projectId).lean();
  if (!project || project.status !== 'active') throw new AppError(403, 'PROJECT_INACTIVE', 'Project is not active');
  assertOrigin(req, project);
  return { sub, project };
}

function applyClientMeta(sub, req, d = {}) {
  sub.device = buildDeviceInfo(req.get('user-agent'), d);
  if (d.language) sub.language = clip(d.language, 20);
  if (d.languages) sub.languages = d.languages.map((l) => clip(l, 20));
  if (d.timezone) sub.timezone = clip(d.timezone, 64);
  if (d.notificationPermission) sub.permissions.push = d.notificationPermission;
  if (d.locationPermission) sub.permissions.location = d.locationPermission;
  sub.lastSeenAt = new Date();
}

exports.projectConfig = asyncHandler(async (req, res) => {
  const p = await Project.findOne({ publicProjectId: req.params.publicProjectId, status: 'active' }).lean();
  if (!p) throw notFound('Project');
  assertOrigin(req, p);
  res.json({ success: true, data: { publicProjectId: p.publicProjectId, projectName: p.name, vapidPublicKey: config.vapid.publicKey } });
});

exports.subscribe = asyncHandler(async (req, res) => {
  const { publicProjectId, subscription, device, subscriberId, token } = req.body;
  const project = await Project.findOne({ publicProjectId, status: 'active' }).lean();
  if (!project) throw notFound('Project');
  assertOrigin(req, project);

  const endpointHash = sha256(subscription.endpoint);
  const expiration = subscription.expirationTime ? new Date(subscription.expirationTime) : undefined;
  let ps = await PushSubscription.findOne({ endpointHash });
  let sub;

  if (ps) { // duplicate endpoint or changed keys: refresh in place
    if (String(ps.projectId) !== String(project._id)) throw new AppError(409, 'ENDPOINT_IN_USE', 'This browser subscription belongs to another project');
    sub = await Subscriber.findById(ps.subscriber);
  }
  if (!sub && subscriberId && token && verifySubscriberToken(subscriberId, token)) {
    sub = await Subscriber.findOne({ subscriberId, projectId: project._id, status: { $ne: 'deleted' } });
  }
  if (!sub) {
    for (let i = 0; i < 3 && !sub; i++) {
      try { sub = await Subscriber.create({ subscriberId: newSubscriberId(), projectId: project._id, status: 'active' }); }
      catch (e) { if (e.code !== 11000) throw e; }
    }
  }
  applyClientMeta(sub, req, device);
  sub.permissions.push = 'granted';
  const disabled = sub.status === 'disabled';
  if (!disabled) sub.status = 'active';
  await sub.save();

  const fields = { endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, expirationTime: expiration, status: disabled ? 'disabled' : 'active', failureCount: 0 };
  if (ps) { Object.assign(ps, fields); await ps.save(); }
  else {
    try { ps = await PushSubscription.create({ ...fields, endpointHash, subscriber: sub._id, subscriberId: sub.subscriberId, projectId: project._id }); }
    catch (e) { if (e.code !== 11000) throw e; ps = await PushSubscription.findOneAndUpdate({ endpointHash }, { $set: fields }, { new: true }); }
  }
  res.status(201).json({ success: true, data: { subscriberId: sub.subscriberId, token: subscriberToken(sub.subscriberId), status: sub.status, pushStatus: ps.status } });
});

exports.status = asyncHandler(async (req, res) => {
  const { sub } = await loadOwned(req);
  let pushActive = false;
  if (req.body.endpoint) {
    const ps = await PushSubscription.findOne({ endpointHash: sha256(req.body.endpoint), subscriber: sub._id }).lean();
    pushActive = ps?.status === 'active';
  } else pushActive = !!(await PushSubscription.exists({ subscriber: sub._id, status: 'active' }));
  res.json({ success: true, data: {
    subscriberId: sub.subscriberId, status: sub.status, pushActive, permissions: sub.permissions,
    device: sub.device ? { deviceType: sub.device.deviceType, browser: sub.device.browser, os: sub.device.os } : null,
    location: sub.location?.capturedAt ? { city: sub.location.city, state: sub.location.state, country: sub.location.country, capturedAt: sub.location.capturedAt } : null
  } });
});

exports.metadata = asyncHandler(async (req, res) => {
  const { sub } = await loadOwned(req);
  applyClientMeta(sub, req, req.body.device);
  await sub.save();
  res.json({ success: true, data: { subscriberId: sub.subscriberId, updated: true } });
});

exports.location = asyncHandler(async (req, res) => {
  const { sub } = await loadOwned(req);
  const { latitude, longitude, accuracy } = req.body;
  const prev = sub.location;
  const near = prev && prev.geocodeStatus === 'OK' && Math.abs(prev.latitude - latitude) < 0.001 && Math.abs(prev.longitude - longitude) < 0.001;
  const geo = near ? prev : await reverseGeocode(latitude, longitude); // avoids repeated lookups for identical places
  sub.location = {
    latitude, longitude, accuracy, capturedAt: new Date(),
    country: geo.country || undefined, state: geo.state || undefined, city: geo.city || undefined, postalCode: geo.postalCode || undefined, displayName: geo.displayName || undefined,
    geocodeStatus: near ? 'OK' : (geo.status || 'FAILED'), source: 'user-permitted-browser-geolocation'
  };
  sub.permissions.location = 'granted';
  sub.lastSeenAt = new Date();
  await sub.save();
  res.json({ success: true, data: { city: sub.location.city, state: sub.location.state, country: sub.location.country, geocodeStatus: sub.location.geocodeStatus, attribution: 'Address data © OpenStreetMap contributors (ODbL)' } });
});

exports.locationPermission = asyncHandler(async (req, res) => {
  const { sub } = await loadOwned(req);
  sub.permissions.location = req.body.permission;
  if (req.body.permission === 'denied') sub.location = undefined; // permission revoked: drop stored coordinates
  await sub.save();
  res.json({ success: true, data: { permission: sub.permissions.location } });
});

exports.unsubscribe = asyncHandler(async (req, res) => {
  const { sub } = await loadOwned(req);
  const f = { subscriber: sub._id, status: { $in: ['active', 'disabled'] } };
  if (req.body.endpoint) f.endpointHash = sha256(req.body.endpoint);
  await PushSubscription.updateMany(f, { $set: { status: 'unsubscribed' } });
  if (!(await PushSubscription.exists({ subscriber: sub._id, status: { $in: ['active', 'disabled'] } })) && sub.status !== 'disabled') sub.status = 'inactive';
  sub.permissions.push = sub.permissions.push === 'denied' ? 'denied' : 'default';
  await sub.save();
  res.json({ success: true, data: { subscriberId: sub.subscriberId, status: sub.status } });
});

// Called by the Service Worker. Authenticated by the signed click token embedded in the push payload.
exports.click = asyncHandler(async (req, res) => {
  const { sendId, clickToken } = req.body;
  if (!verifyClickToken(sendId, clickToken)) throw new AppError(403, 'INVALID_CLICK_TOKEN', 'Invalid click token');
  const a = await DeliveryAttempt.findOneAndUpdate({ _id: sendId, clickedAt: { $exists: false } }, { $set: { clickedAt: new Date() } }, { new: true });
  if (a) await Campaign.updateOne({ _id: a.campaignId }, { $inc: { 'stats.clicks': 1 } }); // first click only: no double counting
  res.json({ success: true, data: { counted: !!a } });
});
