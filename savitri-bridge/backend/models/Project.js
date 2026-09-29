'use strict';
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  publicProjectId: { type: String, required: true, unique: true }, // NOT a secret
  description: { type: String, default: '', maxlength: 500 },
  websiteUrl: { type: String, default: '' },
  allowedOrigins: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  defaultIconUrl: { type: String, default: '' },
  defaultBadgeUrl: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

projectSchema.index({ name: 'text', description: 'text' });
module.exports = mongoose.model('Project', projectSchema);
