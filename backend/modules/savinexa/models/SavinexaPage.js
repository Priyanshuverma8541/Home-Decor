const mongoose = require("mongoose");

const savinexaPageSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, index: true },
  seo: {
    metaTitle: String,
    metaDescription: String,
    canonicalUrl: String,
  },
  sections: [{ type: mongoose.Schema.Types.Mixed }],
  visibility: { type: String, enum: ["public", "draft", "hidden"], default: "draft" },
  publishStatus: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
  schedule: {
    publishAt: Date,
    unpublishAt: Date,
  },
  preview: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("SavinexaPage", savinexaPageSchema);
