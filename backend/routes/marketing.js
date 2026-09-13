const router = require("express").Router();
const User = require("../models/User");
const Listing = require("../models/MarketplaceListing");
const Campaign = require("../models/Campaign");
const Audience = require("../models/MarketingAudience");
const Content = require("../models/MarketingContent");
const { protect, adminOnly } = require("../middleware/auth");

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const objectId = (value) => /^[a-f\d]{24}$/i.test(String(value));

// Marketing has one source of truth: the accounts, marketplace and campaigns
// already managed by Savitri Livings.  Sending remains disabled until the owner
// configures an approved delivery provider separately.
router.use(protect, adminOnly);

router.get("/dashboard", async (_req, res, next) => {
  try {
    const [customers, marketplaceListings, campaigns, emailsSent, audiences, creatives, captions] = await Promise.all([
      User.countDocuments({ isActive: true, $or: [{ email: { $exists: true, $ne: "" } }, { phone: { $exists: true, $ne: "" } }] }),
      Listing.countDocuments({ status: "active" }),
      Campaign.countDocuments(), Campaign.aggregate([{ $match: { status: "sent" } }, { $group: { _id: null, total: { $sum: "$sentCount" } } }]),
      Audience.countDocuments(), Content.countDocuments({ type: "creative" }), Content.countDocuments({ type: "caption" }),
    ]);
    res.json({ success: true, dashboard: { customers, marketplaceListings, campaigns, emailsSent: emailsSent[0]?.total || 0, audiences, creatives, captions } });
  } catch (error) { next(error); }
});

router.get("/customers", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const query = { isActive: true };
    if (search) query.$or = ["fullName", "email", "phone", "city"].map((field) => ({ [field]: { $regex: search, $options: "i" } }));
    const customers = await User.find(query).select("fullName email phone city role marketplaceStoreName").sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, customers });
  } catch (error) { next(error); }
});

router.get("/audiences", async (_req, res, next) => {
  try { res.json({ success: true, audiences: await Audience.find().populate("customerIds", "fullName email phone city").sort({ createdAt: -1 }) }); } catch (error) { next(error); }
});
router.post("/audiences", async (req, res, next) => {
  try {
    const { name, description, kind, customerIds = [], filters = {} } = req.body;
    if (!name?.trim()) return fail(res, 400, "Audience name is required");
    const validCustomers = customerIds.filter(objectId);
    const audience = await Audience.create({ name, description, kind, customerIds: validCustomers, filters, createdBy: req.user._id });
    res.status(201).json({ success: true, audience });
  } catch (error) { next(error); }
});
router.patch("/audiences/:id", async (req, res, next) => {
  try {
    const patch = { ...req.body }; if (patch.customerIds) patch.customerIds = patch.customerIds.filter(objectId);
    const audience = await Audience.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true });
    if (!audience) return fail(res, 404, "Audience not found");
    res.json({ success: true, audience });
  } catch (error) { next(error); }
});
router.delete("/audiences/:id", async (req, res, next) => {
  try { const audience = await Audience.findByIdAndDelete(req.params.id); if (!audience) return fail(res, 404, "Audience not found"); res.json({ success: true }); } catch (error) { next(error); }
});

router.get("/content", async (req, res, next) => {
  try { const query = req.query.type ? { type: req.query.type } : {}; res.json({ success: true, content: await Content.find(query).sort({ createdAt: -1 }) }); } catch (error) { next(error); }
});
router.post("/content", async (req, res, next) => {
  try {
    const { type, name, subject, body, format, metadata } = req.body;
    if (!type || !name?.trim()) return fail(res, 400, "Content type and name are required");
    const content = await Content.create({ type, name, subject, body, format, metadata, createdBy: req.user._id });
    res.status(201).json({ success: true, content });
  } catch (error) { next(error); }
});
router.delete("/content/:id", async (req, res, next) => {
  try { const content = await Content.findByIdAndDelete(req.params.id); if (!content) return fail(res, 404, "Content not found"); res.json({ success: true }); } catch (error) { next(error); }
});

router.get("/integrations", (_req, res) => res.json({ success: true, integrations: {
  email: { configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER), provider: process.env.SMTP_HOST ? "SMTP" : null },
  whatsapp: { configured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN) },
  instagram: { configured: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN) },
  thikana: { configured: true, source: "shared Savitri Livings marketplace" },
} }));

module.exports = router;
