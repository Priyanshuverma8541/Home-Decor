'use strict';
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', index: true },
  actorEmail: String,
  action: { type: String, required: true, index: true },
  resourceType: String,
  resourceId: String,
  metadata: mongoose.Schema.Types.Mixed,
  ip: String
}, { timestamps: { createdAt: true, updatedAt: false } });
auditLogSchema.index({ createdAt: -1 });
module.exports = mongoose.model('AuditLog', auditLogSchema);
