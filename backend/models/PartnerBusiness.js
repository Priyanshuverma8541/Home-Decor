const mongoose = require("mongoose");

const partnerBusinessSchema = new mongoose.Schema({
  businessName: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, required: true, trim: true },
  location: { type: String, trim: true, maxlength: 180 },
  productsServices: { type: String, trim: true, maxlength: 2000 },
  website: { type: String, trim: true },
  instagram: { type: String, trim: true },
  whatsapp: { type: String, trim: true },
  linkedIn: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  otherProfiles: { type: String, trim: true },
  contactPerson: { type: String, trim: true },
  partnershipType: { type: String, required: true, trim: true },
  status: { type: String, enum: ["discovered", "contacted", "interested", "discussion", "negotiation", "partner", "active", "declined"], default: "discovered", index: true },
  collaborationStatus: { type: String, enum: ["application", "pending", "approved", "public", "inactive"], default: "application" },
  isPublic: { type: Boolean, default: false },
  contactedAt: { type: Date },
  nextFollowUpAt: { type: Date },
  discussionNotes: { type: String, trim: true, maxlength: 5000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("PartnerBusiness", partnerBusinessSchema);
