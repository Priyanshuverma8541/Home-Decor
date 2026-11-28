const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const { protect, adminOnly } = require("../../middleware/auth");
const { upload, uploadedFileUrl } = require("../../config/cloudinary");
const Project = require("./models/Project");
const Order = require("./models/Order");
const Lead = require("./models/Lead");
const Settings = require("./models/Settings");

const router = express.Router();
const TIERS = { codeOnly: "Code Only", codeAndCall: "Code + 1hr Call", mentorship: "Full Mentorship", customBuild: "Custom Build" };
const text = (value, max = 2000) => typeof value === "string" ? value.trim().slice(0, max) : "";
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const slugify = (value) => text(value, 140).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `project-${Date.now().toString(36)}`;
const getSettings = async () => (await Settings.findOneAndUpdate({ key: "buildhub" }, { $setOnInsert: { key: "buildhub" } }, { new: true, upsert: true, setDefaultsOnInsert: true }));
const sendMail = async ({ to, subject, html }) => {
  if (!to || !process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_PASS === "YOUR_APP_PASSWORD_HERE") return;
  try {
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT) || 587, secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await transporter.sendMail({ from: `"${process.env.SMTP_FROM_NAME || "Savitri Livings · BuildHub"}" <${process.env.SMTP_USER}>`, to, subject, html });
  } catch (error) { console.error("BuildHub email delivery failed:", error.message); }
};
const safePublicSettings = (settings) => ({
  brandName: settings.brandName, tagline: settings.tagline, heroHeadline: settings.heroHeadline, heroSubtext: settings.heroSubtext,
  whatsappNumber: settings.whatsappNumber, instagramHandle: settings.instagramHandle, supportEmail: settings.supportEmail, supportPhone: settings.supportPhone, city: settings.city,
  upiId: settings.upiId, upiName: settings.upiName, qrImageUrl: settings.qrImageUrl, founderName: settings.founderName, founderRole: settings.founderRole, founderBio: settings.founderBio,
  founderPhotoUrl: settings.founderPhotoUrl, serviceTiers: settings.serviceTiers, showAnnouncement: settings.showAnnouncement, announcementText: settings.announcementText,
  maintenanceMode: settings.maintenanceMode, seoTitle: settings.seoTitle, seoDescription: settings.seoDescription, ogImageUrl: settings.ogImageUrl,
});

// Public catalogue and business information.
router.get("/settings", async (_req, res, next) => { try { res.json({ success: true, settings: safePublicSettings(await getSettings()) }); } catch (error) { next(error); } });
router.post("/settings/validate-coupon", async (req, res, next) => {
  try {
    const amount = Math.max(0, Number(req.body?.amount) || 0); const code = text(req.body?.code, 40).toUpperCase(); const settings = await getSettings();
    const coupon = settings.activeCoupons.find((entry) => entry.isActive && entry.code?.toUpperCase() === code);
    if (!coupon || (coupon.validUntil && coupon.validUntil < new Date()) || (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)) return res.json({ valid: false, message: "This coupon is invalid or expired." });
    const discount = Math.min(amount, coupon.discountFlat || Math.round(amount * (coupon.discountPct || 0) / 100));
    res.json({ valid: true, discount, code: coupon.code });
  } catch (error) { next(error); }
});
router.get("/projects", async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (["sellable", "portfolio"].includes(req.query.type)) filter.type = req.query.type;
    if (["mern", "design", "fullstack", "mobile", "ai", "other"].includes(req.query.category)) filter.category = req.query.category;
    if (req.query.featured === "true") filter.isFeatured = true;
    if (req.query.search) filter.$or = ["title", "shortDesc", "techStack"].map((field) => ({ [field]: { $regex: escapeRegex(text(req.query.search, 80)), $options: "i" } }));
    const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 30));
    const projects = await Project.find(filter).sort({ order: 1, createdAt: -1 }).limit(limit);
    res.json({ success: true, projects });
  } catch (error) { next(error); }
});
router.get("/projects/:slug", async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: text(req.params.slug, 80), isActive: true });
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });
    await Project.updateOne({ _id: project._id }, { $inc: { views: 1 } });
    res.json({ success: true, project });
  } catch (error) { next(error); }
});

// Student checkout and enquiry flows.
router.post("/orders", async (req, res, next) => {
  try {
    const { projectId, tier } = req.body || {};
    const fullName = text(req.body?.fullName, 120); const email = text(req.body?.email, 254).toLowerCase(); const phone = text(req.body?.phone, 30);
    if (!mongoose.isValidObjectId(projectId) || !TIERS[tier] || !fullName || !/^\S+@\S+\.\S+$/.test(email) || !phone) return res.status(400).json({ success: false, message: "Enter your name, valid email, phone, and a project tier." });
    const project = await Project.findOne({ _id: projectId, type: "sellable", isActive: true });
    if (!project) return res.status(404).json({ success: false, message: "This project is not available for purchase." });
    let amount = Number(project.pricing?.[tier]) || 0; if (amount <= 0) return res.status(400).json({ success: false, message: "This project tier is not available." });
    const settings = await getSettings(); if (settings.maintenanceMode) return res.status(503).json({ success: false, message: "Student checkout is temporarily paused. Please send an enquiry instead." }); const couponCode = text(req.body?.couponCode, 40).toUpperCase(); let discountAmount = 0; let couponToIncrement = null;
    if (couponCode) {
      const coupon = settings.activeCoupons.find((entry) => entry.isActive && entry.code?.toUpperCase() === couponCode && (!entry.validUntil || entry.validUntil > new Date()) && (!entry.usageLimit || entry.usedCount < entry.usageLimit));
      if (coupon) { discountAmount = Math.min(amount, coupon.discountFlat || Math.round(amount * (coupon.discountPct || 0) / 100)); amount -= discountAmount; couponToIncrement = coupon._id; }
    }
    const order = await Order.create({ orderNumber: `SLBH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, fullName, email, phone, college: text(req.body?.college, 160), notes: text(req.body?.notes, 2000), projectId: project._id, projectName: project.title, tier, tierLabel: TIERS[tier], amount, couponCode: discountAmount ? couponCode : "", discountAmount });
    if (couponToIncrement) await Settings.updateOne({ _id: settings._id, "activeCoupons._id": couponToIncrement }, { $inc: { "activeCoupons.$.usedCount": 1 } });
    await Lead.create({ audience: "student", fullName, email, phone, college: order.college, projectType: project.title, source: "website", message: `Requested ${project.title} (${TIERS[tier]})` }).catch((error) => console.error("BuildHub CRM order sync failed:", error.message));
    const orderInfo = `<p>Order <b>${escapeHtml(order.orderNumber)}</b> for ${escapeHtml(project.title)} has been created. We will confirm your payment and follow up with delivery details.</p>`;
    sendMail({ to: email, subject: `BuildHub order ${order.orderNumber} received`, html: `<div style="font-family:Arial;color:#453320"><h2>Thank you, ${escapeHtml(fullName)}</h2>${orderInfo}</div>` });
    sendMail({ to: settings.supportEmail || process.env.SUPPORT_EMAIL, subject: `New BuildHub order ${order.orderNumber}`, html: `<div style="font-family:Arial"><h2>New order ${escapeHtml(order.orderNumber)}</h2><p>${escapeHtml(fullName)} · ${escapeHtml(email)} · ${escapeHtml(project.title)} · ₹${amount}</p></div>` });
    res.status(201).json({ success: true, order: { _id: order._id, orderNumber: order.orderNumber, projectName: order.projectName, tier, tierLabel: order.tierLabel, amount, fullName, email, phone }, payment: { upiId: settings.upiId || process.env.UPI_ID || "", upiName: settings.upiName || process.env.UPI_NAME || "", qrImageUrl: settings.qrImageUrl, whatsappNumber: settings.whatsappNumber || process.env.WHATSAPP_NUMBER || "" } });
  } catch (error) { next(error); }
});
router.get("/orders/lookup/:orderNumber", async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: text(req.params.orderNumber, 40) }).select("orderNumber projectName tierLabel amount paymentStatus deliveryStatus createdAt");
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    res.json({ success: true, order });
  } catch (error) { next(error); }
});
router.post("/leads", async (req, res, next) => {
  try {
    const fullName = text(req.body?.fullName, 120); const email = text(req.body?.email, 254).toLowerCase();
    if (!fullName || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: "Enter your name and a valid email." });
    const audience = req.body?.audience === "student" ? "student" : "business";
    const lead = await Lead.create({ audience, fullName, email, phone: text(req.body?.phone, 30), company: text(req.body?.company, 160), college: text(req.body?.college, 160), city: text(req.body?.city, 120), projectType: text(req.body?.projectType, 120), budget: text(req.body?.budget, 80), timeline: text(req.body?.timeline, 80), message: text(req.body?.message, 4000), source: "website" });
    const settings = await getSettings();
    sendMail({ to: email, subject: "We received your BuildHub enquiry", html: `<div style="font-family:Arial;color:#453320"><h2>Thanks, ${escapeHtml(fullName)}</h2><p>Your enquiry is with the Savitri Livings team. We will follow up soon.</p></div>` });
    sendMail({ to: settings.supportEmail || process.env.SUPPORT_EMAIL, subject: `New BuildHub enquiry from ${fullName}`, html: `<div style="font-family:Arial"><h2>New ${audience} enquiry</h2><p>${escapeHtml(fullName)} · ${escapeHtml(email)} · ${escapeHtml(lead.phone)} · ${escapeHtml(lead.message)}</p></div>` });
    res.status(201).json({ success: true, lead: { _id: lead._id }, message: "Thanks. Your enquiry has been received." });
  } catch (error) { next(error); }
});

// All management endpoints use Savitri Livings' existing administrator account/session.
router.use("/admin", protect, adminOnly);
router.get("/admin/overview", async (_req, res, next) => {
  try {
    const [projectCount, activeProjects, orders, leads, sales] = await Promise.all([
      Project.countDocuments(), Project.countDocuments({ isActive: true }), Order.countDocuments(), Lead.countDocuments(),
      Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, revenue: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    ]);
    const [recentOrders, recentLeads] = await Promise.all([Order.find().sort({ createdAt: -1 }).limit(6), Lead.find().sort({ createdAt: -1 }).limit(6)]);
    res.json({ success: true, stats: { projectCount, activeProjects, orders, leads, paidOrders: sales[0]?.count || 0, revenue: sales[0]?.revenue || 0 }, recentOrders, recentLeads });
  } catch (error) { next(error); }
});
router.get("/admin/projects", async (req, res, next) => {
  try { const filter = req.query.type && ["sellable", "portfolio"].includes(req.query.type) ? { type: req.query.type } : {}; res.json({ success: true, projects: await Project.find(filter).sort({ type: 1, order: 1, createdAt: -1 }) }); } catch (error) { next(error); }
});
const projectUpload = upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "images", maxCount: 5 }]);
const parseArray = (value) => { if (Array.isArray(value)) return value.map((item) => text(item, 500)).filter(Boolean); try { const result = JSON.parse(value || "[]"); return Array.isArray(result) ? result.map((item) => text(item, 500)).filter(Boolean) : []; } catch { return text(value).split(/[,\n]/).map((item) => text(item, 300)).filter(Boolean); } };
const parsePricing = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};
  try { const parsed = JSON.parse(value); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}; } catch { return {}; }
};
const projectFields = (body) => {
  const pricing = parsePricing(body.pricing);
  return ({
  type: body.type === "portfolio" ? "portfolio" : "sellable", title: text(body.title, 140), shortDesc: text(body.shortDesc, 500), longDesc: text(body.longDesc, 12000),
  category: ["mern", "design", "fullstack", "mobile", "ai", "other"].includes(body.category) ? body.category : "other",
  images: parseArray(body.images), demoVideoUrl: text(body.demoVideoUrl, 1000), techStack: parseArray(body.techStack), features: parseArray(body.features), liveDemoUrl: text(body.liveDemoUrl, 1000), githubUrl: text(body.githubUrl, 1000),
  pricing: Object.fromEntries(Object.keys(TIERS).map((key) => [key, Math.max(0, Number(pricing[key]) || 0)])),
  privateGithubUrl: text(body.privateGithubUrl, 1000), docsPdfUrl: text(body.docsPdfUrl, 1000), clientName: text(body.clientName, 160), industry: text(body.industry, 120), testimonial: text(body.testimonial, 1200), builtIn: text(body.builtIn, 120),
  isFeatured: body.isFeatured === true || body.isFeatured === "true", isActive: body.isActive !== false && body.isActive !== "false", order: Math.max(0, Number(body.order) || 0),
  });
};
router.post("/admin/projects", projectUpload, async (req, res, next) => {
  try {
    const data = projectFields(req.body); if (!data.title || !data.shortDesc) return res.status(400).json({ success: false, message: "Project title and summary are required." });
    const baseSlug = slugify(req.body.slug || data.title); let slug = baseSlug; let n = 1; while (await Project.exists({ slug })) slug = `${baseSlug}-${++n}`;
    data.slug = slug; data.thumbnail = req.files?.thumbnail?.[0] ? uploadedFileUrl(req.files.thumbnail[0]) : text(req.body.thumbnail, 1000); if (req.files?.images?.length) data.images.push(...req.files.images.map(uploadedFileUrl));
    const project = await Project.create(data); res.status(201).json({ success: true, project });
  } catch (error) { next(error); }
});
router.put("/admin/projects/:id", projectUpload, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id); if (!project) return res.status(404).json({ success: false, message: "Project not found." });
    const data = projectFields(req.body); Object.assign(project, data); if (req.body.slug) project.slug = slugify(req.body.slug);
    if (req.files?.thumbnail?.[0]) project.thumbnail = uploadedFileUrl(req.files.thumbnail[0]); else if (req.body.thumbnail !== undefined) project.thumbnail = text(req.body.thumbnail, 1000);
    if (req.files?.images?.length) project.images.push(...req.files.images.map(uploadedFileUrl));
    await project.save(); res.json({ success: true, project });
  } catch (error) { next(error); }
});
router.patch("/admin/projects/:id/toggle", async (req, res, next) => { try { const project = await Project.findById(req.params.id); if (!project) return res.status(404).json({ success: false, message: "Project not found." }); project.isActive = !project.isActive; await project.save(); res.json({ success: true, project }); } catch (error) { next(error); } });
router.delete("/admin/projects/:id", async (req, res, next) => { try { const project = await Project.findById(req.params.id); if (!project) return res.status(404).json({ success: false, message: "Project not found." }); const hasOrders = await Order.exists({ projectId: project._id }); if (hasOrders) { project.isActive = false; await project.save(); return res.json({ success: true, archived: true }); } await project.deleteOne(); res.json({ success: true }); } catch (error) { next(error); } });

router.get("/admin/orders", async (req, res, next) => {
  try {
    const filter = {}; if (["pending", "paid", "refunded", "cancelled"].includes(req.query.paymentStatus)) filter.paymentStatus = req.query.paymentStatus;
    if (["pending", "delivered", "needs_action"].includes(req.query.deliveryStatus)) filter.deliveryStatus = req.query.deliveryStatus;
    if (req.query.search) { const term = escapeRegex(text(req.query.search, 80)); filter.$or = ["orderNumber", "fullName", "email"].map((key) => ({ [key]: { $regex: term, $options: "i" } })); }
    const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const [orders, total] = await Promise.all([Order.find(filter).populate("projectId", "title slug").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Order.countDocuments(filter)]);
    res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
});
router.patch("/admin/orders/:id", async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("projectId", "privateGithubUrl docsPdfUrl"); if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    const beforeDelivery = order.deliveryStatus;
    if (["pending", "paid", "refunded", "cancelled"].includes(req.body.paymentStatus)) { order.paymentStatus = req.body.paymentStatus; if (req.body.paymentStatus === "paid" && !order.paidAt) order.paidAt = new Date(); }
    if (["pending", "delivered", "needs_action"].includes(req.body.deliveryStatus)) order.deliveryStatus = req.body.deliveryStatus;
    for (const key of ["paymentNotes", "adminNotes", "zoomBookingLink", "customDocsLink"]) if (req.body[key] !== undefined) order[key] = text(req.body[key], key === "adminNotes" ? 3000 : 1000);
    if (typeof req.body.githubInviteSent === "boolean") order.githubInviteSent = req.body.githubInviteSent;
    if (beforeDelivery !== "delivered" && order.deliveryStatus === "delivered") { order.deliveredAt = new Date(); await Project.updateOne({ _id: order.projectId?._id || order.projectId }, { $inc: { purchases: 1 } }); const project = order.projectId; const github = order.tier === "customBuild" ? "" : (project?.privateGithubUrl || ""); const docs = order.customDocsLink || project?.docsPdfUrl || ""; sendMail({ to: order.email, subject: `BuildHub delivery · ${order.orderNumber}`, html: `<div style="font-family:Arial;color:#453320"><h2>Your ${escapeHtml(order.projectName)} project is ready</h2><p>Order ${escapeHtml(order.orderNumber)} · ${escapeHtml(order.tierLabel)}</p>${github ? `<p><a href="${escapeHtml(github)}">Open source code</a></p>` : ""}${docs ? `<p><a href="${escapeHtml(docs)}">Open documentation</a></p>` : ""}${order.zoomBookingLink ? `<p><a href="${escapeHtml(order.zoomBookingLink)}">Book your guidance call</a></p>` : ""}<p>Questions? WhatsApp +91 ${escapeHtml((await getSettings()).supportPhone)}.</p></div>` }); }
    await order.save(); res.json({ success: true, order });
  } catch (error) { next(error); }
});
router.get("/admin/leads", async (req, res, next) => {
  try {
    const filter = {}; if (["student", "business"].includes(req.query.audience)) filter.audience = req.query.audience; if (["new", "contacted", "qualified", "won", "lost"].includes(req.query.status)) filter.status = req.query.status;
    if (req.query.search) { const term = escapeRegex(text(req.query.search, 80)); filter.$or = ["fullName", "email", "company", "college"].map((key) => ({ [key]: { $regex: term, $options: "i" } })); }
    const [leads, total, byStatus, byAudience] = await Promise.all([Lead.find(filter).sort({ createdAt: -1 }).limit(200), Lead.countDocuments(filter), Lead.aggregate([{ $match: filter }, { $group: { _id: "$status", count: { $sum: 1 } } }]), Lead.aggregate([{ $match: filter }, { $group: { _id: "$audience", count: { $sum: 1 } } }])]);
    res.json({ success: true, leads, total, byStatus, byAudience });
  } catch (error) { next(error); }
});
router.patch("/admin/leads/:id", async (req, res, next) => {
  try { const lead = await Lead.findById(req.params.id); if (!lead) return res.status(404).json({ success: false, message: "Lead not found." }); if (["new", "contacted", "qualified", "won", "lost"].includes(req.body.status)) lead.status = req.body.status; if (req.body.nextFollowUpAt !== undefined) lead.nextFollowUpAt = req.body.nextFollowUpAt || null; if (Number.isFinite(Number(req.body.convertedAmount))) lead.convertedAmount = Math.max(0, Number(req.body.convertedAmount)); if (req.body.addNote) lead.notes.push({ text: text(req.body.addNote, 2000) }); await lead.save(); res.json({ success: true, lead }); } catch (error) { next(error); }
});
router.delete("/admin/leads/:id", async (req, res, next) => { try { await Lead.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch (error) { next(error); } });

router.get("/admin/settings", async (_req, res, next) => { try { res.json({ success: true, settings: await getSettings() }); } catch (error) { next(error); } });
router.put("/admin/settings", async (req, res, next) => {
  try {
    const settings = await getSettings();
    const fields = ["brandName", "tagline", "heroHeadline", "heroSubtext", "whatsappNumber", "instagramHandle", "supportEmail", "supportPhone", "city", "upiId", "upiName", "qrImageUrl", "founderName", "founderRole", "founderBio", "founderPhotoUrl", "serviceTiers", "activeCoupons", "showAnnouncement", "announcementText", "maintenanceMode", "seoTitle", "seoDescription", "ogImageUrl"];
    for (const key of fields) if (req.body[key] !== undefined) settings[key] = req.body[key];
    await settings.save(); res.json({ success: true, settings });
  } catch (error) { next(error); }
});
router.post("/admin/settings/upload-qr", upload.single("qr"), async (req, res, next) => { try { if (!req.file) return res.status(400).json({ success: false, message: "Choose an image first." }); const settings = await getSettings(); settings.qrImageUrl = uploadedFileUrl(req.file); await settings.save(); res.json({ success: true, qrImageUrl: settings.qrImageUrl }); } catch (error) { next(error); } });
router.post("/admin/settings/upload-photo", upload.single("photo"), async (req, res, next) => { try { if (!req.file) return res.status(400).json({ success: false, message: "Choose an image first." }); const settings = await getSettings(); settings.founderPhotoUrl = uploadedFileUrl(req.file); await settings.save(); res.json({ success: true, founderPhotoUrl: settings.founderPhotoUrl }); } catch (error) { next(error); } });

router.use((error, _req, res, _next) => { console.error("BuildHub API:", error.message); res.status(error.status || 500).json({ success: false, message: error.message || "BuildHub request failed." }); });
module.exports = router;
