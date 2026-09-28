const mongoose = require("mongoose");

const pageSubmissionSchema = new mongoose.Schema({
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: "Page", required: true, index: true },
  formId: { type: String, required: true, maxlength: 80 },
  values: { type: mongoose.Schema.Types.Mixed, default: {} },
  consents: [{
    type: { type: String, required: true, maxlength: 80 },
    status: { type: Boolean, required: true },
    version: { type: String, default: "1", maxlength: 40 },
    recordedAt: { type: Date, default: Date.now },
  }],
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null },
}, { timestamps: true });

module.exports = mongoose.model("PageSubmission", pageSubmissionSchema);