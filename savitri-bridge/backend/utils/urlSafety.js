'use strict';
const { bad } = require('./appError');

const isLocalHost = (h) => h === 'localhost' || h === '127.0.0.1' || h === '[::1]';

/** Normalises any http(s) URL to its origin. Throws on anything else. */
function normalizeOrigin(input) {
  let u;
  try { u = new URL(String(input).trim()); } catch { throw bad(`Invalid origin: ${String(input).slice(0, 80)}`); }
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && isLocalHost(u.hostname))) {
    throw bad('Origins must use https:// (http:// is only allowed for localhost)');
  }
  return u.origin;
}

/** Media URLs (icon/badge/image): https only (http allowed for localhost dev). */
function validateMediaUrl(input, label = 'Media URL') {
  if (input === undefined || input === null || input === '') return '';
  let u;
  try { u = new URL(String(input).trim()); } catch { throw bad(`${label} is not a valid URL`); }
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && isLocalHost(u.hostname))) throw bad(`${label} must be an https:// URL`);
  if (String(input).length > 2048) throw bad(`${label} is too long`);
  return u.toString();
}

/**
 * Target URLs must be http(s) and their origin must be one of the allowed origins
 * (project origins). No javascript:, data:, custom schemes, or open redirects to other sites.
 */
function validateTargetUrl(input, allowedOrigins) {
  let u;
  try { u = new URL(String(input || '').trim()); } catch { throw bad('Target URL must be a full, valid URL (https://...)'); }
  if (!['https:', 'http:'].includes(u.protocol)) throw bad('Target URL must use http(s)');
  if (u.username || u.password) throw bad('Target URL must not contain credentials');
  if (!allowedOrigins.includes(u.origin)) {
    throw bad(`Target URL origin (${u.origin}) is not in the project's allowed origins`, { allowedOrigins });
  }
  return u.toString();
}
module.exports = { normalizeOrigin, validateMediaUrl, validateTargetUrl };
