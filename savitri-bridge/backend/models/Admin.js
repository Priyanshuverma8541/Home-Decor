'use strict';
const mongoose = require('mongoose');
const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MARKETER', 'VIEWER'];

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, default: 'VIEWER', required: true },
  active: { type: Boolean, default: true },
  tokenVersion: { type: Number, default: 0 }, // bump to invalidate every issued JWT
  lastLoginAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

adminSchema.set('toJSON', { transform: (_d, r) => { delete r.passwordHash; delete r.tokenVersion; delete r.__v; return r; } });
module.exports = mongoose.model('Admin', adminSchema);
module.exports.ROLES = ROLES;
