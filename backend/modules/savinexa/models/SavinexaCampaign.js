const mongoose = require("mongoose");

const savinexaCampaignSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, index: true },
  description: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ["draft", "scheduled", "active", "paused", "completed", "archived"], default: "draft" },
  banner: { type: String },
  landingPage: { type: String },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "SavinexaProduct" }],
  collections: [{ type: mongoose.Schema.Types.ObjectId, ref: "SavinexaCollection" }],
  discountInfo: { type: Object, default: {} },
  cta: { type: Object, default: {} },
  utm: { type: Object, default: {} },
  tracking: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model("SavinexaCampaign", savinexaCampaignSchema);
