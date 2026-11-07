const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  headline: { type: String, trim: true, maxlength: 180, default: "" },
  summary: { type: String, trim: true, maxlength: 3000, default: "" },
  city: { type: String, trim: true, maxlength: 100, default: "" },
  skills: [{ type: String, trim: true, maxlength: 80 }],
  visibility: { type: String, enum: ["private", "public"], default: "private", index: true },
}, { timestamps: true, minimize: false });

module.exports = mongoose.models.GrowthProfile || mongoose.model("GrowthProfile", schema);
