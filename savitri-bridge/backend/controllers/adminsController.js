'use strict';
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const { bad, notFound, conflict } = require('../utils/appError');
const { audit } = require('../services/auditService');

// Safeguard: there must always be at least one active Super Admin.
async function assertNotLastSuper(target, changes) {
  const losing = target.role === 'SUPER_ADMIN' && target.active &&
    ((changes.role && changes.role !== 'SUPER_ADMIN') || changes.active === false);
  if (!losing) return;
  const others = await Admin.countDocuments({ _id: { $ne: target._id }, role: 'SUPER_ADMIN', active: true });
  if (others === 0) throw conflict('This is the only active Super Admin. Create or promote another Super Admin first.');
}

exports.list = asyncHandler(async (_req, res) => {
  const admins = await Admin.find().sort({ createdAt: 1 }).lean();
  res.json({ success: true, data: admins.map(({ passwordHash, tokenVersion, __v, ...a }) => a) });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, role, password } = req.body;
  if (await Admin.findOne({ email })) throw conflict('An admin with this email already exists');
  const admin = await Admin.create({ name, email, role, passwordHash: await bcrypt.hash(password, 12), createdBy: req.admin._id });
  await audit(req, 'ADMIN_CREATED', 'Admin', admin._id, { email, role });
  res.status(201).json({ success: true, data: admin });
});

exports.update = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) throw notFound('Admin');
  const isSelf = String(admin._id) === String(req.admin._id);
  if (isSelf && (req.body.role !== undefined && req.body.role !== admin.role)) throw bad('You cannot change your own role');
  if (isSelf && req.body.active === false) throw bad('You cannot deactivate your own account');
  await assertNotLastSuper(admin, req.body);
  const roleChanged = req.body.role && req.body.role !== admin.role;
  const activeChanged = req.body.active !== undefined && req.body.active !== admin.active;
  const oldRole = admin.role;
  Object.assign(admin, req.body);
  if (roleChanged || activeChanged) admin.tokenVersion += 1; // forces re-login with the new rights
  await admin.save();
  if (roleChanged) await audit(req, 'ADMIN_ROLE_CHANGED', 'Admin', admin._id, { from: oldRole, to: admin.role });
  if (activeChanged) await audit(req, admin.active ? 'ADMIN_ACTIVATED' : 'ADMIN_DEACTIVATED', 'Admin', admin._id);
  res.json({ success: true, data: admin });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id).select('+passwordHash');
  if (!admin) throw notFound('Admin');
  admin.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  admin.tokenVersion += 1;
  await admin.save();
  await audit(req, 'ADMIN_PASSWORD_RESET', 'Admin', admin._id);
  res.json({ success: true, data: { message: 'Password reset. The admin has been signed out everywhere.' } });
});
