const mongoose = require("mongoose");

const marketingAudienceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500 },
  kind: { type: String, enum: ["manual", "saved-filter"], default: "manual" },
  customerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  filters: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

module.exports = mongoose.model("MarketingAudience", marketingAudienceSchema);
