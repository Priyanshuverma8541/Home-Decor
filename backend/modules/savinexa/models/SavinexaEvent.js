const mongoose = require("mongoose");

const savinexaEventSchema = new mongoose.Schema({
  eventType: { type: String, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "SavinexaProduct" },
  category: { type: String },
  collection: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sessionId: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model("SavinexaEvent", savinexaEventSchema);
