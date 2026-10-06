const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  appId: { type: String, required: true, unique: true, immutable: true, match: /^app_[a-z0-9_]+$/ },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  platform: { type: String, enum: ["web", "mobile", "server", "other"], default: "web" },
  status: { type: String, enum: ["active", "paused", "revoked"], default: "active", index: true },
  publicKey: { type: String, required: true, unique: true, select: false },
  allowedDomains: [{ type: String, trim: true, lowercase: true }],
  webhook: {
    url: { type: String, default: "" },
    secretHash: { type: String, select: false },
    events: [{ type: String }],
    active: { type: Boolean, default: false },
  },
  notificationConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("PlatformApplication", applicationSchema);