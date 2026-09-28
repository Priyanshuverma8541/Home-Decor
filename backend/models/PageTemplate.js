const mongoose = require("mongoose");

const pageTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", maxlength: 500 },
  sourceType: { type: String, enum: ["builder", "html"], default: "builder" },
  htmlContent: { type: String, default: "", maxlength: 1_000_000 },
  sections: { type: [mongoose.Schema.Types.Mixed], default: [] },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  customizations: { type: mongoose.Schema.Types.Mixed, default: {} },
  seo: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

pageTemplateSchema.index({ name: 1 });

module.exports = mongoose.model("PageTemplate", pageTemplateSchema);