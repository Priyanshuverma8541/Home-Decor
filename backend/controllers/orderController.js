const Order    = require("../models/Order");
const Product  = require("../models/Product");
const Lead     = require("../models/Lead");
const Settings = require("../models/Settings");

// POST /api/orders — customer places order
exports.create = async (req, res) => {
  try {
    const { items, deliveryAddress, landmark, pincode, city, orderSource, guestName, guestPhone, paymentMethod, deliveryType } = req.body;
    if (!items?.length || !deliveryAddress || !city)
      return res.status(400).json({ success: false, message: "Items, address and city required" });

    // Fetch product details + validate stock
    let totalAmount = 0;
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive)
        return res.status(400).json({ success: false, message: `Product not available: ${item.productId}` });
      if (product.stock < item.quantity)
        return res.status(400).json({ success: false, message: `Insufficient stock: ${product.name}` });
      enrichedItems.push({ productId: product._id, name: product.name, image: product.images?.[0] || "", quantity: item.quantity, price: product.price });
      totalAmount += product.price * item.quantity;
    }

    // Delivery fee from settings
    const settings = await Settings.findOne() || {};
    const deliveryFee = (settings.deliveryFee?.get?.(city) ?? (settings.deliveryFee?.[city] ?? 0));
    const freeAbove   = settings.freeDeliveryAbove ?? 500;
    const finalDeliveryFee = totalAmount >= freeAbove ? 0 : deliveryFee;
    const grandTotal = totalAmount + finalDeliveryFee;

    const order = await Order.create({
      customerId: req.user?._id,
      guestName,
      guestPhone,
      guestCity: !req.user ? city : undefined,
      items: enrichedItems,
      totalAmount,
      deliveryFee: finalDeliveryFee,
      grandTotal,
      city,
      deliveryAddress,
      landmark,
      pincode,
      orderSource: orderSource || "website",
      paymentMethod: paymentMethod || "upi",
      deliveryType: deliveryType || "standard",
      statusTimeline: [{ status: "pending", message: "Order placed successfully" }],
    });

    // Reduce stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity, soldCount: item.quantity } });
    }

    // Auto-create / update lead
    const phone = req.user?.phone || guestPhone;
    if (phone) {
      const existing = await Lead.findOne({ phone });
      if (existing) {
        existing.status = "converted";
        existing.convertedOrderId = order._id;
        existing.convertedAt = new Date();
        await existing.save();
      } else {
        await Lead.create({ name: req.user?.fullName || guestName, phone, city, source: orderSource || "website", status: "converted", convertedOrderId: order._id, convertedAt: new Date(), userId: req.user?._id });
      }
    }

    // Emit socket event
    const io = req.app.get("io");
    io?.emit("newOrder", order);

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders — admin gets all
exports.getAll = async (req, res) => {
  try {
    const { status, city, source, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (city)   filter.city   = city;
    if (source) filter.orderSource = source;
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(filter).populate("customerId","fullName phone email").populate("deliveryPartnerId","fullName phone").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);
    res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/mine — customer own orders
exports.getMine = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/delivery — delivery partner assigned orders
exports.getDeliveryOrders = async (req, res) => {
  try {
    const orders = await Order.find({ deliveryPartnerId: req.user._id, status: { $in: ["assigned","out_for_delivery"] } }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/orders/:id/status — admin updates status + assigns delivery partner
exports.updateStatus = async (req, res) => {
  try {
    const { status, deliveryPartnerId, adminNotes, paymentStatus, paymentRef } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (status)              order.status              = status;
    if (deliveryPartnerId)   order.deliveryPartnerId   = deliveryPartnerId;
    if (adminNotes)          order.adminNotes          = adminNotes;
    if (paymentStatus)       order.paymentStatus       = paymentStatus;
    if (paymentRef)          order.paymentRef          = paymentRef;
    if (status === "delivered") { order.deliveredAt   = new Date(); order.paymentStatus = "paid"; }

    order.statusTimeline.push({ status: status || order.status, message: adminNotes || `Status updated to ${status}` });
    await order.save();

    const io = req.app.get("io");
    const populated = await Order.findById(order._id).populate("customerId","fullName phone").populate("deliveryPartnerId","fullName phone");
    io?.to(String(order.customerId)).emit("orderUpdated", populated);
    io?.emit("orderStatusChanged", populated);

    res.json({ success: true, order: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/orders/:id/delivery-update — delivery partner marks picked/delivered
exports.deliveryUpdate = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({ _id: req.params.id, deliveryPartnerId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const allowed = { out_for_delivery: "out_for_delivery", delivered: "delivered" };
    if (!allowed[status]) return res.status(400).json({ success: false, message: "Invalid status for delivery update" });

    order.status = status;
    if (status === "delivered") { order.deliveredAt = new Date(); order.paymentStatus = "paid"; }
    order.statusTimeline.push({ status, message: status === "delivered" ? "Delivered by partner" : "Out for delivery" });
    await order.save();

    const io = req.app.get("io");
    io?.to(String(order.customerId)).emit("orderUpdated", order);

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/analytics — admin dashboard stats
exports.getAnalytics = async (req, res) => {
  try {
    const today  = new Date(); today.setHours(0,0,0,0);
    const week   = new Date(today); week.setDate(week.getDate()-7);
    const month  = new Date(today); month.setDate(1);

    const [totalOrders, todayOrders, pendingOrders, deliveredOrders, revenueResult, cityBreakdown, sourceBreakdown] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: { $in: ["pending","confirmed","packed","assigned","out_for_delivery"] } }),
      Order.countDocuments({ status: "delivered" }),
      Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$grandTotal" } } }]),
      Order.aggregate([{ $group: { _id: "$city", count: { $sum: 1 }, revenue: { $sum: "$grandTotal" } } }]),
      Order.aggregate([{ $group: { _id: "$orderSource", count: { $sum: 1 } } }]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      success: true,
      stats: { totalOrders, todayOrders, pendingOrders, deliveredOrders, totalRevenue },
      cityBreakdown,
      sourceBreakdown,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
