const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  content: { type: String, required: true, trim: true, maxlength: 8000 },
  audience: { type: String, enum: ["public", "internal"], default: "public", index: true },
  sourceLabel: { type: String, trim: true, maxlength: 120, default: "Savitri Livings guide" },
  sourceUrl: { type: String, trim: true, maxlength: 300, default: "" },
  active: { type: Boolean, default: true, index: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

schema.index({ active: 1, audience: 1, updatedAt: -1 });

module.exports = mongoose.models.LivingsAIKnowledge || mongoose.model("LivingsAIKnowledge", schema);
