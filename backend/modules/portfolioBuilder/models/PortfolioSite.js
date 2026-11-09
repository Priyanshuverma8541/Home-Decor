const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]{3,52}$/ },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  profile: { type: mongoose.Schema.Types.Mixed, required: true },
  editorTokenHash: { type: String, required: true, select: false },
  status: { type: String, enum: ["draft", "payment_pending", "paid", "deploying", "published", "failed"], default: "draft", index: true },
  amount: { type: Number, default: 9900 },
  currency: { type: String, default: "INR" },
  razorpayOrderId: { type: String, default: "" },
  razorpayPaymentId: { type: String, default: "" },
  vercelProjectId: { type: String, default: "" },
  vercelProjectSlug: { type: String, default: "" },
  vercelDeploymentId: { type: String, default: "" },
  deploymentUrl: { type: String, default: "" },
  savitriPageId: { type: mongoose.Schema.Types.ObjectId, ref: "Page", default: null },
  deploymentError: { type: String, default: "" },
  publishedAt: { type: Date, default: null },
}, { timestamps: true, minimize: false });

module.exports = mongoose.models.PortfolioSite || mongoose.model("PortfolioSite", schema);
