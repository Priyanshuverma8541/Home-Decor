const mongoose = require("mongoose");

const pageEventSchema = new mongoose.Schema({
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: "Page", required: true, index: true },
  type: { type: String, enum: ["page_view", "cta_click", "product_click", "form_view", "form_submit", "add_to_cart", "purchase"], required: true },
  sessionId: { type: String, maxlength: 80, default: "" },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } });

pageEventSchema.index({ pageId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model("PageEvent", pageEventSchema);