const mongoose = require("mongoose");

const savinexaCollectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, index: true },
  type: {
    type: String,
    enum: ["featured", "new_arrivals", "best_sellers", "trending", "seasonal", "sale", "custom"],
    default: "custom",
  },
  description: { type: String },
  image: { type: String },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "SavinexaProduct" }],
  category: { type: String },
  tags: [{ type: String }],
  filters: { type: mongoose.Schema.Types.Mixed, default: {} },
  sortBy: { type: String, default: "newest" },
  limit: { type: Number, default: 8 },
  display: {
    showTitle: { type: Boolean, default: true },
    showProducts: { type: Boolean, default: true },
    layout: { type: String, default: "grid" },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("SavinexaCollection", savinexaCollectionSchema);
