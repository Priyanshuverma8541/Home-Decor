'use strict';
// Generates a VAPID key pair. Copy the values into your environment manually.
// Never regenerate keys on an existing deployment: every existing browser subscription would stop working.
const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log('\nAdd these to your backend environment (Render dashboard / .env):\n');
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
console.log('\nKeep VAPID_PRIVATE_KEY secret. Do NOT put it in the frontend.\n');
