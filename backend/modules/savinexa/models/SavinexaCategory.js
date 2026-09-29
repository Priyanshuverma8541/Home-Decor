const mongoose = require("mongoose");

const savinexaCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, index: true },
  description: { type: String },
  parentCategory: { type: String, default: null },
  icon: { type: String },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  displayStyle: { type: String, default: "card" },
  seo: {
    metaTitle: String,
    metaDescription: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("SavinexaCategory", savinexaCategorySchema);
