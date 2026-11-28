const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  fullName: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  college: { type: String, default: "", maxlength: 160 }, notes: { type: String, default: "", maxlength: 2000 },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "SavitriBuildHubProject", required: true },
  projectName: { type: String, required: true }, tier: { type: String, enum: ["codeOnly", "codeAndCall", "mentorship", "customBuild"], required: true },
  tierLabel: String, amount: { type: Number, min: 0, required: true }, paymentMethod: { type: String, enum: ["upi", "manual"], default: "upi" },
  paymentStatus: { type: String, enum: ["pending", "paid", "refunded", "cancelled"], default: "pending" }, paidAt: Date,
  paymentNotes: String, deliveryStatus: { type: String, enum: ["pending", "delivered", "needs_action"], default: "pending" },
  deliveredAt: Date, githubInviteSent: { type: Boolean, default: false }, zoomBookingLink: { type: String, default: "" }, customDocsLink: { type: String, default: "" },
  couponCode: String, discountAmount: { type: Number, default: 0 }, adminNotes: String,
}, { timestamps: true });

orderSchema.index({ email: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, deliveryStatus: 1 });
module.exports = mongoose.model("SavitriBuildHubOrder", orderSchema);
