const mongoose = require("mongoose");

const walletPurchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  points: { type: Number, required: true, min: 100 },
  rupees: { type: Number, required: true, min: 10 },
  paymentReference: { type: String, required: true, trim: true, maxlength: 160 },
  status: { type: String, enum: ["pending", "paid", "rejected"], default: "pending", index: true },
  adminNote: { type: String, trim: true, maxlength: 1000 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("SLWalletPurchase", walletPurchaseSchema);
