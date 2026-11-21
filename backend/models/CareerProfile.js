const mongoose = require("mongoose");

const careerProfileSchema = new mongoose.Schema({
  profileKey: { type: String, required: true, unique: true, default: "archana-singh" },
  fullName: { type: String, required: true, trim: true, maxlength: 140 },
  location: { type: String, trim: true, maxlength: 180 },
  phone: { type: String, trim: true, maxlength: 40 },
  email: { type: String, trim: true, lowercase: true, maxlength: 254 },
  linkedInUrl: { type: String, trim: true, maxlength: 500 },
  summary: { type: String, trim: true, maxlength: 3000 },
  experienceLevel: { type: String, enum: ["early_career", "experienced", "senior"], default: "early_career" },
  targetRoles: [{ type: String, trim: true, maxlength: 120 }],
  skills: [{ group: { type: String, trim: true, maxlength: 100 }, items: [{ type: String, trim: true, maxlength: 100 }] }],
  experience: [{ title: { type: String, trim: true, maxlength: 160 }, employer: { type: String, trim: true, maxlength: 180 }, location: { type: String, trim: true, maxlength: 120 }, startDate: { type: String, trim: true, maxlength: 40 }, endDate: { type: String, trim: true, maxlength: 40 }, details: [{ type: String, trim: true, maxlength: 500 }] }],
  education: [{ qualification: { type: String, trim: true, maxlength: 180 }, institution: { type: String, trim: true, maxlength: 200 }, period: { type: String, trim: true, maxlength: 60 }, result: { type: String, trim: true, maxlength: 60 } }],
  leadership: [{ title: { type: String, trim: true, maxlength: 160 }, organization: { type: String, trim: true, maxlength: 180 }, period: { type: String, trim: true, maxlength: 60 }, details: [{ type: String, trim: true, maxlength: 500 }] }],
  resumeSource: { type: String, trim: true, maxlength: 200 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("CareerProfile", careerProfileSchema);
