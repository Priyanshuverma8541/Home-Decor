const mongoose = require("mongoose");

// Encryption keys are intentionally excluded from normal queries and API output.
const webPushSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  endpoint: { type: String, required: true, select: false },
  endpointHash: { type: String, required: true, unique: true, index: true },
  p256dh: { type: String, required: true, select: false },
  auth: { type: String, required: true, select: false },
  expirationTime: { type: Date, default: null },
  status: { type: String, enum: ["active", "unsubscribed", "expired"], default: "active", index: true },
  device: { browser: String, platform: String, language: String },
  clickCount: { type: Number, default: 0 },
  lastSuccessAt: Date,
  lastFailureAt: Date,
  lastClickedAt: Date,
}, { timestamps: true });

webPushSubscriptionSchema.set("toJSON", { transform: (_doc, value) => { delete value.endpoint; delete value.endpointHash; delete value.p256dh; delete value.auth; return value; } });
module.exports = mongoose.model("WebPushSubscription", webPushSubscriptionSchema);
