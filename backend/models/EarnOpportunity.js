const mongoose = require("mongoose");

const earnOpportunitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  category: { type: String, enum: ["task", "creator", "referral", "learning", "other"], default: "other", index: true },
  rewardLabel: { type: String, trim: true, maxlength: 120 },
  href: { type: String, trim: true, maxlength: 800 },
  status: { type: String, enum: ["draft", "published", "paused", "archived"], default: "draft", index: true },
  startsAt: { type: Date },
  endsAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("EarnOpportunity", earnOpportunitySchema);
