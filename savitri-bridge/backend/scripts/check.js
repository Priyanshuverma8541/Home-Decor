'use strict';
// Offline smoke test: loads every module with dummy env to catch wiring mistakes. No database needed.
process.env.SB_SKIP_ENV_EXIT = '1';
const webpush = require('web-push');
const k = webpush.generateVAPIDKeys();
Object.assign(process.env, { MONGO_URI: 'mongodb://localhost/x', JWT_SECRET: 'x'.repeat(40), VAPID_PUBLIC_KEY: k.publicKey, VAPID_PRIVATE_KEY: k.privateKey, VAPID_SUBJECT: 'mailto:a@b.co', INITIAL_ADMIN_NAME: 'a', INITIAL_ADMIN_EMAIL: 'a@b.co', INITIAL_ADMIN_PASSWORD: 'Passw0rdPassw0rd', FRONTEND_URL: 'http://localhost:5500', ALLOW_MISSING_CLOUDINARY: 'true' });
require('../app');
require('../jobs/scheduler');
console.log('OK: all modules load and routes mount');
process.exit(0);
