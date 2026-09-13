const router = require("express").Router();
const slugify = (value = "") => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const Category = require("../models/MarketplaceCategory");
const Listing = require("../models/MarketplaceListing");
const User = require("../models/User");
const { upload, uploadedFileUrl } = require("../config/cloudinary");
const { protect, optionalProtect, adminOnly } = require("../middleware/auth");

const safeSeller = "fullName marketplaceStoreName marketplaceStoreSlug marketplaceAvatar marketplaceVerified city";
const fail = (res, status, message) => res.status(status).json({ success: false, message });

// Public marketplace catalogue
router.get("/categories", async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, categories });
});
router.get("/listings", async (req, res, next) => {
  try {
    const { q, category, city, page = 1, limit = 24 } = req.query;
    const query = { status: "active" };
    if (category) query.category = category;
    if (city) query["location.city"] = city;
    if (q) query.$text = { $search: q };
    const take = Math.min(Math.max(Number(limit) || 24, 1), 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const [listings, total] = await Promise.all([
      Listing.find(query).sort({ featured: -1, createdAt: -1 }).skip(skip).limit(take).populate("sellerId", safeSeller),
      Listing.countDocuments(query),
    ]);
    res.json({ success: true, listings, total, page: Number(page), pages: Math.ceil(total / take) });
  } catch (err) { next(err); }
});
router.get("/listings/:id", optionalProtect, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("sellerId", safeSeller);
    if (!listing || (listing.status !== "active" && String(listing.sellerId?._id) !== String(req.user?._id) && req.user?.role !== "admin")) return fail(res, 404, "Listing not found");
    if (listing.status === "active") { listing.views += 1; await listing.save(); }
    res.json({ success: true, listing });
  } catch (err) { next(err); }
});

// Seller self-service
router.post("/become-seller", protect, async (req, res, next) => {
  try {
    const { storeName, bio, city } = req.body;
    if (!storeName) return fail(res, 400, "Store name is required");
    const base = slugify(storeName);
    let slug = base, suffix = 2;
    while (await User.exists({ marketplaceStoreSlug: slug, _id: { $ne: req.user._id } })) slug = `${base}-${suffix++}`;
    req.user.role = req.user.role === "customer" ? "vendor" : req.user.role;
    req.user.marketplaceStoreName = storeName;
    req.user.marketplaceStoreSlug = slug;
    req.user.marketplaceBio = bio || "";
    if (city) req.user.city = city;
    await req.user.save();
    res.json({ success: true, user: req.user });
  } catch (err) { next(err); }
});
router.get("/me/listings", protect, async (req, res, next) => {
  try { res.json({ success: true, listings: await Listing.find({ sellerId: req.user._id }).sort({ createdAt: -1 }) }); } catch (err) { next(err); }
});
router.post("/upload", protect, upload.single("image"), (req, res) => {
  if (!req.file?.path) return fail(res, 400, "Choose a JPG, PNG or WebP image up to 5 MB");
  res.status(201).json({ success: true, url: uploadedFileUrl(req.file) });
});
router.post("/listings", protect, async (req, res, next) => {
  try {
    if (!["vendor", "admin"].includes(req.user.role)) return fail(res, 403, "Create a seller profile before posting a listing");
    const { category, subcategory, title, description, price, images, attributes, location } = req.body;
    if (!category || !subcategory || !title) return fail(res, 400, "Category, subcategory and title are required");
    const listing = await Listing.create({ sellerId: req.user._id, category, subcategory, title, description, price, images, attributes, location, status: req.user.role === "admin" ? "active" : "pending" });
    res.status(201).json({ success: true, listing });
  } catch (err) { next(err); }
});
router.patch("/listings/:id", protect, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return fail(res, 404, "Listing not found");
    if (String(listing.sellerId) !== String(req.user._id) && req.user.role !== "admin") return fail(res, 403, "Not authorised");
    ["title", "description", "price", "images", "attributes", "location", "category", "subcategory"].forEach((key) => { if (req.body[key] !== undefined) listing[key] = req.body[key]; });
    if (req.user.role !== "admin") listing.status = "pending";
    await listing.save(); res.json({ success: true, listing });
  } catch (err) { next(err); }
});

// Admin moderation and taxonomy
router.get("/admin/summary", protect, adminOnly, async (_req, res, next) => {
  try {
    const [total, pending, active, sellers, categories] = await Promise.all([Listing.countDocuments(), Listing.countDocuments({ status: "pending" }), Listing.countDocuments({ status: "active" }), User.countDocuments({ role: "vendor" }), Category.countDocuments({ isActive: true })]);
    res.json({ success: true, stats: { total, pending, active, sellers, categories } });
  } catch (err) { next(err); }
});
router.get("/admin/listings", protect, adminOnly, async (req, res, next) => {
  try { const query = req.query.status ? { status: req.query.status } : {}; res.json({ success: true, listings: await Listing.find(query).sort({ createdAt: -1 }).populate("sellerId", safeSeller) }); } catch (err) { next(err); }
});
router.patch("/admin/listings/:id", protect, adminOnly, async (req, res, next) => {
  try { const listing = await Listing.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status, featured: req.body.featured } }, { new: true }); if (!listing) return fail(res, 404, "Listing not found"); res.json({ success: true, listing }); } catch (err) { next(err); }
});
router.get("/admin/categories", protect, adminOnly, async (_req, res, next) => { try { res.json({ success: true, categories: await Category.find().sort({ name: 1 }) }); } catch (err) { next(err); } });
router.post("/admin/categories", protect, adminOnly, async (req, res, next) => {
  try { const { name, icon, subcategories = [] } = req.body; if (!name) return fail(res, 400, "Category name is required"); const category = await Category.create({ name, slug: slugify(name), icon, subcategories: subcategories.map(s => ({ ...s, slug: slugify(s.name) })) }); res.status(201).json({ success: true, category }); } catch (err) { next(err); }
});
router.patch("/admin/categories/:id", protect, adminOnly, async (req, res, next) => { try { const category = await Category.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }); if (!category) return fail(res, 404, "Category not found"); res.json({ success: true, category }); } catch (err) { next(err); } });

module.exports = router;
