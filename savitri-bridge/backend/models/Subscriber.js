'use strict';
const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceType: String, browser: String, browserVersion: String, os: String, osVersion: String, deviceModel: String,
  userAgent: String, screenWidth: Number, screenHeight: Number, pixelRatio: Number, platform: String
}, { _id: false });

const locationSchema = new mongoose.Schema({
  latitude: Number, longitude: Number, accuracy: Number, capturedAt: Date,
  country: String, state: String, city: String, postalCode: String, displayName: String,
  geocodeStatus: { type: String, enum: ['OK', 'PARTIAL', 'FAILED', 'RATE_LIMITED', 'SKIPPED'], default: 'SKIPPED' },
  source: { type: String, default: 'user-permitted-browser-geolocation' }
}, { _id: false });

/** A Browser/Device Subscriber. Structurally able to own several PushSubscriptions. */
const subscriberSchema = new mongoose.Schema({
  subscriberId: { type: String, required: true, unique: true }, // SUB_xxxxxxxxx
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  status: { type: String, enum: ['active', 'inactive', 'disabled', 'deleted'], default: 'active', index: true },
  device: deviceSchema,
  language: String,
  languages: [String],
  timezone: String,
  permissions: {
    push: { type: String, enum: ['granted', 'denied', 'default', 'unknown'], default: 'unknown' },
    location: { type: String, enum: ['granted', 'denied', 'prompt', 'unknown'], default: 'unknown' }
  },
  location: locationSchema,
  tags: [String],
  lastSeenAt: { type: Date, default: Date.now }
}, { timestamps: true });

subscriberSchema.index({ createdAt: -1 });
subscriberSchema.index({ projectId: 1, status: 1, createdAt: -1 });
module.exports = mongoose.model('Subscriber', subscriberSchema);
