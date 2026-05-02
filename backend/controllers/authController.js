// const User = require("../models/User");
// const Lead = require("../models/Lead");
// const jwt  = require("jsonwebtoken");

// const signToken = (id) =>
//   jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// // POST /api/auth/register
// exports.register = async (req, res) => {
//   try {
//     const { fullName, phone, email, password, city, source } = req.body;
//     if (!fullName || !password)
//       return res.status(400).json({ success: false, message: "Full name and password required" });
//     if (!phone && !email)
//       return res.status(400).json({ success: false, message: "Phone or email required" });

//     const exists = await User.findOne({ $or: [{ phone }, { email }].filter(Boolean) });
//     if (exists)
//       return res.status(409).json({ success: false, message: "Account already exists" });

//     const user = await User.create({ fullName, phone, email, password, city: city || "Buxar", source: source || "website" });

//     // Auto-create CRM lead
//     await Lead.create({ name: fullName, phone, email, city, source: source || "website", userId: user._id, status: "converted" });

//     const token = signToken(user._id);
//     res.status(201).json({ success: true, token, user: { _id: user._id, fullName: user.fullName, phone: user.phone, email: user.email, role: user.role, city: user.city } });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // POST /api/auth/login
// exports.login = async (req, res) => {
//   try {
//     const { identifier, password } = req.body;
//     if (!identifier || !password)
//       return res.status(400).json({ success: false, message: "Identifier and password required" });

//     const user = await User.findOne({
//       $or: [{ phone: identifier }, { email: identifier }],
//     });
//     if (!user || !(await user.matchPassword(password)))
//       return res.status(401).json({ success: false, message: "Invalid credentials" });

//     if (!user.isActive)
//       return res.status(403).json({ success: false, message: "Account deactivated" });

//     const token = signToken(user._id);
//     res.json({ success: true, token, user: { _id: user._id, fullName: user.fullName, phone: user.phone, email: user.email, role: user.role, city: user.city } });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // GET /api/auth/me
// exports.getMe = async (req, res) => {
//   res.json({ success: true, user: req.user });
// };

const User = require("../models/User");
const Lead = require("../models/Lead");
const jwt = require("jsonwebtoken");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

exports.register = async (req, res) => {
  try {
    let { fullName, phone, email, password, city, source } = req.body;

    if (!fullName || !password)
      return res.status(400).json({ message: "Full name & password required" });

    if (!phone && !email)
      return res.status(400).json({ message: "Phone or email required" });

    // ✅ CLEAN INPUT
    phone = phone?.trim() || undefined;
    email = email?.trim()?.toLowerCase() || undefined;

    // ✅ SAFE QUERY
    const query = [];
    if (phone) query.push({ phone });
    if (email) query.push({ email });

    const exists = query.length ? await User.findOne({ $or: query }) : null;

    if (exists) {
      if (phone && exists.phone === phone)
        return res.status(409).json({ message: "Phone already registered" });

      if (email && exists.email === email)
        return res.status(409).json({ message: "Email already registered" });
    }

    const user = await User.create({
      fullName,
      phone,
      email,
      password,
      city: city || "Buxar",
      source: source || "website"
    });

    await Lead.create({
      name: fullName,
      phone,
      email,
      city,
      source,
      userId: user._id,
      status: "converted"
    });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user
    });

  } catch (err) {

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Duplicate field",
        field: Object.keys(err.keyValue)[0]
      });
    }

    res.status(500).json({ message: err.message });
  }
};