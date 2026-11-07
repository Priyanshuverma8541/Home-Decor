const router = require("express").Router();
const controller = require("./controller");
const { protect, adminOnly } = require("../../middleware/auth");
const multer = require("multer");
const cloudinary = require("../../config/cloudinary").cloudinary;
const crypto = require("crypto");
const path = require("path");
const memoryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (_req, file, done) => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const supported = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".glb", ".gltf"].includes(extension);
  done(supported ? null : new Error("Upload a JPG, PNG, WebP, PDF, GLB or GLTF asset."), supported);
} });

router.post("/admin/media", protect, adminOnly, memoryUpload.single("asset"), (req, res, next) => {
  if (!req.file) return res.status(400).json({ success: false, message: "Choose an asset to upload." });
  if (!cloudinary.config().cloud_name || !cloudinary.config().api_key || !cloudinary.config().api_secret) return res.status(503).json({ success: false, message: "Central Cloudinary storage is not configured." });
  const extension = path.extname(req.file.originalname).toLowerCase();
  const resourceType = [".pdf", ".glb", ".gltf"].includes(extension) ? "raw" : "image";
  const folder = `${process.env.CLOUDINARY_FOLDER || "savitri-livings"}/growth-livings`;
  const upload = cloudinary.uploader.upload_stream({ folder, public_id: `asset-${crypto.randomUUID()}`, resource_type: resourceType, overwrite: false }, (error, result) => {
    if (error) return next(error);
    res.status(201).json({ success: true, asset: { url: result.secure_url, name: req.file.originalname, format: result.format, resourceType: result.resource_type, bytes: result.bytes } });
  });
  upload.end(req.file.buffer);
});

router.get("/public/config", controller.getPublicSettings);
router.get("/public/portfolio/:slug", controller.getPublicCandidate);
router.get("/public/candidates", controller.listPublicCandidates);
router.get("/public/professionals", controller.listPublicProfiles);
router.get("/public/companies", controller.listPublicCompanies);
router.get("/public/jobs", controller.listPublicJobs);

router.get("/me/profile", protect, controller.getMyProfile);
router.put("/me/profile", protect, controller.saveMyProfile);
router.get("/me/portfolios", protect, controller.listMyPortfolios);
router.post("/me/portfolios/:slug/approval", protect, controller.approveMyPortfolio);
router.delete("/me/portfolios/:slug/approval", protect, controller.withdrawPortfolioApproval);
router.post("/public/jobs/:id/applications", protect, controller.applyToJob);

router.get("/admin/settings", protect, adminOnly, controller.getAdminSettings);
router.put("/admin/settings", protect, adminOnly, controller.updateSettings);
router.get("/admin/candidates", protect, adminOnly, controller.listAdminCandidates);
router.post("/admin/candidates", protect, adminOnly, controller.createCandidate);
router.patch("/admin/candidates/:slug", protect, adminOnly, controller.updateCandidate);
router.get("/admin/companies", protect, adminOnly, controller.listAdminCompanies);
router.post("/admin/companies", protect, adminOnly, controller.saveCompany);
router.patch("/admin/companies/:id", protect, adminOnly, controller.saveCompany);
router.get("/admin/jobs", protect, adminOnly, controller.listAdminJobs);
router.post("/admin/jobs", protect, adminOnly, controller.saveJob);
router.patch("/admin/jobs/:id", protect, adminOnly, controller.saveJob);
router.get("/admin/applications", protect, adminOnly, controller.listApplications);
router.patch("/admin/applications/:id", protect, adminOnly, controller.updateApplication);

module.exports = router;
