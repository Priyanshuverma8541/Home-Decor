const mongoose = require("mongoose");

const savinexaBannerSchema = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  desktopImage: { type: String },
  mobileImage: { type: String },
  ctaText: { type: String, default: "Shop now" },
  ctaUrl: { type: String },
  placement: { type: String, default: "home" },
  priority: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("SavinexaBanner", savinexaBannerSchema);
