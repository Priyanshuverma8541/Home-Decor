'use strict';
const crypto = require('crypto');
const config = require('../config/env');

const rand = (bytes) => crypto.randomBytes(bytes).toString('hex');
const newSubscriberId = () => 'SUB_' + crypto.randomBytes(9).toString('base64url').replace(/[-_]/g, 'x');
const newPublicProjectId = () => 'pk_' + rand(10);
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

const hmac = (purpose, value) =>
  crypto.createHmac('sha256', config.jwtSecret).update(`${purpose}:${value}`).digest('base64url').slice(0, 43);
const safeEqual = (a, b) => {
  const A = Buffer.from(String(a || '')); const B = Buffer.from(String(b || ''));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
};
// Subscriber token: given once to the browser at registration, proves it owns the subscriber record.
const subscriberToken = (subscriberId) => hmac('subscriber', subscriberId);
const verifySubscriberToken = (subscriberId, token) => safeEqual(subscriberToken(subscriberId), token);
// Click token: embedded in each push payload so click reports cannot be forged for arbitrary send ids.
const clickToken = (sendId) => hmac('click', sendId);
const verifyClickToken = (sendId, token) => safeEqual(clickToken(sendId), token);

module.exports = { newSubscriberId, newPublicProjectId, sha256, subscriberToken, verifySubscriberToken, clickToken, verifyClickToken };
