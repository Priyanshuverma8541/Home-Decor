const mongoose = require("mongoose");

const careerApplicationSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "CareerJob", index: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "CareerCompany", index: true },
  companyName: { type: String, required: true, trim: true, maxlength: 180 },
  roleTitle: { type: String, required: true, trim: true, maxlength: 180 },
  location: { type: String, trim: true, maxlength: 180 },
  applicationUrl: { type: String, trim: true, maxlength: 1000 },
  source: { type: String, trim: true, maxlength: 120 },
  stage: { type: String, enum: ["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn", "closed"], default: "saved", index: true },
  appliedAt: { type: Date },
  nextFollowUpAt: { type: Date, index: true },
  deadlineAt: { type: Date },
  notes: { type: String, trim: true, maxlength: 3000, select: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

careerApplicationSchema.index({ ownerId: 1, stage: 1, updatedAt: -1 });
module.exports = mongoose.model("CareerApplication", careerApplicationSchema);
