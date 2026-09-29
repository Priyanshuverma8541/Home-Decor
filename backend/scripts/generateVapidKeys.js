const webpush = require("web-push");
const keys = webpush.generateVAPIDKeys();
console.log("Add these once to your backend environment (do not expose the private key in frontend code):");
console.log(`VAPID_SUBJECT=mailto:savitrilivings@gmail.com`);
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
