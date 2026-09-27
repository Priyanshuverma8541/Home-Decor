const router = require("express").Router();
const controller = require("../controllers/privacyController");
const { optionalProtect, protect, adminOnly } = require("../middleware/auth");

router.post("/consents", optionalProtect, controller.saveConsent);
router.get("/mine", optionalProtect, controller.getMine);
router.get("/admin/summary", protect, adminOnly, controller.getAdminSummary);
router.get("/admin/consents", protect, adminOnly, controller.getAdminConsents);
router.delete("/admin/consents/:id", protect, adminOnly, controller.deleteAdminConsent);

module.exports = router;
