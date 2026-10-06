const mongoose = require("mongoose");

const platformEventSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformApplication", required: true },
  appId: { type: String, required: true },
  event: { type: String, required: true, trim: true, maxlength: 100 },
  userId: { type: String, trim: true, maxlength: 200, default: "" },
  properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  occurredAt: { type: Date, default: Date.now },
  source: { type: String, enum: ["public_key", "api_key", "internal"], required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

platformEventSchema.index({ application: 1, createdAt: -1 });
platformEventSchema.index({ application: 1, event: 1, createdAt: -1 });
platformEventSchema.index({ application: 1, userId: 1, createdAt: -1 });
module.exports = mongoose.model("PlatformEvent", platformEventSchema);
