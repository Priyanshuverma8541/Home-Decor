const mongoose = require("mongoose");

const slGameSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  symbols: { type: [String], required: true, validate: (items) => items.length === 24 },
  matchedIndices: { type: [Number], default: [] },
  openIndex: { type: Number, default: null },
  moves: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "completed", "expired", "abandoned"], default: "active", index: true },
  rewardGranted: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model("SLGameSession", slGameSessionSchema);
