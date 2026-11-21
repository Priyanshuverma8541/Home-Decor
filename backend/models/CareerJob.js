const mongoose = require("mongoose");

const careerJobSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "CareerCompany", index: true },
  companyName: { type: String, required: true, trim: true, maxlength: 180 },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  location: { type: String, trim: true, maxlength: 180 },
  workMode: { type: String, enum: ["onsite", "hybrid", "remote", "unspecified"], default: "unspecified" },
  experienceMinYears: { type: Number, min: 0, max: 60, default: 0 },
  experienceMaxYears: { type: Number, min: 0, max: 60 },
  qualification: { type: String, trim: true, maxlength: 1000 },
  skills: [{ type: String, trim: true, maxlength: 100 }],
  employmentType: { type: String, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 5000 },
  applicationUrl: { type: String, required: true, trim: true, maxlength: 1000 },
  sourceUrl: { type: String, trim: true, maxlength: 1000 },
  sourceType: { type: String, enum: ["official_career_page", "official_notice", "referral", "manual", "other"], default: "official_career_page" },
  publishedAt: { type: Date },
  deadlineAt: { type: Date },
  verifiedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["draft", "open", "closed", "archived"], default: "draft", index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

careerJobSchema.index({ status: 1, location: 1, deadlineAt: 1 });
careerJobSchema.index({ title: "text", companyName: "text", description: "text", skills: "text" });
module.exports = mongoose.model("CareerJob", careerJobSchema);
