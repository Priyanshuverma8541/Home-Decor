'use strict';
const mongoose = require('mongoose');
// ACCEPTED_BY_PUSH_SERVICE means the push provider accepted the request. It does NOT prove device-level delivery.
const RESULTS = ['ATTEMPTED', 'ACCEPTED_BY_PUSH_SERVICE', 'FAILED', 'STALE_SUBSCRIPTION'];

const deliveryAttemptSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
  subscriberRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscriber', index: true },
  subscriberId: { type: String, index: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'PushSubscription' },
  attemptedAt: { type: Date, default: Date.now, index: true },
  result: { type: String, enum: RESULTS, default: 'ATTEMPTED', index: true },
  pushServiceStatus: Number,
  errorCategory: String,
  errorMessage: String, // sanitised, no endpoints or keys
  clickedAt: Date
}, { timestamps: { createdAt: true, updatedAt: false } });

deliveryAttemptSchema.index({ campaignId: 1, result: 1 });
deliveryAttemptSchema.index({ clickedAt: 1 }, { sparse: true });
module.exports = mongoose.model('DeliveryAttempt', deliveryAttemptSchema);
module.exports.RESULTS = RESULTS;
