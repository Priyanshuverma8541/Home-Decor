const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformApplication", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  prefix: { type: String, required: true, index: true },
  secretHash: { type: String, required: true, select: false, unique: true },
  scopes: [{ type: String, enum: ["users:write", "subscribers:read", "subscribers:write", "notifications:send", "campaigns:write", "events:write", "analytics:read", "webhooks:write"] }],
  status: { type: String, enum: ["active", "revoked"], default: "active", index: true },
  expiresAt: { type: Date, default: null },
  lastUsedAt: Date,
  revokedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

apiKeySchema.index({ application: 1, status: 1, createdAt: -1 });
module.exports = mongoose.model("PlatformApiKey", apiKeySchema);