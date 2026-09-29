'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const { AppError, bad } = require('../utils/appError');
const { audit } = require('../services/auditService');

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12); // equalises timing for unknown emails
const sign = (a) => jwt.sign({ sub: String(a._id), role: a.role, tv: a.tokenVersion }, config.jwtSecret, { algorithm: 'HS256', expiresIn: config.jwtExpiresIn });

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, admin ? admin.passwordHash : DUMMY_HASH);
  if (!admin || !ok || !admin.active) throw new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
  admin.lastLoginAt = new Date();
  await admin.save();
  req.admin = admin;
  await audit(req, 'ADMIN_LOGIN', 'Admin', admin._id);
  res.json({ success: true, data: { token: sign(admin), admin } });
});

exports.me = asyncHandler(async (req, res) => res.json({ success: true, data: { admin: req.admin } }));

exports.changePassword = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id).select('+passwordHash');
  if (!(await bcrypt.compare(req.body.currentPassword, admin.passwordHash))) throw bad('Current password is incorrect');
  admin.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  admin.tokenVersion += 1; // signs out every other session
  await admin.save();
  await audit(req, 'ADMIN_PASSWORD_CHANGED', 'Admin', admin._id);
  res.json({ success: true, data: { token: sign(admin) } });
});

/** Creates the initial Super Admin once. Never overwrites an existing account or password. */
exports.seedInitialAdmin = async () => {
  const { name, email, password } = config.initialAdmin;
  if (await Admin.findOne({ email })) return;
  await Admin.create({ name, email, role: 'SUPER_ADMIN', passwordHash: await bcrypt.hash(password, 12) });
  console.log(`[auth] Initial Super Admin created (${email})`);
};
