const mongoose = require("mongoose");

const moduleSubmissionSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "ModuleProduct", required: true, index: true },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: "DeveloperAssignment", required: true, index: true },
  developerName: { type: String, required: true, trim: true, maxlength: 120 },
  developerEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 200, index: true },
  version: { type: String, required: true, trim: true, maxlength: 32 },
  repositoryUrl: { type: String, trim: true, maxlength: 500, default: "" },
  branch: { type: String, trim: true, maxlength: 120, default: "main" },
  pullRequestUrl: { type: String, trim: true, maxlength: 500, default: "" },
  commitSha: { type: String, trim: true, maxlength: 64, default: "" },
  documentationUrl: { type: String, trim: true, maxlength: 1000, default: "" },
  summary: { type: String, required: true, trim: true, maxlength: 3000 },
  status: { type: String, enum: ["submitted", "under-review", "changes-requested", "approved", "rejected"], default: "submitted", index: true },
  buildStatus: { type: String, enum: ["not-run", "pending", "passed", "failed"], default: "not-run", index: true },
  buildConclusion: { type: String, trim: true, maxlength: 80, default: "" },
  buildUpdatedAt: { type: Date },
  reviewFeedback: { type: String, trim: true, maxlength: 4000, default: "" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
}, { timestamps: true });

moduleSubmissionSchema.index({ status: 1, createdAt: -1 });
moduleSubmissionSchema.index({ repositoryUrl: 1, commitSha: 1 });
module.exports = mongoose.model("ModuleSubmission", moduleSubmissionSchema);
