const router = require("express").Router();
const EcosystemLink = require("../models/EcosystemLink");
const { protect, adminOnly } = require("../middleware/auth");

const defaults = [
  { key: "business-partnerships", title: "Business Partnerships", description: "Connect brands, sellers, creators and potential business partners.", position: 1 },
  { key: "sl-business", title: "SL Business", description: "Practical learning for students, startups and entrepreneurs building real business skills.", position: 2 },
  { key: "startup-support", title: "Startup Support", description: "Resources, opportunities and connections that help new businesses begin and grow.", position: 3 },
  { key: "future-integrations", title: "Future Integrations", description: "A reserved space for projects, tools and partner platforms that join the Savitri Livings ecosystem.", position: 4 },
];
const fail = (res, status, message) => res.status(status).json({ success: false, message });

router.get("/", async (_req, res, next) => {
  try {
    const saved = await EcosystemLink.find({ isActive: true }).sort({ position: 1, title: 1 });
    res.json({ success: true, links: saved.length ? saved : defaults.map((item) => ({ ...item, url: "", isActive: true })) });
  } catch (error) { next(error); }
});
router.get("/admin", protect, adminOnly, async (_req, res, next) => {
  try { res.json({ success: true, links: await EcosystemLink.find().sort({ position: 1, title: 1 }) }); } catch (error) { next(error); }
});
router.post("/admin", protect, adminOnly, async (req, res, next) => {
  try {
    const { key, title, description, url = "", isActive = true, position = 0 } = req.body;
    if (!key || !title || !description) return fail(res, 400, "Key, title and description are required");
    const link = await EcosystemLink.findOneAndUpdate({ key }, { $set: { title, description, url, isActive, position } }, { new: true, upsert: true, runValidators: true });
    res.status(201).json({ success: true, link });
  } catch (error) { next(error); }
});
router.patch("/admin/:id", protect, adminOnly, async (req, res, next) => {
  try { const link = await EcosystemLink.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }); if (!link) return fail(res, 404, "Ecosystem link not found"); res.json({ success: true, link }); } catch (error) { next(error); }
});

module.exports = router;
