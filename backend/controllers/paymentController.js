const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create Order
exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount } = req.body;
    const userId = req.user?.id || req.user?._id;

    console.log("📥 Body:", req.body);
    console.log("👤 User from token:", userId);

    if (!userId || !items || !items.length || !totalAmount) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const options = {
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const rpOrder = await razorpay.orders.create(options);

    const order = await Order.create({
      user: userId,
      items,
      totalAmount,
      paymentStatus: "pending",
      paymentInfo: {
        razorpay_order_id: rpOrder.id,
      },
    });

    res.json({ success: true, rpOrder, order });
  } catch (err) {
    console.error("💥 Create order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: "paid",
        status: "processing",
        paymentInfo: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        },
      },
      { new: true }
    );

    res.json({ success: true, order });
  } catch (err) {
    console.error("💥 Verify error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get Orders
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const orders = await Order.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.json({ success: true, orders });
  } catch (err) {
    console.error("💥 Fetch orders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};