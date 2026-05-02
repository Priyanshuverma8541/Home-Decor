const router = require("express").Router();
const ctrl   = require("../controllers/leadController");
const { protect, adminOnly } = require("../middleware/auth");
router.get("/",       protect, adminOnly, ctrl.getAll);
router.get("/stats",  protect, adminOnly, ctrl.getStats);
router.post("/",      ctrl.create);
router.patch("/:id",  protect, adminOnly, ctrl.update);
router.delete("/:id", protect, adminOnly, ctrl.remove);
module.exports = router;
