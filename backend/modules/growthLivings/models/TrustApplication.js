const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "TrustJob", required: true, index: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  message: { type: String, trim: true, maxlength: 3000, default: "" },
  consentedToShare: { type: Boolean, required: true, default: false },
  consentedAt: { type: Date, required: true },
  status: { type: String, enum: ["submitted", "reviewing", "interview", "closed"], default: "submitted" },
}, { timestamps: true });
schema.index({ jobId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.models.TrustApplication || mongoose.model("TrustApplication", schema);
