'use strict';
const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const make = (max, message, extra = {}) => rateLimit({
  windowMs: config.rate.windowMs, max, standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message } }, ...extra
});
module.exports = {
  login: make(config.rate.login, 'Too many login attempts. Try again later.', { skipSuccessfulRequests: true }),
  subscribe: make(config.rate.subscribe, 'Too many registration requests. Try again later.'),
  location: make(config.rate.location, 'Too many location updates. Try again later.'),
  click: make(config.rate.click, 'Too many click reports.'),
  publicGeneral: make(600, 'Too many requests.'),
  upload: make(config.rate.upload, 'Too many uploads. Try again later.'),
  send: make(config.rate.send, 'Too many send actions. Try again later.')
};
