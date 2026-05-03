const User = require("../models/User");
const bcrypt = require("bcryptjs");

// GET /api/users — admin: all users with role filter
exports.getAll = async (req, res) => {
  try {
    const { role, city, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (city) filter.city = city;
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/delivery — available delivery partners
exports.getDeliveryPartners = async (req, res) => {
  try {
    const { city } = req.query;
    const filter = { role: "delivery", isActive: true };
    if (city) filter.city = city;
    const partners = await User.find(filter).select("-password");
    res.json({ success: true, partners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/users/partner — admin creates delivery/vendor partner
exports.createPartner = async (req, res) => {
  try {
    const { fullName, phone, email, role, city, password, shopName, shopDescription, commissionRate } = req.body;
    if (!["delivery","vendor"].includes(role))
      return res.status(400).json({ success: false, message: "Role must be delivery or vendor" });

    const exists = await User.findOne({ $or: [{ phone }, { email }].filter(f => Object.values(f)[0]) });
    if (exists) return res.status(409).json({ success: false, message: "User already exists" });

    const user = await User.create({ fullName, phone, email, role, city, password: password || "Partner@123", shopName, shopDescription, commissionRate: commissionRate || 10, isApproved: true });
    res.status(201).json({ success: true, user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/users/:id — admin update user
exports.update = async (req, res) => {
  try {
    const { password, ...data } = req.body;
    if (password) data.password = await bcrypt.hash(password, 12);
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/users/:id/toggle — activate/deactivate
exports.toggle = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user: { _id: user._id, isActive: user.isActive } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

