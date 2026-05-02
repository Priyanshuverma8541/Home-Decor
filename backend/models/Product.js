const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  description:      { type: String },
  category:         { type: String, enum: ["seashell","decor","gift","seasonal","other"], required: true },
  subCategory:      { type: String },
  tags:             [{ type: String }],
  images:           [{ type: String }],  // Cloudinary URLs
  price:            { type: Number, required: true, min: 0 },
  comparePrice:     { type: Number },    // strikethrough price
  stock:            { type: Number, default: 0 },
  sku:              { type: String },
  availableCities:  [{ type: String, enum: ["Buxar","Varanasi","Kolkata"] }],
  vendorId:         { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isFeatured:       { type: Boolean, default: false },
  isSeasonal:       { type: Boolean, default: false },
  isActive:         { type: Boolean, default: true },
  weight:           { type: Number },   // grams
  dimensions:       { type: String },   // e.g. "20x15x5 cm"
  material:         { type: String },   // e.g. "Natural seashell, bamboo"
  careInstructions: { type: String },
  instagramPostUrl: { type: String },
  whatsappOrderMsg: { type: String },   // pre-filled WA message template
  soldCount:        { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ name: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);
