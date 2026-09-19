const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Lead = require("../models/Lead");
const Category = require("../models/MarketplaceCategory");
const Listing = require("../models/MarketplaceListing");
const { upload, uploadedFileUrl } = require("../config/cloudinary");
const { protect, optionalProtect, adminOnly } = require("../middleware/auth");

const slugify = (value = "") => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const success = (res, data, status = 200) => res.status(status).json({ success: true, data });
const failure = (res, status, message, code = "REQUEST_FAILED") => res.status(status).json({ success: false, error: { code, message } });
const publicSeller = "fullName phone marketplaceStoreName marketplaceStoreSlug marketplaceBio marketplaceAvatar marketplaceVerified city";
const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
const sellerView = (user) => {
  const raw = user?.toObject ? user.toObject({ virtuals: true }) : user;
  if (!raw) return raw;
  return {
    ...raw,
    name: raw.fullName,
    storeName: raw.marketplaceStoreName || raw.shopName,
    storeSlug: raw.marketplaceStoreSlug,
    bio: raw.marketplaceBio,
    verified: raw.marketplaceVerified,
    location: { city: raw.city },
  };
};
const categoryView = (category) => {
  const raw = category?.toObject ? category.toObject() : category;
  return { ...raw, subcategories: (raw.subcategories || []).map((item) => ({ ...item, attrs: item.attributes || item.attrs || [] })) };
};
const listingView = (listing) => {
  const raw = listing?.toObject ? listing.toObject() : listing;
  return { ...raw, sellerId: raw.sellerId ? sellerView(raw.sellerId) : raw.sellerId };
};

// ── Shared authentication ───────────────────────────────────────────────────
router.post("/auth/register", async (req, res, next) => {
  try {
    const { name, fullName, email, phone, password } = req.body;
    if (!(name || fullName) || !password || (!email && !phone)) return failure(res, 400, "Name, password and email or phone are required", "MISSING_FIELDS");
    const clauses = [{ email }, { phone }].filter((entry) => Object.values(entry)[0]);
    if (await User.findOne({ $or: clauses })) return failure(res, 409, "An account with this email or phone already exists", "ACCOUNT_EXISTS");
    const user = await User.create({ fullName: fullName || name, email, phone, password, city: "", source: "website" });
    await Lead.create({ name: user.fullName, email, phone, city: "", source: "website", userId: user._id, status: "converted" });
    return success(res, { token: tokenFor(user._id), user: sellerView(user) }, 201);
  } catch (error) { next(error); }
});
router.post("/auth/login", async (req, res, next) => {
  try {
    const identifier = req.body.emailOrPhone || req.body.identifier;
    const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    if (!user || !(await user.matchPassword(req.body.password))) return failure(res, 401, "Invalid email, phone or password", "INVALID_CREDENTIALS");
    if (!user.isActive) return failure(res, 403, "This account is inactive", "ACCOUNT_INACTIVE");
    return success(res, { token: tokenFor(user._id), user: sellerView(user) });
  } catch (error) { next(error); }
});
router.get("/auth/me", protect, (req, res) => success(res, { user: sellerView(req.user) }));
router.patch("/auth/become-seller", protect, async (req, res, next) => {
  try {
    const { storeName, bio } = req.body;
    if (!storeName) return failure(res, 400, "Store name is required", "MISSING_FIELDS");
    const base = slugify(storeName); let slug = base; let suffix = 2;
    while (await User.exists({ marketplaceStoreSlug: slug, _id: { $ne: req.user._id } })) slug = `${base}-${suffix++}`;
    req.user.role = req.user.role === "customer" ? "vendor" : req.user.role;
    req.user.marketplaceStoreName = storeName; req.user.marketplaceStoreSlug = slug; req.user.marketplaceBio = bio || "";
    await req.user.save();
    return success(res, { user: sellerView(req.user) });
  } catch (error) { next(error); }
});

// ── Public and seller marketplace ───────────────────────────────────────────
router.get("/categories", async (_req, res, next) => { try { success(res, { categories: (await Category.find({ isActive: true }).sort({ name: 1 })).map(categoryView) }); } catch (error) { next(error); } });
router.get("/listings/mine/all", protect, async (req, res, next) => { try { success(res, { listings: await Listing.find({ sellerId: req.user._id }).sort({ createdAt: -1 }) }); } catch (error) { next(error); } });
router.get("/listings/store/:slug", async (req, res, next) => {
  try {
    const seller = await User.findOne({ marketplaceStoreSlug: req.params.slug, isActive: true });
    if (!seller) return failure(res, 404, "Store not found", "NOT_FOUND");
    const listings = await Listing.find({ sellerId: seller._id, status: "active" }).sort({ featured: -1, createdAt: -1 });
    return success(res, { seller: sellerView(seller), listings: listings.map(listingView) });
  } catch (error) { next(error); }
});
router.get("/listings", async (req, res, next) => {
  try {
    const { search, q, category, city, page = 1, limit = 24 } = req.query;
    const query = { status: "active" }; if (category) query.category = category; if (city) query["location.city"] = city; if (search || q) query.$text = { $search: search || q };
    const take = Math.min(Math.max(Number(limit) || 24, 1), 100); const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const [listings, total] = await Promise.all([Listing.find(query).sort({ featured: -1, createdAt: -1 }).skip(skip).limit(take).populate("sellerId", publicSeller), Listing.countDocuments(query)]);
    success(res, { listings: listings.map(listingView), total, page: Number(page), pages: Math.ceil(total / take) });
  } catch (error) { next(error); }
});
router.get("/listings/:id", optionalProtect, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("sellerId", publicSeller);
    if (!listing || (listing.status !== "active" && String(listing.sellerId?._id) !== String(req.user?._id) && req.user?.role !== "admin")) return failure(res, 404, "Listing not found", "NOT_FOUND");
    if (listing.status === "active") { listing.views += 1; await listing.save(); }
    success(res, { listing: listingView(listing) });
  } catch (error) { next(error); }
});
router.post("/upload", protect, upload.single("image"), (req, res) => {
  if (!req.file?.path) return failure(res, 400, "An image is required", "MISSING_IMAGE");
  success(res, { url: uploadedFileUrl(req.file) }, 201);
});
router.post("/listings", protect, async (req, res, next) => {
  try {
    if (!['vendor', 'admin'].includes(req.user.role)) return failure(res, 403, "Create a seller profile before posting", "SELLER_REQUIRED");
    const { category, subcategory, title, description, price, images, attributes, location } = req.body;
    if (!category || !subcategory || !title) return failure(res, 400, "Category, subcategory and title are required", "MISSING_FIELDS");
    const listing = await Listing.create({ sellerId: req.user._id, category, subcategory, title, description, price, images: images || [], attributes: attributes || {}, location: { ...location, city: location?.city || "" }, status: req.user.role === "admin" ? "active" : "pending" });
    success(res, { listing }, 201);
  } catch (error) { next(error); }
});
router.patch("/listings/:id", protect, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id); if (!listing) return failure(res, 404, "Listing not found", "NOT_FOUND");
    if (String(listing.sellerId) !== String(req.user._id) && req.user.role !== "admin") return failure(res, 403, "Not authorised", "FORBIDDEN");
    ["category", "subcategory", "title", "description", "price", "images", "attributes", "location", "status"].forEach((key) => { if (req.body[key] !== undefined) listing[key] = req.body[key]; });
    if (req.user.role !== "admin" && req.body.status !== "sold") listing.status = "pending";
    await listing.save(); success(res, { listing });
  } catch (error) { next(error); }
});
router.delete("/listings/:id", protect, async (req, res, next) => {
  try { const listing = await Listing.findById(req.params.id); if (!listing) return failure(res, 404, "Listing not found", "NOT_FOUND"); if (String(listing.sellerId) !== String(req.user._id) && req.user.role !== "admin") return failure(res, 403, "Not authorised", "FORBIDDEN"); await listing.deleteOne(); success(res, { deleted: true }); } catch (error) { next(error); }
});

// ── Existing Thikana-admin paths, now protected by Savitri admin accounts ───
router.get("/admin/dashboard", protect, adminOnly, async (_req, res, next) => {
  try { const [totalListings, pendingListings, activeListings, totalUsers, totalSellers, activeCategories] = await Promise.all([Listing.countDocuments(), Listing.countDocuments({ status: "pending" }), Listing.countDocuments({ status: "active" }), User.countDocuments(), User.countDocuments({ role: "vendor" }), Category.countDocuments({ isActive: true })]); success(res, { totalListings, pendingListings, activeListings, totalUsers, totalSellers, activeCategories }); } catch (error) { next(error); }
});
router.get("/admin/listings", protect, adminOnly, async (req, res, next) => { try { const query = {}; if (req.query.status) query.status = req.query.status; if (req.query.category) query.category = req.query.category; const listings = await Listing.find(query).sort({ createdAt: -1 }).populate("sellerId", publicSeller); success(res, { listings: listings.map(listingView) }); } catch (error) { next(error); } });
router.patch("/admin/listings/:id", protect, adminOnly, async (req, res, next) => { try { const listing = await Listing.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }); if (!listing) return failure(res, 404, "Listing not found", "NOT_FOUND"); success(res, { listing }); } catch (error) { next(error); } });
router.delete("/admin/listings/:id", protect, adminOnly, async (req, res, next) => { try { const listing = await Listing.findByIdAndDelete(req.params.id); if (!listing) return failure(res, 404, "Listing not found", "NOT_FOUND"); success(res, { deleted: true }); } catch (error) { next(error); } });
router.get("/admin/users", protect, adminOnly, async (req, res, next) => { try { const filter = {}; if (req.query.role) filter.role = req.query.role; success(res, { users: await User.find(filter).select("-password").sort({ createdAt: -1 }) }); } catch (error) { next(error); } });
router.patch("/admin/users/:id", protect, adminOnly, async (req, res, next) => { try { const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).select("-password"); if (!user) return failure(res, 404, "User not found", "NOT_FOUND"); success(res, { user }); } catch (error) { next(error); } });
router.get("/admin/categories", protect, adminOnly, async (_req, res, next) => { try { success(res, { categories: (await Category.find().sort({ name: 1 })).map(categoryView) }); } catch (error) { next(error); } });
router.post("/admin/categories", protect, adminOnly, async (req, res, next) => { try { const { name, icon, subcategories = [] } = req.body; if (!name) return failure(res, 400, "Category name is required", "MISSING_FIELDS"); const category = await Category.create({ name, slug: slugify(name), icon: icon || "🏪", subcategories: subcategories.map((item) => ({ ...item, slug: item.slug || slugify(item.name), attributes: item.attributes || item.attrs || [] })) }); success(res, { category }, 201); } catch (error) { next(error); } });
router.patch("/admin/categories/:id", protect, adminOnly, async (req, res, next) => { try { const category = await Category.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }); if (!category) return failure(res, 404, "Category not found", "NOT_FOUND"); success(res, { category }); } catch (error) { next(error); } });
router.delete("/admin/categories/:id", protect, adminOnly, async (req, res, next) => { try { const category = await Category.findByIdAndDelete(req.params.id); if (!category) return failure(res, 404, "Category not found", "NOT_FOUND"); success(res, { deleted: true }); } catch (error) { next(error); } });

// An intentionally non-AI fallback keeps old UI usable without a paid provider.
router.post("/ai/draft-listing", protect, (_req, res) => success(res, { draft: { title: "", description: "" }, available: false }));

module.exports = router;
