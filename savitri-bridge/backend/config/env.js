'use strict';
require('dotenv').config();

const isPlaceholder = (v) => !v || /^(your_|replace_with)/i.test(String(v).trim());
const num = (v, d) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d);
const bool = (v, d = false) => (v === undefined ? d : String(v).toLowerCase() === 'true');
const env = process.env;

const errors = [];
const need = (name) => { if (isPlaceholder(env[name])) errors.push(`${name} is missing or still a placeholder`); };

['MONGO_URI', 'JWT_SECRET', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT',
  'INITIAL_ADMIN_NAME', 'INITIAL_ADMIN_EMAIL', 'INITIAL_ADMIN_PASSWORD', 'FRONTEND_URL'].forEach(need);

if (!isPlaceholder(env.JWT_SECRET) && env.JWT_SECRET.length < 32) errors.push('JWT_SECRET must be at least 32 characters');
if (!isPlaceholder(env.VAPID_SUBJECT) && !/^(mailto:|https:\/\/)/.test(env.VAPID_SUBJECT)) errors.push('VAPID_SUBJECT must start with mailto: or https://');

const allowMissingCloudinary = bool(env.ALLOW_MISSING_CLOUDINARY, false);
const cloudinaryConfigured = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].every((k) => !isPlaceholder(env[k]));
if (!cloudinaryConfigured && !allowMissingCloudinary) {
  errors.push('CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET are required (or set ALLOW_MISSING_CLOUDINARY=true for local development)');
}

if (errors.length && !process.env.SB_SKIP_ENV_EXIT) {
  // Only variable NAMES are printed, never values.
  console.error('\n[SavitriBridge] Configuration error(s):\n - ' + errors.join('\n - ') +
    '\n\nCopy .env.example to .env and fill it in. Run "npm run generate-vapid" for VAPID keys.\n');
  process.exit(1);
}

const port = num(env.PORT, 5000);
const stripSlash = (s) => String(s || '').trim().replace(/\/+$/, '');

module.exports = {
  isProd: env.NODE_ENV === 'production',
  port,
  publicApiUrl: stripSlash(env.PUBLIC_API_URL) || `http://localhost:${port}`,
  frontendOrigins: String(env.FRONTEND_URL || '').split(',').map(stripSlash).filter(Boolean),
  mongoUri: env.MONGO_URI,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN || '8h',
  initialAdmin: { name: env.INITIAL_ADMIN_NAME, email: String(env.INITIAL_ADMIN_EMAIL || '').toLowerCase(), password: env.INITIAL_ADMIN_PASSWORD },
  vapid: { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY, subject: env.VAPID_SUBJECT },
  push: { ttl: num(env.PUSH_TTL_SECONDS, 86400), batchSize: num(env.PUSH_BATCH_SIZE, 200), concurrency: num(env.PUSH_CONCURRENCY, 20) },
  cloudinary: { configured: cloudinaryConfigured, cloudName: env.CLOUDINARY_CLOUD_NAME, apiKey: env.CLOUDINARY_API_KEY, apiSecret: env.CLOUDINARY_API_SECRET },
  nominatim: { baseUrl: stripSlash(env.NOMINATIM_BASE_URL) || 'https://nominatim.openstreetmap.org', userAgent: env.NOMINATIM_USER_AGENT || 'SavitriBridge/1.0' },
  scheduler: { enabled: bool(env.SCHEDULER_ENABLED, true), intervalSeconds: num(env.SCHEDULER_INTERVAL_SECONDS, 30) },
  rate: {
    windowMs: num(env.RATE_WINDOW_MINUTES, 15) * 60 * 1000,
    login: num(env.RATE_LOGIN_MAX, 10),
    subscribe: num(env.RATE_PUBLIC_SUBSCRIBE_MAX, 60),
    location: num(env.RATE_PUBLIC_LOCATION_MAX, 30),
    click: num(env.RATE_PUBLIC_CLICK_MAX, 300),
    upload: num(env.RATE_UPLOAD_MAX, 40),
    send: num(env.RATE_SEND_MAX, 40)
  }
};
