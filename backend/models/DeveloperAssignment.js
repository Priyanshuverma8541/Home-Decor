const mongoose = require("mongoose");

const developerAssignmentSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "ModuleProduct", required: true, index: true },
  developerName: { type: String, required: true, trim: true, maxlength: 120 },
  developerEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 200, index: true },
  taskTitle: { type: String, required: true, trim: true, maxlength: 180 },
  requirements: { type: String, required: true, trim: true, maxlength: 8000 },
  deadline: { type: Date, default: null },
  modulePath: { type: String, trim: true, maxlength: 500, default: "" },
  repositoryUrl: { type: String, trim: true, maxlength: 500, default: "" },
  branch: { type: String, trim: true, maxlength: 120, default: "main" },
  status: { type: String, enum: ["assigned", "in-development", "submitted", "under-review", "changes-requested", "approved", "rejected", "completed", "cancelled"], default: "assigned", index: true },
  feedback: { type: String, trim: true, maxlength: 4000, default: "" },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

developerAssignmentSchema.index({ developerEmail: 1, status: 1, updatedAt: -1 });
module.exports = mongoose.model("DeveloperAssignment", developerAssignmentSchema);
