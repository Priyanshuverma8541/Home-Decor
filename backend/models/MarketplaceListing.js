const mongoose = require("mongoose");

const marketplaceListingSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  category: { type: String, required: true, index: true },
  subcategory: { type: String, required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: "" },
  price: { type: Number, min: 0 },
  images: [{ type: String }],
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  location: { area: String, city: { type: String, default: "Kolkata" } },
  status: { type: String, enum: ["pending", "active", "rejected", "sold"], default: "pending", index: true },
  featured: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
}, { timestamps: true });

marketplaceListingSchema.index({ title: "text", description: "text" });
module.exports = mongoose.model("MarketplaceListing", marketplaceListingSchema);
