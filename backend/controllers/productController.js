const Product  = require("../models/Product");
const { cloudinary } = require("../config/cloudinary");

const asBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";

const validateMeeshoUrl = (value) => {
  if (!value) return "A Meesho product URL is required when Meesho purchase is enabled";
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return "Meesho URL must use HTTP or HTTPS";
    return null;
  } catch {
    return "Enter a valid Meesho product URL";
  }
};

const normalizeProductData = (data = {}) => {
  const cleaned = { ...data };
  const booleanFields = ["isFeatured","isSeasonal","isActive","meeshoEnabled","shareEnabled","referralEnabled"];
  booleanFields.forEach((field) => {
    if (cleaned[field] !== undefined) cleaned[field] = asBoolean(cleaned[field]);
  });
  if (typeof cleaned.availableCities === "string") cleaned.availableCities = [cleaned.availableCities];
  if (typeof cleaned.tags === "string") cleaned.tags = cleaned.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  if (typeof cleaned.images === "string") cleaned.images = [cleaned.images];
  if (!cleaned.purchaseMode) cleaned.purchaseMode = cleaned.meeshoEnabled ? "meesho" : "direct";
  cleaned.meeshoEnabled = ["meesho", "both"].includes(cleaned.purchaseMode);
  if (typeof cleaned.meeshoUrl === "string") cleaned.meeshoUrl = cleaned.meeshoUrl.trim();
  return cleaned;
};

// GET /api/products
exports.getAll = async (req, res) => {
  try {
    const { category, city, search, featured, seasonal, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };

    if (category)               filter.category       = category;
    // Product availability is Pan-India. The city query is intentionally ignored
    // so older storefronts do not hide catalogue items by location.
    if (featured === "true")    filter.isFeatured      = true;
    if (seasonal === "true")    filter.isSeasonal      = true;
    if (search)                 filter.$text           = { $search: search };

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(filter).populate("vendorId","fullName shopName").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);
    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/:id
exports.getOne = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("vendorId","fullName shopName phone");
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/products (admin)
exports.create = async (req, res) => {
  try {
    const images = req.files?.map(f => f.path) || [];
    const data   = normalizeProductData({ ...req.body, images });
    if (data.meeshoEnabled) {
      const validationError = validateMeeshoUrl(data.meeshoUrl);
      if (validationError) return res.status(400).json({ success: false, message: validationError });
    }
    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/products/:id (admin)
exports.update = async (req, res) => {
  try {
    const data = normalizeProductData({ ...req.body });
    if (data.meeshoEnabled) {
      const validationError = validateMeeshoUrl(data.meeshoUrl);
      if (validationError) return res.status(400).json({ success: false, message: validationError });
    }
    if (req.files?.length) data.images = req.files.map(f => f.path);
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id (admin)
exports.remove = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    // Delete from Cloudinary
    for (const url of product.images) {
      const publicId = url.split("/").slice(-2).join("/").split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }
    await product.deleteOne();
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/products/:id/toggle — activate/deactivate
exports.toggle = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    product.isActive = !product.isActive;
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
