const mongoose = require("mongoose");

const walletWithdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  points: { type: Number, required: true, min: 10 },
  rupees: { type: Number, required: true, min: 1 },
  payoutHandle: { type: String, required: true, trim: true, maxlength: 120 },
  status: { type: String, enum: ["pending", "approved", "rejected", "paid"], default: "pending", index: true },
  adminNote: { type: String, trim: true, maxlength: 1000 },
  payoutReference: { type: String, trim: true, maxlength: 160 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("SLWalletWithdrawal", walletWithdrawalSchema);
