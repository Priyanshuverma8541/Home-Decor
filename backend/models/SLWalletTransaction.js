const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, required: true, enum: ["game_reward", "purchase", "withdrawal_paid", "admin_adjustment"] },
  pointDelta: { type: Number, required: true },
  rupeeValue: { type: Number, default: 0 },
  idempotencyKey: { type: String, required: true, maxlength: 200 },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  note: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });

walletTransactionSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
module.exports = mongoose.model("SLWalletTransaction", walletTransactionSchema);
