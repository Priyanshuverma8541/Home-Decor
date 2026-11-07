const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "TrustCompany", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  summary: { type: String, trim: true, maxlength: 500, default: "" },
  description: { type: String, trim: true, maxlength: 12000, default: "" },
  location: { type: String, trim: true, maxlength: 180, default: "" },
  workMode: { type: String, enum: ["onsite", "hybrid", "remote", "unspecified"], default: "unspecified" },
  employmentType: { type: String, enum: ["full-time", "part-time", "contract", "internship"], default: "full-time" },
  experience: { type: String, trim: true, maxlength: 120, default: "" },
  skills: [{ type: String, trim: true, maxlength: 80 }],
  applicationUrl: { type: String, trim: true, maxlength: 1000, default: "" },
  visibility: { type: String, enum: ["draft", "published", "closed", "archived"], default: "draft", index: true },
  closesAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });
schema.index({ visibility: 1, createdAt: -1 });

module.exports = mongoose.models.TrustJob || mongoose.model("TrustJob", schema);
