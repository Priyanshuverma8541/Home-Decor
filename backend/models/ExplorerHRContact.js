const mongoose = require("mongoose");

const explorerHRContactSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 140 },
  jobTitle: { type: String, trim: true, maxlength: 140 },
  companyName: { type: String, trim: true, maxlength: 180 },
  workEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
  workPhone: { type: String, trim: true, maxlength: 40 },
  linkedInUrl: { type: String, trim: true, maxlength: 500 },
  otherProfileUrl: { type: String, trim: true, maxlength: 500 },
  technologies: [{ type: String, trim: true, maxlength: 80 }],
  hiringAreas: [{ type: String, trim: true, maxlength: 120 }],
  source: { type: String, required: true, trim: true, maxlength: 200 },
  contactBasis: { type: String, required: true, enum: ["public_professional_info", "direct_consent", "referral", "existing_relationship", "other"] },
  contactBasisDetails: { type: String, required: true, trim: true, maxlength: 1000 },
  relationshipStatus: { type: String, enum: ["to_research", "identified", "contacted", "connected", "conversation", "do_not_contact", "archived"], default: "identified", index: true },
  nextFollowUpAt: { type: Date, index: true },
  privateNotes: { type: String, trim: true, maxlength: 5000, select: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

explorerHRContactSchema.index({ companyName: 1, fullName: 1 });
explorerHRContactSchema.index({ relationshipStatus: 1, nextFollowUpAt: 1 });

module.exports = mongoose.model("ExplorerHRContact", explorerHRContactSchema);
