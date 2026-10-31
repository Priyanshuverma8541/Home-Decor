const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  templateId: { type: String, required: true }, name: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, required: true, trim: true, maxlength: 80 }, description: { type: String, trim: true, maxlength: 500 },
  version: { type: String, required: true }, active: { type: Boolean, default: false }, reviewed: { type: Boolean, default: false },
  workbook: { type: Buffer, required: true }, mapping: { type: [mongoose.Schema.Types.Mixed], required: true },
  worksheets: { type: [String], default: [] }, evidenceSheets: { type: [String], default: [] }, uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
schema.index({ templateId: 1, version: 1 }, { unique: true });
module.exports = mongoose.models.ChecklistTemplate || mongoose.model("ChecklistTemplate", schema);
