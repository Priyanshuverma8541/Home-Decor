const router = require("express").Router();
const PartnerBusiness = require("../models/PartnerBusiness");
const { protect, adminOnly } = require("../middleware/auth");
const fail = (res, status, message) => res.status(status).json({ success: false, message });

router.get("/", async (req, res, next) => {
  try {
    const query = { isPublic: true, collaborationStatus: "public" };
    if (req.query.category) query.category = req.query.category;
    res.json({ success: true, partners: await PartnerBusiness.find(query).select("businessName category location productsServices website instagram whatsapp linkedIn partnershipType").sort({ businessName: 1 }) });
  } catch (error) { next(error); }
});

router.post("/apply", async (req, res, next) => {
  try {
    const { businessName, category, partnershipType, contactPerson, email, phone } = req.body;
    if (!businessName || !category || !partnershipType || !contactPerson || (!email && !phone)) return fail(res, 400, "Business name, category, partnership type, contact person, and email or phone are required");
    const partner = await PartnerBusiness.create({ ...req.body, status: "discovered", collaborationStatus: "application", isPublic: false });
    res.status(201).json({ success: true, partner: { _id: partner._id, businessName: partner.businessName } });
  } catch (error) { next(error); }
});

router.get("/admin", protect, adminOnly, async (req, res, next) => {
  try {
    const query = {}; if (req.query.status) query.status = req.query.status; if (req.query.category) query.category = req.query.category;
    if (req.query.search) query.$or = ["businessName", "contactPerson", "location", "email", "phone"].map((field) => ({ [field]: { $regex: req.query.search, $options: "i" } }));
    res.json({ success: true, partners: await PartnerBusiness.find(query).sort({ nextFollowUpAt: 1, createdAt: -1 }) });
  } catch (error) { next(error); }
});
router.post("/admin", protect, adminOnly, async (req, res, next) => {
  try { const partner = await PartnerBusiness.create({ ...req.body, createdBy: req.user._id }); res.status(201).json({ success: true, partner }); } catch (error) { next(error); }
});
router.patch("/admin/:id", protect, adminOnly, async (req, res, next) => {
  try { const partner = await PartnerBusiness.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }); if (!partner) return fail(res, 404, "Business opportunity not found"); res.json({ success: true, partner }); } catch (error) { next(error); }
});
router.delete("/admin/:id", protect, adminOnly, async (req, res, next) => {
  try { const partner = await PartnerBusiness.findByIdAndDelete(req.params.id); if (!partner) return fail(res, 404, "Business opportunity not found"); res.json({ success: true }); } catch (error) { next(error); }
});
module.exports = router;
