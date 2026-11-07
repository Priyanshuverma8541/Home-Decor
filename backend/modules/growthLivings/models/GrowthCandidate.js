const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]{2,80}$/ },
  displayName: { type: String, required: true, trim: true, maxlength: 120 },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true, select: false },
  visibility: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
  candidateApprovedAt: { type: Date, default: null, select: false },
  headline: { type: String, trim: true, maxlength: 220, default: "" },
  publicProfile: { type: mongoose.Schema.Types.Mixed, default: {} },
  privateContact: { type: mongoose.Schema.Types.Mixed, default: {}, select: false },
  resumeUrl: { type: String, trim: true, maxlength: 1000, default: "", select: false },
}, { timestamps: true, minimize: false });

module.exports = mongoose.models.GrowthCandidate || mongoose.model("GrowthCandidate", schema);
