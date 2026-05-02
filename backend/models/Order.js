const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name:        { type: String },
  image:       { type: String },
  quantity:    { type: Number, required: true, min: 1 },
  price:       { type: Number, required: true },
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  status:    { type: String },
  message:   { type: String },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  // Identifiers
  orderNumber:       { type: String, unique: true },
  customerId:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  // Guest order support (WhatsApp / Instagram orders without account)
  guestName:         { type: String },
  guestPhone:        { type: String },
  guestCity:         { type: String },

  items:             [orderItemSchema],
  totalAmount:       { type: Number, required: true },
  deliveryFee:       { type: Number, default: 0 },
  grandTotal:        { type: Number, required: true },

  city:              { type: String, enum: ["Buxar","Varanasi","Kolkata"], required: true },
  deliveryAddress:   { type: String, required: true },
  landmark:          { type: String },
  pincode:           { type: String },

  orderSource:       { type: String, enum: ["website","whatsapp","instagram","admin"], default: "website" },

  status:            { type: String, enum: ["pending","confirmed","packed","assigned","out_for_delivery","delivered","cancelled"], default: "pending" },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deliveryType:      { type: String, enum: ["standard","express"], default: "standard" },
  expectedDelivery:  { type: Date },
  deliveredAt:       { type: Date },

  paymentStatus:     { type: String, enum: ["pending","paid","refunded"], default: "pending" },
  paymentMethod:     { type: String, enum: ["upi","qr","cod","razorpay"], default: "upi" },
  paymentRef:        { type: String },
  razorpayOrderId:   { type: String },
  razorpayPaymentId: { type: String },

  statusTimeline:    [timelineSchema],
  adminNotes:        { type: String },
  cancellationReason:{ type: String },
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `SL-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
