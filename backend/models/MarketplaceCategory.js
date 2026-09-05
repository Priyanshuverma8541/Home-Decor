const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  attributes: [{ type: String }],
}, { _id: false });

const marketplaceCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  icon: { type: String, default: "🏪" },
  isActive: { type: Boolean, default: true },
  subcategories: [subcategorySchema],
}, { timestamps: true });

module.exports = mongoose.model("MarketplaceCategory", marketplaceCategorySchema);
