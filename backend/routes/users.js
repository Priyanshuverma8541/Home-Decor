const router = require("express").Router();
const ctrl   = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/auth");
router.get("/",             protect, adminOnly, ctrl.getAll);
router.get("/delivery",     protect, adminOnly, ctrl.getDeliveryPartners);
router.post("/partner",     protect, adminOnly, ctrl.createPartner);
router.patch("/:id",        protect, adminOnly, ctrl.update);
router.patch("/:id/toggle", protect, adminOnly, ctrl.toggle);
module.exports = router;
