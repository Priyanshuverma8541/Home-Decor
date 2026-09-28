const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  description: { type: String, default: "", maxlength: 500 },
  status: { type: String, enum: ["draft", "published", "scheduled", "expired", "archived"], default: "draft", index: true },
  sourceType: { type: String, enum: ["builder", "html"], default: "builder" },
  htmlContent: { type: String, default: "", maxlength: 1_000_000 },
  sections: { type: [mongoose.Schema.Types.Mixed], default: [] },
  settings: {
    showNavbar: { type: Boolean, default: true },
    showFooter: { type: Boolean, default: true },
    fullWidth: { type: Boolean, default: false },
    background: { type: String, default: "#fffaf3", maxlength: 80 },
    primaryColor: { type: String, default: "#9d6a27", maxlength: 32 },
    secondaryColor: { type: String, default: "#1a3c34", maxlength: 32 },
    fontFamily: { type: String, default: "DM Sans", maxlength: 80 },
    productCategory: { type: String, default: "", maxlength: 80 },
    productId: { type: String, default: "", maxlength: 40 },
  },
  customizations: {
    title: { type: String, default: "", maxlength: 160 },
    description: { type: String, default: "", maxlength: 500 },
    ctaText: { type: String, default: "", maxlength: 80 },
    ctaUrl: { type: String, default: "", maxlength: 1000 },
    offerText: { type: String, default: "", maxlength: 200 },
    bannerImage: { type: String, default: "", maxlength: 1000 },
  },
  seo: {
    title: { type: String, default: "", maxlength: 70 },
    description: { type: String, default: "", maxlength: 180 },
    keywords: { type: String, default: "", maxlength: 300 },
    ogTitle: { type: String, default: "", maxlength: 70 },
    ogDescription: { type: String, default: "", maxlength: 180 },
    ogImage: { type: String, default: "", maxlength: 1000 },
    canonicalUrl: { type: String, default: "", maxlength: 1000 },
    robots: { type: String, default: "index,follow", maxlength: 80 },
  },
  schedule: {
    publishAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  campaignName: { type: String, default: "", maxlength: 120 },
  version: { type: Number, default: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

pageSchema.index({ slug: 1, status: 1 });

module.exports = mongoose.model("Page", pageSchema);