const router = require("express").Router();
const ctrl   = require("../controllers/settingsController");
const { protect, adminOnly } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
router.get("/",      ctrl.getPublic);
router.get("/admin", protect, adminOnly, ctrl.getAdmin);
router.put("/",      protect, adminOnly, ctrl.update);
router.post("/qr",   protect, adminOnly, upload.single("qr"), ctrl.uploadQR);
module.exports = router;
