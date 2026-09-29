'use strict';
const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  subscriber: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscriber', required: true, index: true },
  subscriberId: { type: String, required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  // Sensitive delivery material: never selected by default, never returned by any API or export.
  endpoint: { type: String, required: true, select: false },
  endpointHash: { type: String, required: true, unique: true },
  p256dh: { type: String, required: true, select: false },
  auth: { type: String, required: true, select: false },
  expirationTime: Date,
  status: { type: String, enum: ['active', 'disabled', 'unsubscribed', 'expired', 'invalid'], default: 'active', index: true },
  lastSuccessAt: Date,
  lastFailureAt: Date,
  failureCount: { type: Number, default: 0 }
}, { timestamps: true });

pushSubscriptionSchema.index({ status: 1, projectId: 1 });
pushSubscriptionSchema.set('toJSON', { transform: (_d, r) => { delete r.endpoint; delete r.p256dh; delete r.auth; delete r.endpointHash; delete r.__v; return r; } });
module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
