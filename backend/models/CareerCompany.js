const mongoose = require("mongoose");

const careerCompanySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 180 },
  sector: { type: String, enum: ["real_estate", "civil_epc", "consulting", "other"], default: "civil_epc", index: true },
  description: { type: String, trim: true, maxlength: 1000 },
  officialWebsite: { type: String, trim: true, maxlength: 500 },
  careersUrl: { type: String, trim: true, maxlength: 500 },
  linkedinCompanyUrl: { type: String, trim: true, maxlength: 500 },
  officialContactUrl: { type: String, trim: true, maxlength: 500 },
  officeLocations: [{ type: String, trim: true, maxlength: 120 }],
  roleTypes: [{ type: String, trim: true, maxlength: 120 }],
  sourceCheckedAt: { type: Date },
  sourceNotes: { type: String, trim: true, maxlength: 1000 },
  active: { type: Boolean, default: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

careerCompanySchema.index({ name: "text", description: "text", roleTypes: "text" });
module.exports = mongoose.model("CareerCompany", careerCompanySchema);
