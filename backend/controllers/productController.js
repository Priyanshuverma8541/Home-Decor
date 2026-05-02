const Product  = require("../models/Product");
const { cloudinary } = require("../config/cloudinary");

// GET /api/products
exports.getAll = async (req, res) => {
  try {
    const { category, city, search, featured, seasonal, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };

    if (category)               filter.category       = category;
    if (city)                   filter.availableCities = city;
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
    const data   = { ...req.body, images };
    if (typeof data.availableCities === "string") data.availableCities = [data.availableCities];
    if (typeof data.tags === "string")            data.tags = data.tags.split(",").map(t => t.trim());
    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/products/:id (admin)
exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files?.length) data.images = req.files.map(f => f.path);
    if (typeof data.availableCities === "string") data.availableCities = [data.availableCities];
    if (typeof data.tags === "string")            data.tags = data.tags.split(",").map(t => t.trim());
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
