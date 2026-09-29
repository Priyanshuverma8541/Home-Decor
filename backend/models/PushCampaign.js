const mongoose = require("mongoose");

const pushCampaignSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  body: { type: String, required: true, trim: true, maxlength: 300 },
  targetUrl: { type: String, default: "/", trim: true },
  iconUrl: { type: String, default: "", trim: true },
  audience: { type: String, enum: ["all", "selected"], default: "all" },
  subscriptionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "WebPushSubscription" }],
  status: { type: String, enum: ["draft", "sending", "sent", "partial", "failed"], default: "draft", index: true },
  sentAt: Date,
  stats: { targeted: { type: Number, default: 0 }, accepted: { type: Number, default: 0 }, failed: { type: Number, default: 0 }, stale: { type: Number, default: 0 } },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("PushCampaign", pushCampaignSchema);
