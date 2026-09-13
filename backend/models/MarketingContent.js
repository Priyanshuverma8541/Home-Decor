const mongoose = require("mongoose");

const marketingContentSchema = new mongoose.Schema({
  type: { type: String, enum: ["email-template", "caption", "creative"], required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  subject: { type: String, trim: true, maxlength: 180 },
  body: { type: String, default: "", maxlength: 10000 },
  format: { type: String, trim: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

module.exports = mongoose.model("MarketingContent", marketingContentSchema);
