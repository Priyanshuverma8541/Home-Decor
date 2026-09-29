const router = require("express").Router();
const { protect, adminOnly } = require("../../../middleware/auth");
const ctrl = require("../controllers/savinexaController");

router.get("/home", ctrl.getHome);
router.get("/products", ctrl.listProducts);
router.get("/products/:slug", ctrl.getProductBySlug);
router.get("/categories", ctrl.listCategories);
router.get("/collections", ctrl.listCollections);
router.get("/banners", ctrl.listBanners);
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

router.get("/admin/banners", protect, adminOnly, ctrl.listBanners);
router.post("/admin/banners", protect, adminOnly, ctrl.createBanner);

router.get("/admin/pages", protect, adminOnly, async (req, res) => {
  try {
    const pages = await require("../models/SavinexaPage").find({}).sort({ createdAt: -1 });
    res.json({ success: true, pages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/admin/pages", protect, adminOnly, ctrl.createPage);

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
