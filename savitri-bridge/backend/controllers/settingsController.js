'use strict';
const config = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');

// Read-only, non-secret operational info. No keys, secrets, URIs or passwords are ever returned.
exports.get = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: {
    version: '1.0.0', environment: config.isProd ? 'production' : 'development',
    publicApiUrl: config.publicApiUrl, publicApiBase: `${config.publicApiUrl}/api/v1/public`, vapidPublicKey: config.vapid.publicKey,
    dashboardOrigins: config.frontendOrigins,
    scheduler: config.scheduler, push: config.push,
    cloudinaryConfigured: config.cloudinary.configured,
    nominatim: { baseUrl: config.nominatim.baseUrl },
    rateLimits: { windowMinutes: config.rate.windowMs / 60000, login: config.rate.login, subscribe: config.rate.subscribe, location: config.rate.location, click: config.rate.click, upload: config.rate.upload, send: config.rate.send },
    jwtExpiresIn: config.jwtExpiresIn
  } });
});
