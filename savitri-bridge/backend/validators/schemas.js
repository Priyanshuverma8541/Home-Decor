'use strict';
const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const url = z.string().trim().max(2048);
const optUrl = z.string().trim().max(2048).optional().or(z.literal(''));
const tz = z.string().trim().min(1).max(64).refine((v) => { try { new Intl.DateTimeFormat('en', { timeZone: v }); return true; } catch { return false; } }, 'Unknown timezone');

const password = z.string().min(10, 'Password must be at least 10 characters').max(128)
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v), 'Password needs upper case, lower case and a number');

const content = {
  title: z.string().trim().min(1, 'Title is required').max(100),
  body: z.string().trim().min(1, 'Message is required').max(300),
  targetUrl: url,
  iconUrl: optUrl, badgeUrl: optUrl, imageUrl: optUrl,
  notificationTag: z.string().trim().max(60).optional().default(''),
  requireInteraction: z.boolean().optional().default(false),
  type: z.enum(['MARKETING', 'TRANSACTIONAL']).default('MARKETING')
};

exports.login = z.object({ email: z.string().trim().toLowerCase().email().max(160), password: z.string().min(1).max(128) }).strict();
exports.changePassword = z.object({ currentPassword: z.string().min(1).max(128), newPassword: password }).strict();
exports.adminCreate = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email().max(160), role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MARKETER', 'VIEWER']), password }).strict();
exports.adminUpdate = z.object({ name: z.string().trim().min(2).max(80).optional(), role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MARKETER', 'VIEWER']).optional(), active: z.boolean().optional() }).strict();
exports.adminReset = z.object({ newPassword: password }).strict();

exports.project = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().default(''),
  websiteUrl: url.optional().default(''),
  allowedOrigins: z.array(z.string().trim().max(300)).max(20).default([]),
  defaultIconUrl: optUrl.default(''), defaultBadgeUrl: optUrl.default(''),
  status: z.enum(['active', 'inactive']).optional()
}).strict();

const audience = {
  audienceType: z.enum(['ALL_ACTIVE', 'PROJECT', 'SUBSCRIBER']),
  projectId: objectId.optional(),
  selectedSubscriberId: z.string().regex(/^SUB_[A-Za-z0-9]{6,20}$/).optional()
};
exports.campaign = z.object({
  campaignName: z.string().trim().min(2).max(120), ...content, ...audience,
  templateId: objectId.optional()
}).strict().superRefine((v, ctx) => {
  if (v.audienceType === 'PROJECT' && !v.projectId) ctx.addIssue({ code: 'custom', path: ['projectId'], message: 'Select a project' });
  if (v.audienceType === 'SUBSCRIBER' && !v.selectedSubscriberId) ctx.addIssue({ code: 'custom', path: ['selectedSubscriberId'], message: 'Select a subscriber' });
});
exports.schedule = z.object({ scheduledAt: z.string().datetime({ offset: true }), timezone: tz.default('Asia/Kolkata') }).strict();
exports.testPush = z.object({ title: content.title.optional(), body: content.body.optional(), confirm: z.literal(true, { errorMap: () => ({ message: 'Confirmation required' }) }) }).strict();
exports.confirmSend = z.object({ confirm: z.literal(true, { errorMap: () => ({ message: 'Confirmation required' }) }) }).strict();
exports.estimate = z.object({ audienceType: z.enum(['ALL_ACTIVE', 'PROJECT', 'SUBSCRIBER']), projectId: objectId.optional(), selectedSubscriberId: z.string().optional() }).strict();

exports.template = z.object({
  templateName: z.string().trim().min(2).max(120), projectId: objectId.optional().or(z.literal('')).or(z.null()),
  ...content, targetUrl: url.optional().default(''), active: z.boolean().optional().default(true)
}).strict();

// ---- public ----
const pushSub = z.object({
  endpoint: z.string().url().max(2048).refine((u) => u.startsWith('https://'), 'Push endpoint must be https'),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({ p256dh: z.string().min(20).max(200), auth: z.string().min(8).max(100) })
});
const deviceClient = z.object({
  browser: z.string().max(60).optional(), browserVersion: z.string().max(40).optional(), os: z.string().max(60).optional(), osVersion: z.string().max(40).optional(),
  platform: z.string().max(60).optional(), screenWidth: z.number().optional(), screenHeight: z.number().optional(), pixelRatio: z.number().optional(),
  language: z.string().max(20).optional(), languages: z.array(z.string().max(20)).max(10).optional(), timezone: z.string().max(64).optional(),
  locationPermission: z.enum(['granted', 'denied', 'prompt', 'unknown']).optional(), notificationPermission: z.enum(['granted', 'denied', 'default', 'unknown']).optional()
}).partial();
const identity = { subscriberId: z.string().regex(/^SUB_[A-Za-z0-9]{6,20}$/), token: z.string().min(20).max(60) };
exports.pubSubscribe = z.object({
  publicProjectId: z.string().regex(/^pk_[a-f0-9]{20}$/), subscription: pushSub, device: deviceClient.optional().default({}),
  subscriberId: identity.subscriberId.optional(), token: identity.token.optional()
}).strict();
exports.pubIdentity = z.object({ ...identity, endpoint: z.string().url().max(2048).optional() }).strict();
exports.pubMetadata = z.object({ ...identity, device: deviceClient }).strict();
exports.pubLocation = z.object({
  ...identity,
  latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(1e6).optional(), timestamp: z.number().optional()
}).strict();
exports.pubLocationPermission = z.object({ ...identity, permission: z.enum(['granted', 'denied', 'prompt', 'unknown']) }).strict();
exports.pubClick = z.object({ sendId: objectId, clickToken: z.string().min(20).max(60) }).strict();
exports.objectId = objectId;
