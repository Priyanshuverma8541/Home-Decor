const mongoose = require("mongoose");

const moduleWebhookReceiptSchema = new mongoose.Schema({
  deliveryId: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  event: { type: String, required: true, trim: true, maxlength: 40 },
  repositoryUrl: { type: String, trim: true, maxlength: 500, default: "" },
  commitSha: { type: String, trim: true, maxlength: 64, default: "" },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "ModuleProduct" },
  submission: { type: mongoose.Schema.Types.ObjectId, ref: "ModuleSubmission" },
  receivedAt: { type: Date, default: Date.now, expires: 2592000, index: true },
}, { timestamps: false });

module.exports = mongoose.model("ModuleWebhookReceipt", moduleWebhookReceiptSchema);
