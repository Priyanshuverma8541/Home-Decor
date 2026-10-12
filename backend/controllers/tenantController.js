const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Tenant = require("../models/Tenant");
const ClientAdmin = require("../models/ClientAdmin");
const TenantAuthAttempt = require("../models/TenantAuthAttempt");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Lead = require("../models/Lead");

const modules = ["products", "categories", "orders", "enquiries", "homepage", "offers", "analytics", "whatsapp"];
const safeTenant = (tenant) => {
  const value = tenant.toObject ? tenant.toObject() : { ...tenant };
  delete value.setupCodeHash; delete value.setupCodeExpiresAt; delete value.__v;
  return value;
};
const validSlug = (slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(slug || ""));
const toBool = (value) => value === true || value === "true";
const cookie = (res, token) => { const production = process.env.NODE_ENV === "production"; res.setHeader("Set-Cookie", `maa_session=${encodeURIComponent(token)}; HttpOnly; ${production ? "Secure; " : ""}SameSite=Lax; Path=/api/tenants; Max-Age=${token ? 43200 : 0}`); };
const sessionToken = (admin) => jwt.sign({ kind: "tenant-admin", clientAdminId: String(admin._id), tenantId: String(admin.tenantId), sessionVersion: admin.sessionVersion }, process.env.JWT_SECRET, { expiresIn: "12h" });
const attemptKey = (req, slug, scope) => crypto.createHash("sha256").update(`${req.ip}|${slug}|${scope}|${Math.floor(Date.now() / 900000)}`).digest("hex");
async function allowedAttempt(req, res, slug, scope) {
  const key = attemptKey(req, slug, scope);
  const row = await TenantAuthAttempt.findOneAndUpdate({ key }, { $inc: { attempts: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + 16 * 60 * 1000) } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  if (row.attempts > 8) { res.status(429).json({ success: false, message: "Too many attempts. Please wait and try again." }); return false; }
  return true;
}
const publicProduct = (product) => ({ _id: product._id, name: product.name, description: product.description, category: product.category, subCategory: product.subCategory, images: product.images || [], price: product.price, comparePrice: product.comparePrice, stock: product.stock, variants: product.variants || [], sku: product.sku, isFeatured: product.isFeatured, material: product.material, careInstructions: product.careInstructions, tags: product.tags || [] });
const uploadedUrl = (file, req) => file.path?.startsWith("http") ? file.path : `${req.protocol}://${req.get("host")}${file.path || `/uploads/${file.filename}`}`;

// Central Savitri administrator endpoints
exports.list = async (_req, res) => { const tenants = await Tenant.find().sort({ createdAt: -1 }); res.json({ success: true, tenants: tenants.map(safeTenant) }); };
exports.create = async (req, res) => {
  try { const tenant = await Tenant.create({ name: String(req.body.name || "").trim(), slug: String(req.body.slug || "").trim().toLowerCase() }); res.status(201).json({ success: true, tenant: safeTenant(tenant) }); }
  catch (e) { res.status(400).json({ success: false, message: e.code === 11000 ? "That store slug is already in use" : e.message }); }
};
exports.adminGet = async (req, res) => { const tenant = await Tenant.findById(req.params.id); if (!tenant) return res.status(404).json({ success: false }); res.json({ success: true, tenant: safeTenant(tenant) }); };
exports.adminUpdate = async (req, res) => {
  try {
    const allowed = ["name", "status", "published", "domain", "adminDomain", "aliases", "sharedProductIds", "website", "modules"];
    const update = {};
    for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
    if (update.status === "suspended" || update.status === "draft") {
      const old = await Tenant.findById(req.params.id);
      if (old) { update.accessVersion = (old.accessVersion || 1) + 1; await ClientAdmin.updateMany({ tenantId: old._id }, { $inc: { sessionVersion: 1 } }); }
    }
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!tenant) return res.status(404).json({ success: false, message: "Store not found" });
    res.json({ success: true, tenant: safeTenant(tenant) });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};
exports.setSetupCode = async (req, res) => {
  const code = String(req.body.code || "");
  if (!/^\d{5,12}$/.test(code)) return res.status(400).json({ success: false, message: "Use a 5 to 12 digit setup code" });
  const tenant = await Tenant.findById(req.params.id).select("+setupCodeHash");
  if (!tenant) return res.status(404).json({ success: false, message: "Store not found" });
  tenant.setupCodeHash = await bcrypt.hash(code, 12); tenant.setupCodeExpiresAt = new Date(Date.now() + 7 * 86400000); tenant.accessVersion += 1;
  await tenant.save(); await ClientAdmin.updateMany({ tenantId: tenant._id }, { $inc: { sessionVersion: 1 } });
  res.json({ success: true, message: "One-time setup code saved. Share it securely; it expires in seven days." });
};
exports.revokeAccess = async (req, res) => {
  const tenant = await Tenant.findById(req.params.id).select("+setupCodeHash");
  if (!tenant) return res.status(404).json({ success: false, message: "Store not found" });
  tenant.setupCodeHash = ""; tenant.setupCodeExpiresAt = null; tenant.accessVersion += 1; await tenant.save();
  await ClientAdmin.updateMany({ tenantId: tenant._id }, { $inc: { sessionVersion: 1 } });
  res.json({ success: true });
};
exports.listAdmins = async (req, res) => { const admins = await ClientAdmin.find({ tenantId: req.params.id }).select("fullName email phone modules isActive lastLoginAt createdAt"); res.json({ success: true, admins }); };
exports.updateAdmin = async (req, res) => {
  const admin = await ClientAdmin.findOne({ _id: req.params.adminId, tenantId: req.params.id });
  if (!admin) return res.status(404).json({ success: false, message: "Client administrator not found" });
  if (req.body.isActive !== undefined) admin.isActive = toBool(req.body.isActive);
  if (Array.isArray(req.body.modules)) admin.modules = req.body.modules.filter((m) => modules.includes(m));
  admin.sessionVersion += 1; await admin.save(); res.json({ success: true, admin: { _id: admin._id, fullName: admin.fullName, email: admin.email, modules: admin.modules, isActive: admin.isActive } });
};
exports.sharedProducts = async (_req, res) => { const products = await Product.find({ tenantId: null }).select("name category price images isActive").sort({ name: 1 }); res.json({ success: true, products }); };

// Public storefront
exports.publicStore = async (req, res) => {
  const tenant = await Tenant.findOne({ slug: req.params.slug, status: "active", published: true });
  if (!tenant) return res.status(404).json({ success: false, message: "Store not found" });
  res.json({ success: true, store: { slug: tenant.slug, name: tenant.name, website: tenant.website, modules: tenant.modules } });
};
exports.publicProducts = async (req, res) => {
  const tenant = await Tenant.findOne({ slug: req.params.slug, status: "active", published: true }).select("sharedProductIds");
  if (!tenant) return res.status(404).json({ success: false, message: "Store not found" });
  const filter = { isActive: true, $or: [{ tenantId: tenant._id }] };
  if (tenant.sharedProductIds.length) filter.$or.push({ tenantId: null, _id: { $in: tenant.sharedProductIds } });
  if (req.query.category) filter.category = String(req.query.category).slice(0, 80);
  if (req.query.search) filter.$text = { $search: String(req.query.search).slice(0, 100) };
  if (req.query.featured === "true") filter.isFeatured = true;
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(48, Math.max(1, Number(req.query.limit) || 24));
  const [rows, total] = await Promise.all([Product.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit), Product.countDocuments(filter)]);
  res.json({ success: true, products: rows.map(publicProduct), total, page, pages: Math.ceil(total / limit) });
};
exports.publicProduct = async (req, res) => {
  const tenant = await Tenant.findOne({ slug: req.params.slug, status: "active", published: true }).select("sharedProductIds");
  if (!tenant) return res.status(404).json({ success: false, message: "Store not found" });
  const filter = { _id: req.params.id, isActive: true, $or: [{ tenantId: tenant._id }] };
  if (tenant.sharedProductIds.length) filter.$or.push({ tenantId: null, _id: { $in: tenant.sharedProductIds } });
  const product = await Product.findOne(filter);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  res.json({ success: true, product: publicProduct(product) });
};
exports.publicEnquiry = async (req, res) => {
  const tenant = await Tenant.findOne({ slug: req.params.slug, status: "active", published: true });
  if (!tenant) return res.status(404).json({ success: false, message: "Store not found" });
  const name = String(req.body.name || "").trim(), phone = String(req.body.phone || "").replace(/[^\d+]/g, "");
  if (!name || phone.replace(/\D/g, "").length < 10) return res.status(400).json({ success: false, message: "Name and valid phone are required" });
  if (req.body.contactConsent !== true) return res.status(400).json({ success: false, message: "Please agree to be contacted about this enquiry" });
  const lead = await Lead.create({ tenantId: tenant._id, name: name.slice(0, 120), phone: phone.slice(0, 20), email: String(req.body.email || "").slice(0, 160), city: String(req.body.city || "").slice(0, 100), source: "website", interestedIn: [String(req.body.message || "Product enquiry").slice(0, 200)], contactConsent: { granted: req.body.contactConsent === true, grantedAt: req.body.contactConsent === true ? new Date() : undefined, context: `${tenant.name} website` } });
  res.status(201).json({ success: true, enquiryId: lead._id });
};

// Secure one-time bootstrap and isolated client-admin session
exports.setup = async (req, res) => {
  const { slug } = req.params;
  if (!(await allowedAttempt(req, res, slug, "setup"))) return;
  const tenant = await Tenant.findOne({ slug, status: { $ne: "suspended" } }).select("+setupCodeHash");
  if (!tenant || !tenant.setupCodeHash || !tenant.setupCodeExpiresAt || tenant.setupCodeExpiresAt < new Date()) return res.status(400).json({ success: false, message: "Setup code is invalid or expired" });
  const existing = await ClientAdmin.exists({ tenantId: tenant._id, isActive: true });
  if (existing) return res.status(409).json({ success: false, message: "Initial administrator is already set up. Ask the store owner to invite another admin." });
  if (!(await bcrypt.compare(String(req.body.accessCode || ""), tenant.setupCodeHash))) return res.status(400).json({ success: false, message: "Setup code is invalid or expired" });
  const fullName = String(req.body.fullName || "").trim(), email = String(req.body.email || "").trim().toLowerCase(), password = String(req.body.password || "");
  if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) return res.status(400).json({ success: false, message: "Enter your name, a valid email and a password with at least 12 characters" });
  const expectedHash = tenant.setupCodeHash;
  tenant.setupCodeHash = ""; tenant.setupCodeExpiresAt = null; tenant.accessVersion += 1;
  const result = await Tenant.updateOne({ _id: tenant._id, setupCodeHash: expectedHash, setupCodeExpiresAt: { $gt: new Date() } }, { $set: { setupCodeHash: "", setupCodeExpiresAt: null }, $inc: { accessVersion: 1 } });
  if (!result.modifiedCount) return res.status(409).json({ success: false, message: "Setup code has already been used" });
  try {
    const admin = await ClientAdmin.create({ tenantId: tenant._id, fullName, email, password, modules: modules.filter((m) => tenant.modules[m] !== false) });
    cookie(res, sessionToken(admin)); return res.status(201).json({ success: true, admin: { fullName: admin.fullName, email: admin.email, modules: admin.modules } });
  } catch (e) { return res.status(e.code === 11000 ? 409 : 400).json({ success: false, message: e.code === 11000 ? "That email already has an account" : "Could not create the account" }); }
};
exports.login = async (req, res) => {
  const { slug } = req.params;
  if (!(await allowedAttempt(req, res, slug, "login"))) return;
  const tenant = await Tenant.findOne({ slug, status: "active" });
  const admin = tenant && await ClientAdmin.findOne({ tenantId: tenant._id, email: String(req.body.email || "").trim().toLowerCase() }).select("+password");
  if (!admin || !admin.isActive || !(await admin.matchPassword(String(req.body.password || "")))) return res.status(401).json({ success: false, message: "Email or password is incorrect" });
  admin.lastLoginAt = new Date(); await admin.save(); cookie(res, sessionToken(admin));
  res.json({ success: true, admin: { fullName: admin.fullName, email: admin.email, modules: admin.modules } });
};
exports.logout = async (_req, res) => { cookie(res, ""); res.json({ success: true }); };
exports.me = async (req, res) => res.json({ success: true, store: { slug: req.tenant.slug, name: req.tenant.name, domain: req.tenant.domain, website: req.tenant.website, modules: req.tenant.modules }, admin: { fullName: req.clientAdmin.fullName, email: req.clientAdmin.email, modules: req.clientAdmin.modules } });

// Client admin endpoints; every query is tenant-bound.
exports.adminProducts = async (req, res) => { const products = await Product.find({ tenantId: req.tenant._id }).sort({ createdAt: -1 }); res.json({ success: true, products }); };
const cleanProduct = (body) => {
  const fields = ["name", "description", "category", "subCategory", "tags", "images", "price", "comparePrice", "stock", "sku", "isFeatured", "isActive", "material", "careInstructions", "variants"];
  const out = {}; for (const key of fields) if (body[key] !== undefined) out[key] = body[key];
  for (const key of ["images", "variants", "tags"]) if (typeof out[key] === "string") { try { out[key] = JSON.parse(out[key]); } catch { out[key] = key === "tags" ? out[key].split(",").map((v) => v.trim()).filter(Boolean) : []; } }
  if (!out.name || !out.category || !Number.isFinite(Number(out.price)) || Number(out.price) < 0) throw new Error("Product name, category and a valid price are required");
  out.price = Number(out.price); out.stock = Math.max(0, Number(out.stock) || 0); out.name = String(out.name).slice(0, 160); out.category = String(out.category).slice(0, 80);
  if (Array.isArray(out.images)) out.images = out.images.slice(0, 8).map((v) => String(v).slice(0, 1000));
  if (Array.isArray(out.variants)) out.variants = out.variants.slice(0, 30);
  return out;
};
exports.createProduct = async (req, res) => { try { const data = cleanProduct({ ...req.body, ...(req.files?.length ? { images: req.files.map((f) => uploadedUrl(f, req)) } : {}) }); if (!req.clientAdmin.modules.includes("offers") || req.tenant.modules.offers === false) { delete data.comparePrice; data.isFeatured = false; } const product = await Product.create({ ...data, tenantId: req.tenant._id }); res.status(201).json({ success: true, product }); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.updateProduct = async (req, res) => { try { const data = cleanProduct({ ...req.body, ...(req.files?.length ? { images: req.files.map((f) => uploadedUrl(f, req)) } : {}) }); if (!req.clientAdmin.modules.includes("offers") || req.tenant.modules.offers === false) { delete data.comparePrice; delete data.isFeatured; } const product = await Product.findOneAndUpdate({ _id: req.params.id, tenantId: req.tenant._id }, data, { new: true, runValidators: true }); if (!product) return res.status(404).json({ success: false, message: "Product not found" }); res.json({ success: true, product }); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.deleteProduct = async (req, res) => { const p = await Product.findOneAndDelete({ _id: req.params.id, tenantId: req.tenant._id }); if (!p) return res.status(404).json({ success: false, message: "Product not found" }); res.json({ success: true }); };
exports.getOrders = async (req, res) => { const orders = await Order.find({ tenantId: req.tenant._id }).sort({ createdAt: -1 }).limit(300); res.json({ success: true, orders }); };
exports.updateOrder = async (req, res) => { const allowed = ["pending", "confirmed", "packed", "assigned", "out_for_delivery", "delivered", "cancelled"]; const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenant._id }); if (!order) return res.status(404).json({ success: false, message: "Order not found" }); if (!allowed.includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid status" }); order.status = req.body.status; order.statusTimeline.push({ status: order.status, message: "Updated by store administrator" }); await order.save(); res.json({ success: true, order }); };
exports.getEnquiries = async (req, res) => { const enquiries = await Lead.find({ tenantId: req.tenant._id }).sort({ createdAt: -1 }).limit(300); res.json({ success: true, enquiries }); };
exports.updateEnquiry = async (req, res) => { const allowed = ["new", "contacted", "interested", "converted", "lost"]; const lead = await Lead.findOne({ _id: req.params.id, tenantId: req.tenant._id }); if (!lead) return res.status(404).json({ success: false, message: "Enquiry not found" }); if (!allowed.includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid status" }); lead.status = req.body.status; await lead.save(); res.json({ success: true, enquiry: lead }); };
exports.updateWebsite = async (req, res) => {
  const allowed = ["tagline", "description", "logoUrl", "heroImageUrl", "heroEyebrow", "heroTitle", "heroDescription", "primaryColor", "accentColor", "backgroundColor", "announcement", "showAnnouncement", "whatsappNumber", "phone", "email", "storeAddress", "shippingPolicy", "returnPolicy", "privacyPolicy", "termsPolicy", "instagramUrl", "facebookUrl", "seoTitle", "seoDescription", "freeDeliveryAbove", "deliveryFee", "deliveryCities", "homepageSections", "categories"];
  for (const key of allowed) if (req.body[key] !== undefined) {
    if (key === "categories" && (!req.clientAdmin.modules.includes("categories") || req.tenant.modules.categories === false)) continue;
    if (key === "whatsappNumber" && (!req.clientAdmin.modules.includes("whatsapp") || req.tenant.modules.whatsapp === false)) continue;
    if (["instagramUrl", "facebookUrl"].includes(key) && req.body[key]) {
      try { if (!["http:", "https:"].includes(new URL(String(req.body[key])).protocol)) throw new Error(); }
      catch { return res.status(400).json({ success: false, message: `${key} must be a valid http or https URL` }); }
    }
    if (["heroImageUrl", "logoUrl"].includes(key) && req.body[key]) {
      try { if (new URL(String(req.body[key])).protocol !== "https:") throw new Error(); }
      catch { return res.status(400).json({ success: false, message: `${key} must be a secure https image URL` }); }
    }
    if (key === "whatsappNumber") req.body[key] = String(req.body[key]).replace(/\D/g, "").slice(0, 15);
    req.tenant.website[key] = req.body[key];
  }
  await req.tenant.save(); res.json({ success: true, website: req.tenant.website });
};
exports.uploadMedia = async (req, res) => { if (!req.file) return res.status(400).json({ success: false, message: "Choose an image first" }); if (!String(req.file.mimetype || "").startsWith("image/")) return res.status(400).json({ success: false, message: "Only image files are accepted" }); res.status(201).json({ success: true, url: uploadedUrl(req.file, req) }); };
exports.analytics = async (req, res) => { const [totalProducts, activeProducts, totalOrders, pendingOrders, totalEnquiries, revenue] = await Promise.all([Product.countDocuments({ tenantId: req.tenant._id }), Product.countDocuments({ tenantId: req.tenant._id, isActive: true }), Order.countDocuments({ tenantId: req.tenant._id }), Order.countDocuments({ tenantId: req.tenant._id, status: { $in: ["pending", "confirmed", "packed"] } }), Lead.countDocuments({ tenantId: req.tenant._id }), Order.aggregate([{ $match: { tenantId: req.tenant._id, paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$grandTotal" } } }])]); res.json({ success: true, stats: { totalProducts, activeProducts, totalOrders, pendingOrders, totalEnquiries, paidRevenue: revenue[0]?.total || 0 } }); };
