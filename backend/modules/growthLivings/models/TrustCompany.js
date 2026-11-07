const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]{2,100}$/ },
  industry: { type: String, trim: true, maxlength: 120, default: "" },
  summary: { type: String, trim: true, maxlength: 3000, default: "" },
  location: { type: String, trim: true, maxlength: 180, default: "" },
  website: { type: String, trim: true, maxlength: 500, default: "" },
  logoUrl: { type: String, trim: true, maxlength: 1000, default: "" },
  publicEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: "", select: false },
  visibility: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
}, { timestamps: true });

module.exports = mongoose.models.TrustCompany || mongoose.model("TrustCompany", schema);
