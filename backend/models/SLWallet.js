const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  balancePoints: { type: Number, default: 0, min: 0 },
  earnedPoints: { type: Number, default: 0, min: 0 },
  purchasedPoints: { type: Number, default: 0, min: 0 },
  reservedPoints: { type: Number, default: 0, min: 0 },
  redeemedPoints: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

module.exports = mongoose.model("SLWallet", walletSchema);
