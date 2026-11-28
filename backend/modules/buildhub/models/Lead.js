const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  audience: { type: String, enum: ["student", "business"], default: "business" },
  fullName: { type: String, required: true, trim: true, maxlength: 120 }, email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, default: "", maxlength: 30 }, company: { type: String, default: "", maxlength: 160 }, college: { type: String, default: "", maxlength: 160 }, city: { type: String, default: "", maxlength: 120 },
  projectType: { type: String, default: "", maxlength: 120 }, budget: { type: String, default: "", maxlength: 80 }, timeline: { type: String, default: "", maxlength: 80 }, message: { type: String, default: "", maxlength: 4000 },
  source: { type: String, enum: ["website", "whatsapp", "instagram", "referral", "other"], default: "website" },
  status: { type: String, enum: ["new", "contacted", "qualified", "won", "lost"], default: "new" },
  notes: [{ text: { type: String, maxlength: 2000 }, addedAt: { type: Date, default: Date.now } }], nextFollowUpAt: Date, convertedAmount: { type: Number, default: 0 },
}, { timestamps: true });

leadSchema.index({ status: 1, createdAt: -1 });
module.exports = mongoose.model("SavitriBuildHubLead", leadSchema);
