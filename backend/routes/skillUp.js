const router = require("express").Router();
const crypto = require("crypto");
const sanitizeHtml = require("sanitize-html");
const { protect, adminOnly } = require("../middleware/auth");
const SkillUpContent = require("../models/SkillUpContent");

const types = ["blog", "learning", "ai_builder", "agent", "productivity"];
const cleanBody = (value) => sanitizeHtml(String(value || "").slice(0, 30000), { allowedTags: ["p", "br", "h2", "h3", "ul", "ol", "li", "strong", "em", "blockquote", "a", "code", "pre"], allowedAttributes: { a: ["href", "target", "rel"] }, allowedSchemes: ["http", "https", "mailto"] });
const cleanHref = (value) => {
  if (!value) return "";
  const href = String(value).trim();
  if (href.startsWith("/") && !href.startsWith("//")) return href.slice(0, 500);
  const url = new URL(href);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP or HTTPS links are allowed.");
  return url.toString();
};
const makeSlug = (title) => String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160) + "-" + crypto.randomBytes(3).toString("hex");

router.get("/content", async (req, res, next) => {
  try {
    const query = { status: "published" };
    if (types.includes(req.query.type)) query.type = req.query.type;
    const content = await SkillUpContent.find(query).populate("authorId", "fullName").sort({ publishedAt: -1, createdAt: -1 }).limit(100).lean();
    res.json({ success: true, content });
  } catch (error) { next(error); }
});

router.post("/blogs", protect, async (req, res, next) => {
  try {
    const title = String(req.body?.title || "").trim().slice(0, 180);
    const excerpt = String(req.body?.excerpt || "").trim().slice(0, 500);
    const body = cleanBody(req.body?.body);
    if (title.length < 5 || excerpt.length < 20 || body.replace(/<[^>]+>/g, "").trim().length < 100) return res.status(400).json({ success: false, message: "Add a title, a 20-character summary and at least 100 characters of article text." });
    const post = await SkillUpContent.create({ type: "blog", title, slug: makeSlug(title), excerpt, body, status: "pending", authorId: req.user._id, authorName: req.user.fullName });
    res.status(201).json({ success: true, post, message: "Your blog has been sent to the SkillUp team for review." });
  } catch (error) { next(error); }
});

router.get("/mine", protect, async (req, res, next) => {
  try { const posts = await SkillUpContent.find({ authorId: req.user._id, type: "blog" }).sort({ updatedAt: -1 }).limit(100).lean(); res.json({ success: true, posts }); }
  catch (error) { next(error); }
});

router.get("/admin/content", protect, adminOnly, async (_req, res, next) => {
  try { const content = await SkillUpContent.find().populate("authorId", "fullName email").sort({ status: 1, updatedAt: -1 }).limit(500).lean(); res.json({ success: true, content }); }
  catch (error) { next(error); }
});

router.post("/admin/content", protect, adminOnly, async (req, res, next) => {
  try {
    const { type, title, excerpt, href, category, tags, status } = req.body || {};
    if (!types.includes(type) || !String(title || "").trim()) return res.status(400).json({ success: false, message: "Choose a content type and add a title." });
    const safeHref = cleanHref(href);
    const post = await SkillUpContent.create({ type, title: String(title).trim().slice(0, 180), slug: makeSlug(title), excerpt: String(excerpt || "").trim().slice(0, 500), body: cleanBody(req.body.body), href: safeHref, category: String(category || "").slice(0, 100), tags: Array.isArray(tags) ? tags.slice(0, 20) : [], status: status === "published" ? "published" : "draft", authorId: req.user._id, authorName: req.user.fullName, publishedAt: status === "published" ? new Date() : undefined });
    res.status(201).json({ success: true, post });
  } catch (error) { next(error); }
});

router.patch("/admin/content/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const allowed = ["draft", "pending", "published", "rejected", "archived"];
    const update = {};
    if (allowed.includes(req.body?.status)) { update.status = req.body.status; update.publishedAt = req.body.status === "published" ? new Date() : undefined; }
    if (Object.hasOwn(req.body || {}, "moderationNote")) update.moderationNote = String(req.body.moderationNote || "").slice(0, 1000);
    if (Object.hasOwn(req.body || {}, "title")) update.title = String(req.body.title || "").trim().slice(0, 180);
    if (Object.hasOwn(req.body || {}, "excerpt")) update.excerpt = String(req.body.excerpt || "").slice(0, 500);
    if (Object.hasOwn(req.body || {}, "body")) update.body = cleanBody(req.body.body);
    const content = await SkillUpContent.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!content) return res.status(404).json({ success: false, message: "SkillUp content not found" });
    res.json({ success: true, content });
  } catch (error) { next(error); }
});

router.post("/admin/seed-starter", protect, adminOnly, async (req, res, next) => {
  try {
    const starter = [
      { type: "learning", slug: "starter-learning", title: "Learn by building", excerpt: "Small, practical learning guides designed to help you turn new ideas into useful work.", category: "Learning" },
      { type: "ai_builder", slug: "starter-ai-builder", title: "AI Builder", excerpt: "Explore AI-assisted creation and prototype tools. Check each connected tool for its current capabilities.", href: "/livings-ai", category: "AI Builder" },
      { type: "agent", slug: "starter-agents", title: "Agents and workflows", excerpt: "Guides to task-focused AI agents, workflow design, and responsible human review.", category: "Agents" },
      { type: "productivity", slug: "starter-productivity", title: "Productivity toolkit", excerpt: "A curated route to calculators, checklists, portfolio tools and everyday workflows.", href: "/tools", category: "Productivity" },
    ];
    const ops = starter.map((item) => ({ updateOne: { filter: { slug: item.slug }, update: { $setOnInsert: { ...item, status: "published", publishedAt: new Date(), authorId: req.user._id, authorName: "Savitri Livings" } }, upsert: true } }));
    const result = await SkillUpContent.bulkWrite(ops, { ordered: false });
    res.json({ success: true, imported: result.upsertedCount, alreadyPresent: result.matchedCount });
  } catch (error) { next(error); }
});

module.exports = router;
