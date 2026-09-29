'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const Admin = require('../models/Admin');
const { AppError, forbidden } = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const unauth = (msg = 'Authentication required') => new AppError(401, 'UNAUTHENTICATED', msg);

const authenticate = asyncHandler(async (req, _res, next) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) throw unauth();
  let payload;
  try { payload = jwt.verify(h.slice(7), config.jwtSecret, { algorithms: ['HS256'] }); }
  catch (e) { throw unauth(e.name === 'TokenExpiredError' ? 'Session expired. Please sign in again.' : 'Invalid session'); }
  // Load the admin on every request: role changes, deactivation and password resets take effect immediately.
  const admin = await Admin.findById(payload.sub);
  if (!admin || !admin.active || admin.tokenVersion !== payload.tv) throw unauth('Session is no longer valid');
  req.admin = admin;
  next();
});

/** Backend RBAC. Hiding buttons in the UI is not security; this is. */
const authorize = (...roles) => (req, _res, next) => (roles.includes(req.admin.role) ? next() : next(forbidden()));

const R = {
  ALL: ['SUPER_ADMIN', 'ADMIN', 'MARKETER', 'VIEWER'],
  OPS: ['SUPER_ADMIN', 'ADMIN'],
  WRITE: ['SUPER_ADMIN', 'ADMIN', 'MARKETER'],
  LOGS: ['SUPER_ADMIN', 'ADMIN', 'VIEWER'],
  SUPER: ['SUPER_ADMIN']
};
module.exports = { authenticate, authorize, R };
