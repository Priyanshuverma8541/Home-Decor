const mongoose = require("mongoose");

const pushCampaignSchema = new mongoose.Schema({
  appId: { type: String, default: "app_savitri_livings", index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  body: { type: String, required: true, trim: true, maxlength: 300 },
  description: { type: String, trim: true, maxlength: 250, default: "" },
  imageUrl: { type: String, default: "", trim: true },
  iconUrl: { type: String, default: "", trim: true },
  targetUrl: { type: String, default: "/", trim: true },
  audience: { type: String, enum: ["all", "selected"], default: "all" },
  subscriptionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "WebPushSubscription" }],
  sendMode: { type: String, enum: ["draft", "schedule", "now"], default: "draft" },
  status: { type: String, enum: ["draft", "scheduled", "sending", "sent", "partial", "failed"], default: "draft", index: true },
  scheduledAt: { type: Date, default: null },
  sentAt: Date,
  stats: {
    targeted: { type: Number, default: 0 },
    accepted: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    stale: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
  },
  lastClickedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

pushCampaignSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model("PushCampaign", pushCampaignSchema);
