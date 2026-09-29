'use strict';
const UAParser = require('ua-parser-js');

const clip = (v, n = 120) => (v === undefined || v === null ? undefined : String(v).slice(0, n));
const num = (v, min, max) => { const n = Number(v); return Number.isFinite(n) && n >= min && n <= max ? n : undefined; };

/** Best-effort device metadata. Server-side UA parsing is preferred; client values fill gaps. Nothing here is identity. */
function buildDeviceInfo(userAgent, client = {}) {
  const r = new UAParser(userAgent || '').getResult();
  let deviceType = r.device.type;
  if (!deviceType) deviceType = /mobile|android|iphone/i.test(userAgent || '') ? 'mobile' : 'desktop';
  if (deviceType === 'wearable' || deviceType === 'smarttv' || deviceType === 'console' || deviceType === 'embedded') deviceType = 'other';
  return {
    deviceType,
    browser: r.browser.name || clip(client.browser),
    browserVersion: r.browser.version || clip(client.browserVersion),
    os: r.os.name || clip(client.os),
    osVersion: r.os.version || clip(client.osVersion),
    deviceModel: clip(r.device.model),
    userAgent: clip(userAgent, 300),
    screenWidth: num(client.screenWidth, 0, 20000),
    screenHeight: num(client.screenHeight, 0, 20000),
    pixelRatio: num(client.pixelRatio, 0, 20),
    platform: clip(client.platform, 60)
  };
}
module.exports = { buildDeviceInfo, clip };
