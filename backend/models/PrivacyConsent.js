const mongoose = require("mongoose");

const decisionSchema = new mongoose.Schema({
  key: { type: String, required: true, maxlength: 80 },
  label: { type: String, default: "", maxlength: 160 },
  category: { type: String, default: "browser", maxlength: 40 },
  status: { type: String, enum: ["consented", "denied", "granted", "not-granted", "unsupported"], required: true },
  decidedAt: { type: Date, required: true },
}, { _id: false });

const eventSchema = new mongoose.Schema({
  key: { type: String, required: true, maxlength: 80 },
  status: { type: String, enum: ["consented", "denied", "granted", "not-granted", "unsupported"], required: true },
  decidedAt: { type: Date, required: true },
}, { _id: false });

const privacyConsentSchema = new mongoose.Schema({
  subjectId: { type: String, required: true, unique: true, index: true, maxlength: 80 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, default: null },
  policyVersion: { type: String, default: "1", maxlength: 32 },
  decisions: { type: [decisionSchema], default: [] },
  history: { type: [eventSchema], default: [] },
  firstSeenAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true, minimize: false });

privacyConsentSchema.index({ "decisions.key": 1, "decisions.status": 1 });

module.exports = mongoose.model("PrivacyConsent", privacyConsentSchema);
