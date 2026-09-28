const sanitizeHtml = require("sanitize-html");
const jwt = require("jsonwebtoken");
const Page = require("../models/Page");
const PageVersion = require("../models/PageVersion");
const PageEvent = require("../models/PageEvent");
const PageSubmission = require("../models/PageSubmission");
const PageTemplate = require("../models/PageTemplate");
const Product = require("../models/Product");
const Lead = require("../models/Lead");

const PAGE_FIELDS = ["name", "slug", "description", "sourceType", "htmlContent", "sections", "settings", "customizations", "seo", "schedule", "campaignName"];
const EVENT_TYPES = new Set(["page_view", "cta_click", "product_click", "form_view", "form_submit", "add_to_cart"]);
const TEXT_LIMIT = 2000;

const sanitizePageHtml = (html) => sanitizeHtml(html, {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "img", "picture", "source", "figure", "figcaption", "section", "main", "header", "footer", "video", "track", "details", "summary",
  ]),
  allowedAttributes: {
    "*": ["class", "id", "style", "title", "aria-label", "role"],
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading"],
    source: ["src", "srcset", "type", "media"],
    video: ["src", "poster", "controls", "width", "height", "muted", "loop", "playsinline"],
    track: ["src", "kind", "srclang", "label"],
  },
  allowedStyles: {
    "*": {
      color: [/^(#[0-9a-f]{3,8}|[a-z]{3,20}|rgba?\([\d.,% ]+\))$/i],
      "background-color": [/^(#[0-9a-f]{3,8}|[a-z]{3,20}|rgba?\([\d.,% ]+\))$/i],
      "font-family": [/^[\w ,"'-]{1,80}$/],
      "font-size": [/^\d{1,3}(\.\d+)?(px|rem|em|%)$/],
      "font-weight": [/^(normal|bold|[1-9]00)$/],
      "text-align": [/^(left|right|center|justify)$/],
      "margin": [/^[\d. ]+(px|rem|em|%)?$/],
      "margin-top": [/^[\d.]+(px|rem|em|%)$/],
      "margin-bottom": [/^[\d.]+(px|rem|em|%)$/],
      padding: [/^[\d. ]+(px|rem|em|%)?$/],
      "padding-top": [/^[\d.]+(px|rem|em|%)$/],
      "padding-bottom": [/^[\d.]+(px|rem|em|%)$/],
      width: [/^\d{1,4}(\.\d+)?(px|rem|em|%)$/],
      "max-width": [/^\d{1,4}(\.\d+)?(px|rem|em|%)$/],
      height: [/^\d{1,4}(\.\d+)?(px|rem|em|%)$/],
      display: [/^(block|inline|inline-block|flex|grid|none)$/],
      "border-radius": [/^\d{1,3}(\.\d+)?(px|rem|em|%)$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
});

const allowedSettings = (settings = {}) => ({
  showNavbar: settings.showNavbar !== false,
  showFooter: settings.showFooter !== false,
  fullWidth: settings.fullWidth === true,
  background: safeColor(settings.background, "#fffaf3"),
  primaryColor: safeColor(settings.primaryColor, "#9d6a27"),
  secondaryColor: safeColor(settings.secondaryColor, "#1a3c34"),
  fontFamily: String(settings.fontFamily || "DM Sans").replace(/[^\w ,'-]/g, "").slice(0, 80),
  productCategory: String(settings.productCategory || "").slice(0, 80),
  productId: /^[a-f\d]{24}$/i.test(String(settings.productId || "")) ? String(settings.productId) : "",
});

function safeColor(value, fallback) {
  const color = String(value || "").trim();
  return /^(#[0-9a-f]{3,8}|[a-z]{3,20})$/i.test(color) ? color : fallback;
}

const normalizeSlug = (value) => String(value || "").trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

const sanitizeSections = (sections) => Array.isArray(sections)
  ? sections.slice(0, 40).map((section, index) => {
    const item = section && typeof section === "object" ? section : {};
    const data = {};
    for (const [key, value] of Object.entries(item)) {
      if (["id", "type", "visible"].includes(key)) continue;
      if (typeof value === "string") data[key] = ["image", "videoUrl", "ctaUrl", "redirectUrl"].includes(key) ? safeSectionUrl(value) : value.slice(0, TEXT_LIMIT);
      else if (typeof value === "boolean" || typeof value === "number") data[key] = value;
      else if (key === "fields" && Array.isArray(value)) data[key] = value.slice(0, 20).map((field, fieldIndex) => ({
        name: String(field?.name || `field${fieldIndex + 1}`).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 60),
        label: String(field?.label || "").slice(0, 100),
        type: ["text", "email", "tel", "textarea", "select", "radio", "checkbox"].includes(field?.type) ? field.type : "text",
        required: field?.required === true,
        options: String(field?.options || "").slice(0, 1000),
      }));
      else if (key === "consents" && Array.isArray(value)) data[key] = value.slice(0, 10).map((consent, consentIndex) => ({
        type: String(consent?.type || `consent-${consentIndex + 1}`).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 80),
        label: String(consent?.label || "").slice(0, 240),
        required: consent?.required === true,
        version: String(consent?.version || "1").slice(0, 40),
      }));
      else if (Array.isArray(value)) data[key] = value.slice(0, 30).map((item) => String(item).slice(0, 120));
    }
    const type = ["hero", "heading", "text", "image", "imageText", "video", "button", "products", "productCarousel", "categoryGrid", "collection", "faq", "form", "countdown", "testimonials", "socialLinks", "whatsapp", "referral", "custom"].includes(item.type) ? item.type : "text";
    return { ...data, id: String(item.id || `section-${index + 1}`).slice(0, 80), type, visible: item.visible !== false };
  })
  : [];

function pickPageInput(body = {}) {
  const data = {};
  for (const field of PAGE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  if (data.name !== undefined) data.name = String(data.name).trim().slice(0, 120);
  if (data.slug !== undefined) data.slug = normalizeSlug(data.slug);
  if (data.description !== undefined) data.description = String(data.description).slice(0, 500);
  if (data.campaignName !== undefined) data.campaignName = String(data.campaignName).slice(0, 120);
  if (data.sourceType !== undefined && !["builder", "html"].includes(data.sourceType)) throw new Error("Choose a supported page type");
  if (data.htmlContent !== undefined) data.htmlContent = sanitizePageHtml(String(data.htmlContent).slice(0, 1_000_000));
  if (data.sections !== undefined) data.sections = sanitizeSections(data.sections);
  if (data.settings !== undefined) data.settings = allowedSettings(data.settings);
  if (data.customizations !== undefined) {
    const customizations = data.customizations || {};
    data.customizations = {
      title: String(customizations.title || "").slice(0, 160),
      description: String(customizations.description || "").slice(0, 500),
      ctaText: String(customizations.ctaText || "").slice(0, 80),
      ctaUrl: safeSectionUrl(customizations.ctaUrl),
      offerText: String(customizations.offerText || "").slice(0, 200),
      bannerImage: safeSectionUrl(customizations.bannerImage),
    };
  }
  if (data.seo !== undefined) {
    const seo = data.seo || {};
    data.seo = {
      title: String(seo.title || "").slice(0, 70),
      description: String(seo.description || "").slice(0, 180),
      keywords: String(seo.keywords || "").slice(0, 300),
      ogTitle: String(seo.ogTitle || "").slice(0, 70),
      ogDescription: String(seo.ogDescription || "").slice(0, 180),
      ogImage: safeHttpUrl(seo.ogImage),
      canonicalUrl: safeHttpUrl(seo.canonicalUrl),
      robots: String(seo.robots || "index,follow").replace(/[^a-z, -]/gi, "").slice(0, 80),
    };
  }
  if (data.schedule !== undefined) {
    const publishAt = data.schedule?.publishAt ? new Date(data.schedule.publishAt) : null;
    const expiresAt = data.schedule?.expiresAt ? new Date(data.schedule.expiresAt) : null;
    if (publishAt && Number.isNaN(publishAt.getTime())) throw new Error("Enter a valid publish date");
    if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new Error("Enter a valid expiry date");
    if (publishAt && expiresAt && expiresAt <= publishAt) throw new Error("Expiry must be after the scheduled publish time");
    data.schedule = { publishAt, expiresAt };
  }
  return data;
}

function safeHttpUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol) ? url.toString().slice(0, 1000) : "";
  } catch {
    return "";
  }
}

function safeSectionUrl(value) {
  const text = String(value || "").trim();
  if (text.startsWith("/") && !text.startsWith("//")) return text.slice(0, 1000);
  if (/^\+?[\d ()-]{7,24}$/.test(text)) return `https://wa.me/${text.replace(/\D/g, "")}`;
  return safeHttpUrl(text);
}

async function syncPageStatuses() {
  const now = new Date();
  await Promise.all([
    Page.updateMany({ status: "scheduled", "schedule.publishAt": { $lte: now } }, { $set: { status: "published" } }),
    Page.updateMany({ status: "published", "schedule.expiresAt": { $lte: now } }, { $set: { status: "expired" } }),
  ]);
}

function pageSnapshot(page) {
  const snapshot = page.toObject();
  delete snapshot._id;
  delete snapshot.__v;
  return snapshot;
}

async function savePreviousVersion(page, userId) {
  await PageVersion.create({ pageId: page._id, version: page.version, snapshot: pageSnapshot(page), createdBy: userId });
  page.version += 1;
}

exports.listAdmin = async (_req, res) => {
  try {
    await syncPageStatuses();
    const pages = await Page.find().sort({ updatedAt: -1 }).lean();
    const ids = pages.map((page) => page._id);
    const [events, submissions] = await Promise.all([
      PageEvent.aggregate([{ $match: { pageId: { $in: ids } } }, { $group: { _id: { pageId: "$pageId", type: "$type" }, count: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$metadata.revenue", 0] } } } }]),
      PageSubmission.aggregate([{ $match: { pageId: { $in: ids } } }, { $group: { _id: "$pageId", count: { $sum: 1 } } }]),
    ]);
    const eventMap = new Map();
    for (const event of events) {
      const key = String(event._id.pageId);
      eventMap.set(key, { ...(eventMap.get(key) || {}), [event._id.type]: event.count, ...(event._id.type === "purchase" ? { revenue: event.revenue } : {}) });
    }
    const submissionMap = new Map(submissions.map((item) => [String(item._id), item.count]));
    res.json({ success: true, pages: pages.map((page) => ({ ...page, analytics: { ...(eventMap.get(String(page._id)) || {}), form_submissions: submissionMap.get(String(page._id)) || 0 } })) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getAdmin = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    res.json({ success: true, page });
  } catch (error) { res.status(400).json({ success: false, message: "Invalid page id" }); }
};

exports.create = async (req, res) => {
  try {
    const data = pickPageInput(req.body);
    if (!data.name || !data.slug) return res.status(400).json({ success: false, message: "Page name and slug are required" });
    data.createdBy = req.user._id;
    data.updatedBy = req.user._id;
    const page = await Page.create(data);
    res.status(201).json({ success: true, page });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({ success: false, message: error.code === 11000 ? "That page URL is already in use" : error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    const data = pickPageInput(req.body);
    if (data.name !== undefined && !data.name) return res.status(400).json({ success: false, message: "Page name is required" });
    if (data.slug !== undefined && !data.slug) return res.status(400).json({ success: false, message: "Enter a valid page URL" });
    if (data.htmlContent && data.sourceType === undefined && page.sourceType !== "html") return res.status(400).json({ success: false, message: "Select HTML page mode before saving HTML" });
    await savePreviousVersion(page, req.user._id);
    Object.assign(page, data, { updatedBy: req.user._id });
    await page.save();
    res.json({ success: true, page });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({ success: false, message: error.code === 11000 ? "That page URL is already in use" : error.message });
  }
};

exports.publish = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    await savePreviousVersion(page, req.user._id);
    const now = new Date();
    page.status = page.schedule.publishAt && page.schedule.publishAt > now ? "scheduled" : "published";
    page.updatedBy = req.user._id;
    await page.save();
    res.json({ success: true, page });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.unpublish = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    await savePreviousVersion(page, req.user._id);
    page.status = "draft";
    page.updatedBy = req.user._id;
    await page.save();
    res.json({ success: true, page });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.archive = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    await savePreviousVersion(page, req.user._id);
    page.status = "archived";
    page.updatedBy = req.user._id;
    await page.save();
    res.json({ success: true, page });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.duplicate = async (req, res) => {
  try {
    const source = await Page.findById(req.params.id).lean();
    if (!source) return res.status(404).json({ success: false, message: "Page not found" });
    const copy = { ...source, _id: undefined, name: `${source.name} copy`, slug: `${source.slug}-copy`, status: "draft", version: 1, createdBy: req.user._id, updatedBy: req.user._id };
    delete copy.__v;
    let suffix = 2;
    while (await Page.exists({ slug: copy.slug })) copy.slug = `${source.slug}-copy-${suffix++}`;
    const page = await Page.create(copy);
    res.status(201).json({ success: true, page });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.uploadHtml = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, message: "Choose an HTML file to upload" });
  if (!/\.html?$/i.test(file.originalname) || !["text/html", "application/xhtml+xml", "application/octet-stream"].includes(file.mimetype)) {
    return res.status(400).json({ success: false, message: "Only .html or .htm files are accepted" });
  }
  const original = file.buffer.toString("utf8");
  if (!original.trim() || original.includes("\u0000")) return res.status(400).json({ success: false, message: "The uploaded file is empty or invalid" });
  const htmlContent = sanitizePageHtml(original);
  if (!htmlContent.trim()) return res.status(400).json({ success: false, message: "No safe page content remained after sanitization" });
  res.json({
    success: true,
    fileName: file.originalname,
    fileSize: file.size,
    htmlContent,
    sanitized: htmlContent !== original,
    message: htmlContent !== original ? "Unsafe scripts, embeds, and unsupported markup were removed." : "HTML passed the safety filter.",
  });
};

exports.getPublic = async (req, res) => {
  try {
    await syncPageStatuses();
    const slug = normalizeSlug(req.params.slug);
    const page = await Page.findOne({ slug, status: "published" }).lean();
    if (!page || (page.schedule?.expiresAt && page.schedule.expiresAt <= new Date())) return res.status(404).json({ success: false, message: "Page not found" });
    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    res.json({ success: true, page });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getPreview = async (req, res) => {
  try {
    const token = req.headers["x-page-preview"] || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "");
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    if (claims.purpose !== "page-preview" || !claims.pageId) return res.status(403).json({ success: false, message: "Preview access denied" });
    const page = await Page.findOne({ _id: claims.pageId, slug: normalizeSlug(req.params.slug), status: { $ne: "archived" } }).lean();
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    res.set("Cache-Control", "no-store");
    res.json({ success: true, page });
  } catch {
    res.status(401).json({ success: false, message: "A valid preview link is required" });
  }
};

exports.createPreviewToken = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id).select("_id slug");
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    const token = jwt.sign({ pageId: String(page._id), purpose: "page-preview" }, process.env.JWT_SECRET, { expiresIn: "5m" });
    res.json({ success: true, token, slug: page.slug, expiresIn: 300 });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.trackEvent = async (req, res) => {
  try {
    const page = await Page.findOne({ slug: normalizeSlug(req.params.slug), status: "published" }).select("_id schedule");
    if (!page || (page.schedule?.expiresAt && page.schedule.expiresAt <= new Date())) return res.status(404).json({ success: false, message: "Page not found" });
    const { type, sessionId, metadata } = req.body || {};
    if (!EVENT_TYPES.has(type)) return res.status(400).json({ success: false, message: "Unsupported event type" });
    await PageEvent.create({
      pageId: page._id,
      type,
      sessionId: String(sessionId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80),
      metadata: {
        sectionId: String(metadata?.sectionId || "").slice(0, 80),
        ...Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].map((key) => [key, String(metadata?.[key] || "").replace(/[^a-zA-Z0-9 _.-]/g, "").slice(0, 120)])),
      },
    });
    res.status(202).json({ success: true });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.submitForm = async (req, res) => {
  try {
    await syncPageStatuses();
    const page = await Page.findOne({ slug: normalizeSlug(req.params.slug), status: "published" }).lean();
    if (!page || (page.schedule?.expiresAt && page.schedule.expiresAt <= new Date())) return res.status(404).json({ success: false, message: "Page not found" });
    const form = (page.sections || []).find((section) => section.type === "form" && section.id === req.params.formId && section.visible !== false);
    if (!form) return res.status(404).json({ success: false, message: "Form not found" });
    const submittedValues = req.body?.values && typeof req.body.values === "object" ? req.body.values : {};
    const values = {};
    const configuredFields = Array.isArray(form.fields) ? form.fields.slice(0, 20) : [];
    for (const field of configuredFields) {
      const value = submittedValues[field.name];
      if (field.required && (value === undefined || value === null || value === "" || value === false)) return res.status(400).json({ success: false, message: `${field.label || field.name} is required` });
      if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return res.status(400).json({ success: false, message: `${field.label || field.name} must be a valid email` });
      if (["select", "radio"].includes(field.type) && value && !String(field.options || "").split("\n").map((option) => option.trim()).includes(String(value))) return res.status(400).json({ success: false, message: `${field.label || field.name} has an invalid selection` });
      if (value !== undefined) values[field.name] = typeof value === "boolean" ? value : String(value).trim().slice(0, 500);
    }
    const consents = Array.isArray(form.consents) ? form.consents.slice(0, 10) : [];
    const submittedConsents = req.body?.consents && typeof req.body.consents === "object" ? req.body.consents : {};
    for (const consent of consents) {
      if (consent.required && submittedConsents[consent.type] !== true) return res.status(400).json({ success: false, message: `${consent.label || "Consent"} is required` });
    }
    const consentRecords = consents.map((consent) => ({
      type: String(consent.type || "privacy").slice(0, 80),
      status: submittedConsents[consent.type] === true,
      version: String(consent.version || "1").slice(0, 40),
      recordedAt: new Date(),
    }));
    const email = values.email || "";
    const phone = values.phone || "";
    const name = values.name || "";
    let leadId = null;
    if (email || phone || name) {
      const lead = await Lead.create({ name, email, phone, source: "website", tags: ["dynamic-page", page.slug] });
      leadId = lead._id;
    }
    await PageSubmission.create({ pageId: page._id, formId: form.id, values, consents: consentRecords, leadId });
    await PageEvent.create({ pageId: page._id, type: "form_submit", sessionId: String(req.body?.sessionId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80), metadata: { sectionId: form.id } });
    res.status(201).json({ success: true, message: form.successMessage || "Thanks, your response has been received.", redirectUrl: safeSectionUrl(form.redirectUrl) });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.analytics = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id).select("name slug");
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    const [events, sessions, submissions, products] = await Promise.all([
      PageEvent.aggregate([{ $match: { pageId: page._id } }, { $group: { _id: "$type", count: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$metadata.revenue", 0] } } } }]),
      PageEvent.distinct("sessionId", { pageId: page._id, type: "page_view", sessionId: { $ne: "" } }),
      PageSubmission.countDocuments({ pageId: page._id }),
      Product.countDocuments({ isActive: true }),
    ]);
    const totals = Object.fromEntries(events.map(({ _id, count }) => [_id, count]));
    const revenue = events.find(({ _id }) => _id === "purchase")?.revenue || 0;
    res.json({ success: true, page, analytics: { ...totals, revenue, sessions: sessions.length, form_submissions: submissions, availableProducts: products } });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.versions = async (req, res) => {
  try {
    const versions = await PageVersion.find({ pageId: req.params.id }).select("version createdAt createdBy").sort({ version: -1 }).lean();
    res.json({ success: true, versions });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.restoreVersion = async (req, res) => {
  try {
    const [page, version] = await Promise.all([
      Page.findById(req.params.id),
      PageVersion.findOne({ pageId: req.params.id, version: Number(req.params.version) }),
    ]);
    if (!page || !version) return res.status(404).json({ success: false, message: "Page version not found" });
    await savePreviousVersion(page, req.user._id);
    const snapshot = version.snapshot;
    for (const field of PAGE_FIELDS) if (snapshot[field] !== undefined) page.set(field, snapshot[field]);
    page.status = "draft";
    page.updatedBy = req.user._id;
    await page.save();
    res.json({ success: true, page });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.listTemplates = async (_req, res) => {
  try {
    const templates = await PageTemplate.find().sort({ updatedAt: -1 }).lean();
    res.json({ success: true, templates });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createTemplate = async (req, res) => {
  try {
    const body = req.body || {};
    const template = await PageTemplate.create({
      name: String(body.name || "").trim().slice(0, 120),
      description: String(body.description || "").slice(0, 500),
      sourceType: ["builder", "html"].includes(body.sourceType) ? body.sourceType : "builder",
      htmlContent: sanitizePageHtml(String(body.htmlContent || "").slice(0, 1_000_000)),
      sections: sanitizeSections(body.sections),
      settings: allowedSettings(body.settings),
      customizations: pickPageInput({ customizations: body.customizations }).customizations,
      seo: pickPageInput({ seo: body.seo }).seo,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });
    if (!template.name) { await template.deleteOne(); return res.status(400).json({ success: false, message: "Template name is required" }); }
    res.status(201).json({ success: true, template });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.updateTemplate = async (req, res) => {
  try {
    const template = await PageTemplate.findById(req.params.templateId);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    const body = req.body || {};
    if (body.name !== undefined) template.name = String(body.name).trim().slice(0, 120);
    if (body.description !== undefined) template.description = String(body.description).slice(0, 500);
    if (body.sourceType !== undefined) template.sourceType = ["builder", "html"].includes(body.sourceType) ? body.sourceType : template.sourceType;
    if (body.htmlContent !== undefined) template.htmlContent = sanitizePageHtml(String(body.htmlContent).slice(0, 1_000_000));
    if (body.sections !== undefined) template.sections = sanitizeSections(body.sections);
    if (body.settings !== undefined) template.settings = allowedSettings(body.settings);
    if (body.customizations !== undefined) template.customizations = pickPageInput({ customizations: body.customizations }).customizations;
    if (body.seo !== undefined) template.seo = pickPageInput({ seo: body.seo }).seo;
    template.updatedBy = req.user._id;
    await template.save();
    res.json({ success: true, template });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await PageTemplate.findByIdAndDelete(req.params.templateId);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};