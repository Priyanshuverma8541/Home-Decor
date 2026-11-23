const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/auth");
const EarnOpportunity = require("../models/EarnOpportunity");
const cleanHref = (value) => {
  if (!value) return "";
  const href = String(value).trim();
  if (href.startsWith("/") && !href.startsWith("//")) return href.slice(0, 500);
  const url = new URL(href);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP or HTTPS links are allowed.");
  return url.toString();
};

router.get("/opportunities", async (_req, res, next) => {
  try {
    const now = new Date();
    const opportunities = await EarnOpportunity.find({ status: "published", $and: [{ $or: [{ startsAt: null }, { startsAt: { $lte: now } }] }, { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] }] }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, opportunities });
  } catch (error) { next(error); }
});
router.get("/admin/opportunities", protect, adminOnly, async (_req, res, next) => {
  try { const opportunities = await EarnOpportunity.find().sort({ updatedAt: -1 }).limit(500).lean(); res.json({ success: true, opportunities }); }
  catch (error) { next(error); }
});
router.post("/admin/opportunities", protect, adminOnly, async (req, res, next) => {
  try {
    const data = req.body || {};
    if (!String(data.title || "").trim() || !String(data.description || "").trim()) return res.status(400).json({ success: false, message: "Title and description are required." });
    const safeHref = cleanHref(data.href);
    const opportunity = await EarnOpportunity.create({ title: String(data.title).trim().slice(0, 180), description: String(data.description).trim().slice(0, 3000), category: data.category, rewardLabel: String(data.rewardLabel || "").slice(0, 120), href: safeHref, status: data.status === "published" ? "published" : "draft", startsAt: data.startsAt || undefined, endsAt: data.endsAt || undefined, createdBy: req.user._id, updatedBy: req.user._id });
    res.status(201).json({ success: true, opportunity });
  } catch (error) { next(error); }
});
router.patch("/admin/opportunities/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const data = req.body || {};
    const update = {};
    for (const key of ["title", "description", "category", "rewardLabel", "status", "startsAt", "endsAt"]) if (Object.hasOwn(data, key)) update[key] = data[key];
    if (Object.hasOwn(data, "href")) update.href = cleanHref(data.href);
    update.updatedBy = req.user._id;
    const opportunity = await EarnOpportunity.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!opportunity) return res.status(404).json({ success: false, message: "Opportunity not found" });
    res.json({ success: true, opportunity });
  } catch (error) { next(error); }
});
module.exports = router;
