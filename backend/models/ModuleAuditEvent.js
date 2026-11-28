const mongoose = require("mongoose");

const moduleAuditEventSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "ModuleProduct", index: true },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: "DeveloperAssignment" },
  submission: { type: mongoose.Schema.Types.ObjectId, ref: "ModuleSubmission" },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  actorEmail: { type: String, trim: true, lowercase: true, maxlength: 200, default: "" },
  actorRole: { type: String, trim: true, maxlength: 40, default: "" },
  action: { type: String, required: true, trim: true, maxlength: 80, index: true },
  summary: { type: String, trim: true, maxlength: 1000, default: "" },
}, { timestamps: { createdAt: true, updatedAt: false } });

moduleAuditEventSchema.index({ createdAt: -1 });
module.exports = mongoose.model("ModuleAuditEvent", moduleAuditEventSchema);
