'use strict';
const mongoose = require('mongoose');
const STATUSES = ['DRAFT', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'PARTIALLY_FAILED', 'FAILED', 'CANCELLED'];

const campaignSchema = new mongoose.Schema({
  campaignName: { type: String, required: true, trim: true, maxlength: 120 },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true }, // optional when audience is ALL_ACTIVE
  type: { type: String, enum: ['MARKETING', 'TRANSACTIONAL'], default: 'MARKETING' },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  body: { type: String, required: true, trim: true, maxlength: 300 },
  targetUrl: { type: String, required: true },
  iconUrl: { type: String, default: '' },
  badgeUrl: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  notificationTag: { type: String, default: '', maxlength: 60 },
  requireInteraction: { type: Boolean, default: false },
  audienceType: { type: String, enum: ['ALL_ACTIVE', 'PROJECT', 'SUBSCRIBER'], required: true },
  selectedSubscriberId: { type: String }, // SUB_xxx when audienceType = SUBSCRIBER
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  isTest: { type: Boolean, default: false },
  status: { type: String, enum: STATUSES, default: 'DRAFT', index: true },
  scheduledAt: { type: Date, index: true }, // stored in UTC
  timezone: { type: String, default: 'Asia/Kolkata' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  sentAt: Date,
  completedAt: Date,
  lockedAt: Date,
  lastError: { type: String, default: '' },
  stats: {
    targeted: { type: Number, default: 0 },
    attempted: { type: Number, default: 0 },
    accepted: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    stale: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 }
  }
}, { timestamps: true });

campaignSchema.index({ status: 1, scheduledAt: 1 });
campaignSchema.index({ createdAt: -1 });
module.exports = mongoose.model('Campaign', campaignSchema);
module.exports.STATUSES = STATUSES;
