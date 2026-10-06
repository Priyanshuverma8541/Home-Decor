const router = require("express").Router();
const { protect, adminOnly } = require("../../../middleware/auth");
const ctrl = require("../controllers/savinexaController");
const SavinexaJob = require("../models/SavinexaJob");
const SavinexaEnquiry = require("../models/SavinexaEnquiry");
const SavinexaBanner = require("../models/SavinexaBanner");
const SavinexaPage = require("../models/SavinexaPage");
const { upload, uploadedFileUrl } = require("../../../config/cloudinary");

router.get("/jobs", async (_req, res, next) => {
  try { res.json({ success: true, jobs: await SavinexaJob.find({ status: "published" }).select("title department location employmentType description requirements applicationEmail createdAt").sort({ createdAt: -1 }).lean() }); }
  catch (error) { next(error); }
});
router.post("/enquiries", async (req, res, next) => {
  try {
    const { name, email, phone = "", organization = "", company = "", need = "", message, source = "savinexa-site" } = req.body || {};
    if (typeof name !== "string" || name.trim().length < 2 || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof message !== "string" || message.trim().length < 5) return res.status(400).json({ success: false, message: "Please provide your name, a valid email and a short message." });
    await SavinexaEnquiry.create({ name: name.trim().slice(0, 120), email: email.trim().toLowerCase().slice(0, 254), phone: String(phone).slice(0, 32), organization: String(organization || company).slice(0, 160), message: `${need ? `Hiring need: ${String(need).slice(0, 160)}\n\n` : ""}${message.trim()}`.slice(0, 5000), source: String(source).slice(0, 80) });
    res.status(201).json({ success: true, message: "Thank you. Your enquiry has been received." });
  } catch (error) { next(error); }
});
router.post("/admin/media", protect, adminOnly, upload.single("image"), (req, res) => { if (!req.file?.path) return res.status(400).json({ success: false, message: "Choose a JPG, PNG or WebP image up to 5 MB" }); res.status(201).json({ success: true, url: uploadedFileUrl(req.file) }); });
router.get("/admin/talent", protect, adminOnly, async (_req, res, next) => {
  try { const [jobs, enquiries] = await Promise.all([SavinexaJob.find().sort({ updatedAt: -1 }).lean(), SavinexaEnquiry.find().sort({ createdAt: -1 }).limit(300).lean()]); res.json({ success: true, jobs, enquiries }); }
  catch (error) { next(error); }
});
router.post("/admin/jobs", protect, adminOnly, async (req, res, next) => {
  try { const job = await SavinexaJob.create(req.body || {}); res.status(201).json({ success: true, job }); }
  catch (error) { next(error); }
});
router.patch("/admin/jobs/:id", protect, adminOnly, async (req, res, next) => {
  try { const job = await SavinexaJob.findByIdAndUpdate(req.params.id, req.body || {}, { new: true, runValidators: true }); if (!job) return res.status(404).json({ success: false, message: "Role not found" }); res.json({ success: true, job }); }
  catch (error) { next(error); }
});
router.patch("/admin/enquiries/:id", protect, adminOnly, async (req, res, next) => {
  try { const status = req.body?.status; if (!["new", "reviewing", "responded", "closed"].includes(status)) return res.status(400).json({ success: false, message: "Invalid enquiry status" }); const enquiry = await SavinexaEnquiry.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true }); if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" }); res.json({ success: true, enquiry }); }
  catch (error) { next(error); }
});

router.get("/home", ctrl.getHome);
router.get("/products", ctrl.listProducts);
router.get("/products/:slug", ctrl.getProductBySlug);
router.get("/categories", ctrl.listCategories);
router.get("/collections", ctrl.listCollections);
router.get("/banners", ctrl.listBanners);
router.get("/pages/:slug", async (req, res, next) => { try { const page = await SavinexaPage.findOne({ slug: req.params.slug, publishStatus: "published", visibility: "public" }); if (!page) return res.status(404).json({ success: false, message: "Page not found" }); res.json({ success: true, page }); } catch (error) { next(error); } });
router.get("/settings", ctrl.getSettings);
router.put("/settings", protect, adminOnly, ctrl.updateSettings);
router.get("/analytics", ctrl.getAnalytics);
router.post("/events", ctrl.trackEvent);

router.get("/admin/dashboard", protect, adminOnly, ctrl.getDashboard);
router.get("/admin/products", protect, adminOnly, ctrl.listProducts);
router.post("/admin/products", protect, adminOnly, ctrl.createProduct);
router.put("/admin/products/:id", protect, adminOnly, ctrl.updateProduct);
router.delete("/admin/products/:id", protect, adminOnly, ctrl.deleteProduct);

router.get("/admin/categories", protect, adminOnly, ctrl.listCategories);
router.post("/admin/categories", protect, adminOnly, ctrl.createCategory);
router.put("/admin/categories/:id", protect, adminOnly, ctrl.updateCategory);
router.delete("/admin/categories/:id", protect, adminOnly, ctrl.deleteCategory);

router.get("/admin/collections", protect, adminOnly, ctrl.listAdminCollections);
router.post("/admin/collections", protect, adminOnly, ctrl.createCollection);
router.put("/admin/collections/:id", protect, adminOnly, ctrl.updateCollection);
router.delete("/admin/collections/:id", protect, adminOnly, ctrl.deleteCollection);

router.get("/admin/banners", protect, adminOnly, async (_req, res, next) => { try { res.json({ success: true, banners: await SavinexaBanner.find({}).sort({ priority: -1, createdAt: -1 }).lean() }); } catch (error) { next(error); } });
router.post("/admin/banners", protect, adminOnly, ctrl.createBanner);
router.put("/admin/banners/:id", protect, adminOnly, async (req, res, next) => { try { const banner = await SavinexaBanner.findByIdAndUpdate(req.params.id, { $set: req.body || {} }, { new: true, runValidators: true }); if (!banner) return res.status(404).json({ success: false, message: "Banner not found" }); res.json({ success: true, banner }); } catch (error) { next(error); } });
router.delete("/admin/banners/:id", protect, adminOnly, async (req, res, next) => { try { const banner = await SavinexaBanner.findByIdAndDelete(req.params.id); if (!banner) return res.status(404).json({ success: false, message: "Banner not found" }); res.json({ success: true }); } catch (error) { next(error); } });

router.get("/admin/pages", protect, adminOnly, async (req, res) => {
  try {
    const pages = await require("../models/SavinexaPage").find({}).sort({ createdAt: -1 });
    res.json({ success: true, pages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/admin/pages", protect, adminOnly, ctrl.createPage);
router.put("/admin/pages/:id", protect, adminOnly, async (req, res, next) => { try { const page = await SavinexaPage.findById(req.params.id); if (!page) return res.status(404).json({ success: false, message: "Page not found" }); Object.assign(page, req.body || {}); await page.save(); res.json({ success: true, page }); } catch (error) { next(error); } });
router.delete("/admin/pages/:id", protect, adminOnly, async (req, res, next) => { try { const page = await SavinexaPage.findByIdAndDelete(req.params.id); if (!page) return res.status(404).json({ success: false, message: "Page not found" }); res.json({ success: true }); } catch (error) { next(error); } });

router.get("/admin/campaigns", protect, adminOnly, async (req, res) => {
  try {
    const campaigns = await require("../models/SavinexaCampaign").find({}).sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/admin/campaigns", protect, adminOnly, ctrl.createCampaign);

module.exports = router;
