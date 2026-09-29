'use strict';
const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  templateName: { type: String, required: true, trim: true, maxlength: 120 },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true }, // null = global template
  type: { type: String, enum: ['MARKETING', 'TRANSACTIONAL'], default: 'MARKETING' },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  body: { type: String, required: true, trim: true, maxlength: 300 },
  targetUrl: { type: String, default: '' },
  iconUrl: { type: String, default: '' },
  badgeUrl: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  notificationTag: { type: String, default: '', maxlength: 60 },
  requireInteraction: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });
module.exports = mongoose.model('Template', templateSchema);
