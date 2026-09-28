const express = require("express");
const multer = require("multer");
const ctrl = require("../controllers/pagesController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();
const htmlUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024, files: 1 } });

router.get("/admin", protect, adminOnly, ctrl.listAdmin);
router.post("/admin", protect, adminOnly, ctrl.create);
router.get("/admin/templates", protect, adminOnly, ctrl.listTemplates);
router.post("/admin/templates", protect, adminOnly, ctrl.createTemplate);
router.patch("/admin/templates/:templateId", protect, adminOnly, ctrl.updateTemplate);
router.delete("/admin/templates/:templateId", protect, adminOnly, ctrl.deleteTemplate);
router.post("/admin/upload-html", protect, adminOnly, htmlUpload.single("file"), ctrl.uploadHtml);
router.get("/admin/:id/analytics", protect, adminOnly, ctrl.analytics);
router.get("/admin/:id/versions", protect, adminOnly, ctrl.versions);
router.post("/admin/:id/versions/:version/restore", protect, adminOnly, ctrl.restoreVersion);
router.post("/admin/:id/preview-token", protect, adminOnly, ctrl.createPreviewToken);
router.post("/admin/:id/duplicate", protect, adminOnly, ctrl.duplicate);
router.post("/admin/:id/publish", protect, adminOnly, ctrl.publish);
router.post("/admin/:id/unpublish", protect, adminOnly, ctrl.unpublish);
router.post("/admin/:id/archive", protect, adminOnly, ctrl.archive);
router.get("/admin/:id", protect, adminOnly, ctrl.getAdmin);
router.patch("/admin/:id", protect, adminOnly, ctrl.update);
router.get("/preview/:slug", ctrl.getPreview);
router.post("/:slug/events", ctrl.trackEvent);
router.post("/:slug/forms/:formId", ctrl.submitForm);
router.get("/:slug", ctrl.getPublic);

module.exports = router;