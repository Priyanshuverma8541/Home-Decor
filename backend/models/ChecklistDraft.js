const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  templateId: { type: String, required: true }, templateVersion: { type: String, required: true },
  title: { type: String, trim: true, maxlength: 140, default: "Untitled checklist" },
  values: { type: mongoose.Schema.Types.Mixed, default: {} }, evidence: { type: mongoose.Schema.Types.Mixed, default: {} }, status: { type: String, enum: ["draft", "completed"], default: "draft" },
}, { timestamps: true });
schema.index({ owner: 1, updatedAt: -1 });
module.exports = mongoose.models.ChecklistDraft || mongoose.model("ChecklistDraft", schema);
