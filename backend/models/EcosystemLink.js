const mongoose = require("mongoose");

const ecosystemLinkSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  url: { type: String, default: "", trim: true },
  isActive: { type: Boolean, default: true },
  position: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("EcosystemLink", ecosystemLinkSchema);
