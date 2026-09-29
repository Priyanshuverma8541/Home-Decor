'use strict';
const cors = require('cors');
const config = require('../config/env');
const { allowedOriginSet } = require('../services/originCache');

const devOrigins = ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'];

// Admin API: only the configured dashboard origin(s) (plus common localhost ports outside production).
const adminCors = cors({
  origin(origin, cb) {
    if (!origin) return cb(null, false);
    const ok = config.frontendOrigins.includes(origin) || (!config.isProd && devOrigins.includes(origin));
    cb(ok ? null : new Error('CORS_NOT_ALLOWED'), ok);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 600
});

// Public API: origin must belong to some active project (or the dashboard). The per-project check
// (origin vs. that project's allowedOrigins) happens again inside the handlers. CORS is NOT authentication.
async function publicCors(req, res, next) {
  try {
    res.setHeader('Vary', 'Origin');
    const origin = req.headers.origin;
    if (origin) {
      const set = await allowedOriginSet();
      if (set.has(origin) || (!config.isProd && devOrigins.includes(origin))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Max-Age', '600');
      }
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  } catch (e) { next(e); }
}
module.exports = { adminCors, publicCors };
