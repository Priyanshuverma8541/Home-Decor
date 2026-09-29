const SavinexaProduct = require("../models/SavinexaProduct");
const SavinexaCategory = require("../models/SavinexaCategory");
const SavinexaCollection = require("../models/SavinexaCollection");
const SavinexaBanner = require("../models/SavinexaBanner");
const SavinexaPage = require("../models/SavinexaPage");
const SavinexaCampaign = require("../models/SavinexaCampaign");
const SavinexaSettings = require("../models/SavinexaSettings");
const SavinexaEvent = require("../models/SavinexaEvent");

const slugify = (value) => String(value || "")
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, "")
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-");

const defaultSettings = {
  siteName: "Savinexa",
  primaryColor: "#1f2937",
  secondaryColor: "#eab308",
  background: "#f8fafc",
  typography: "Inter",
  borderRadius: "18px",
  heroStyle: "modern",
  animationIntensity: "moderate",
  productCardStyle: "premium",
  commerce: {
    currency: "INR",
    ctaDefaults: {
      primaryLabel: "Buy now",
      secondaryLabel: "Explore",
    },
  },
  seo: {
    defaultMetaTitle: "Savinexa",
    defaultMetaDescription: "Premium curated products and collections from Savinexa.",
  },
  socialLinks: {},
  contact: {},
  marketing: { campaignSettings: {}, utmSettings: {}, consentConfiguration: {} },
  announcementBar: { enabled: false, text: "", link: "" },
};

const getSettingsRecord = async () => {
  let settings = await SavinexaSettings.findOne();
  if (!settings) {
    settings = await SavinexaSettings.create(defaultSettings);
  }
  return settings;
};

const safeBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";

exports.getHome = async (req, res) => {
  try {
    const [products, categories, collections, banners, settings] = await Promise.all([
      SavinexaProduct.find({ active: true, visibility: "public" }).sort({ sortOrder: -1, createdAt: -1 }).limit(8),
      SavinexaCategory.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 }).limit(10),
      SavinexaCollection.find({ isActive: true }).sort({ createdAt: -1 }).limit(6),
      SavinexaBanner.find({ active: true }).sort({ priority: -1, createdAt: -1 }).limit(4),
      getSettingsRecord(),
    ]);

    res.json({
      success: true,
      home: {
        settings: settings.toObject(),
        featuredProducts: products,
        categories,
        collections,
        banners,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.listProducts = async (req, res) => {
  try {
    const { category, tag, search, featured, bestseller, newArrival, page = 1, limit = 12 } = req.query;
    const filter = { active: true, visibility: "public" };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (featured === "true") filter.featured = true;
    if (bestseller === "true") filter.bestseller = true;
    if (newArrival === "true") filter.newArrival = true;
    if (search) filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      SavinexaProduct.find(filter).sort({ sortOrder: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      SavinexaProduct.countDocuments(filter),
    ]);

    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const product = await SavinexaProduct.findOne({ slug: req.params.slug, active: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.listCategories = async (req, res) => {
  try {
    const categories = await SavinexaCategory.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.listCollections = async (req, res) => {
  try {
    const collections = await SavinexaCollection.find({ isActive: true }).populate("products").sort({ createdAt: -1 });
    res.json({ success: true, collections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.listBanners = async (req, res) => {
  try {
    const banners = await SavinexaBanner.find({ active: true }).sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await getSettingsRecord();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await getSettingsRecord();
    Object.assign(settings, req.body || {});
    await settings.save();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const [productCount, categoryCount, collectionCount, pageCount, campaignCount, salesRevenue] = await Promise.all([
      SavinexaProduct.countDocuments(),
      SavinexaCategory.countDocuments(),
      SavinexaCollection.countDocuments(),
      SavinexaPage.countDocuments(),
      SavinexaCampaign.countDocuments(),
      SavinexaProduct.aggregate([{ $group: { _id: null, total: { $sum: { $multiply: ["$price", { $ifNull: ["$inventory.stock", 0] }] } } } }]),
    ]);

    const topProducts = await SavinexaProduct.find().sort({ createdAt: -1 }).limit(5);
    res.json({
      success: true,
      dashboard: {
        totals: {
          products: productCount,
          categories: categoryCount,
          collections: collectionCount,
          pages: pageCount,
          campaigns: campaignCount,
          estimatedRevenue: salesRevenue[0]?.total || 0,
        },
        topProducts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const [pageViews, productViews, events] = await Promise.all([
      SavinexaEvent.countDocuments({ eventType: "page_view" }),
      SavinexaEvent.countDocuments({ eventType: "product_view" }),
      SavinexaEvent.find().sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({ success: true, analytics: { pageViews, productViews, events } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.trackEvent = async (req, res) => {
  try {
    const event = await SavinexaEvent.create({
      eventType: req.body.eventType || "page_view",
      product: req.body.product || undefined,
      category: req.body.category || undefined,
      collection: req.body.collection || undefined,
      user: req.body.user || undefined,
      sessionId: req.body.sessionId || undefined,
      metadata: req.body.metadata || {},
    });

    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const normalizePayload = (payload = {}) => {
  const next = { ...payload };
  if (!next.slug && next.name) next.slug = slugify(next.name);
  if (next.tags && typeof next.tags === "string") next.tags = next.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  if (next.images && typeof next.images === "string") next.images = [next.images];
  if (next.videos && typeof next.videos === "string") next.videos = [next.videos];
  if (next.display) next.display = { ...next.display };
  if (next.inventory && typeof next.inventory === "string") next.inventory = { stock: Number(next.inventory) || 0 };
  if (next.featured !== undefined) next.featured = safeBoolean(next.featured);
  if (next.bestseller !== undefined) next.bestseller = safeBoolean(next.bestseller);
  if (next.newArrival !== undefined) next.newArrival = safeBoolean(next.newArrival);
  if (next.active !== undefined) next.active = safeBoolean(next.active);
  if (next.visibility === undefined) next.visibility = "public";
  return next;
};

exports.createProduct = async (req, res) => {
  try {
    const payload = normalizePayload(req.body || {});
    const product = await SavinexaProduct.create(payload);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await SavinexaProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    Object.assign(product, normalizePayload(req.body || {}));
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await SavinexaProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    await product.deleteOne();
    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.slug && payload.name) payload.slug = slugify(payload.name);
    const category = await SavinexaCategory.create(payload);
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await SavinexaCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    Object.assign(category, req.body || {});
    if (!category.slug && category.name) category.slug = slugify(category.name);
    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await SavinexaCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    await category.deleteOne();
    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCollection = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.slug && payload.name) payload.slug = slugify(payload.name);
    const collection = await SavinexaCollection.create(payload);
    res.status(201).json({ success: true, collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCollection = async (req, res) => {
  try {
    const collection = await SavinexaCollection.findById(req.params.id);
    if (!collection) return res.status(404).json({ success: false, message: "Collection not found" });
    Object.assign(collection, req.body || {});
    if (!collection.slug && collection.name) collection.slug = slugify(collection.name);
    await collection.save();
    res.json({ success: true, collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCollection = async (req, res) => {
  try {
    const collection = await SavinexaCollection.findById(req.params.id);
    if (!collection) return res.status(404).json({ success: false, message: "Collection not found" });
    await collection.deleteOne();
    res.json({ success: true, message: "Collection deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.listAdminCollections = async (req, res) => {
  try {
    const collections = await SavinexaCollection.find({}).sort({ createdAt: -1 });
    res.json({ success: true, collections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const banner = await SavinexaBanner.create(req.body || {});
    res.status(201).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.slug && payload.name) payload.slug = slugify(payload.name);
    const campaign = await SavinexaCampaign.create(payload);
    res.status(201).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPage = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.slug && payload.title) payload.slug = slugify(payload.title);
    const page = await SavinexaPage.create(payload);
    res.status(201).json({ success: true, page });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
