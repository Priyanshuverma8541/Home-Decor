const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/auth");
const { tenantAdmin, module: requireModule } = require("../middleware/tenantAuth");
const { upload } = require("../config/cloudinary");
const c = require("../controllers/tenantController");
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
for (const key of Object.keys(c)) c[key] = asyncRoute(c[key]);
const Tenant = require("../models/Tenant");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Lead = require("../models/Lead");

// Central Savitri Livings control plane.
router.get("/admin", protect, adminOnly, c.list);
router.post("/admin", protect, adminOnly, c.create);
router.get("/admin/shared-products", protect, adminOnly, c.sharedProducts);
router.get("/admin/:id", protect, adminOnly, c.adminGet);
router.put("/admin/:id", protect, adminOnly, c.adminUpdate);
router.put("/admin/:id/setup-code", protect, adminOnly, c.setSetupCode);
router.delete("/admin/:id/access", protect, adminOnly, c.revokeAccess);
router.get("/admin/:id/admins", protect, adminOnly, c.listAdmins);
router.put("/admin/:id/admins/:adminId", protect, adminOnly, c.updateAdmin);

// Public storefront API.
router.get("/public/:slug", c.publicStore);
router.get("/public/:slug/products", c.publicProducts);
router.get("/public/:slug/products/:id", c.publicProduct);
router.post("/public/:slug/enquiries", c.publicEnquiry);
router.post("/public/:slug/orders", async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug, status: "active", published: true });
    if (!tenant) return res.status(404).json({ success: false, message: "Store not found" });
    const { items, guestName, guestPhone, city, deliveryAddress, landmark, pincode } = req.body;
    const digits = String(guestPhone || "").replace(/\D/g, "");
    if (!Array.isArray(items) || !items.length || items.length > 30 || !String(guestName || "").trim() || digits.length < 10 || digits.length > 15 || !String(city || "").trim() || !String(deliveryAddress || "").trim()) return res.status(400).json({ success: false, message: "Add items, your name, a valid phone, city and delivery address" });
    const deliveryCities = tenant.website.deliveryCities || [];
    if (deliveryCities.length && !deliveryCities.some((value) => String(value).trim().toLowerCase() === String(city).trim().toLowerCase())) return res.status(400).json({ success: false, message: "Delivery is not currently available in that city" });
    const shared = new Set(tenant.sharedProductIds.map(String));
    const quantities = new Map();
    for (const item of items) {
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 20) return res.status(400).json({ success: false, message: "Product quantities must be between 1 and 20" });
      const productId = String(item.productId), variant = String(item.variant || "").slice(0, 120), key = `${productId}::${variant}`;
      quantities.set(key, { productId, variant, quantity: (quantities.get(key)?.quantity || 0) + qty });
    }
    const enrichedItems = []; let totalAmount = 0;
    for (const { productId: id, variant: requestedVariant, quantity } of quantities.values()) {
      const p = await Product.findOne({ _id: id, isActive: true, $or: [{ tenantId: tenant._id }, ...(shared.has(id) ? [{ tenantId: null }] : [])] });
      const variant = requestedVariant ? p?.variants?.find((v) => v.value === requestedVariant) : null;
      const stock = variant ? variant.stock : p?.stock;
      if (!p || (p.variants?.length && !variant) || stock < quantity) return res.status(400).json({ success: false, message: `Product unavailable or insufficient stock: ${id}` });
      const price = Math.max(0, Number(p.price) + Number(variant?.priceAdjustment || 0));
      enrichedItems.push({ productId: p._id, name: p.name, image: p.images?.[0] || "", quantity, price, variant: variant?.value || "" }); totalAmount += price * quantity;
    }
    const deliveryFee = totalAmount >= Number(tenant.website.freeDeliveryAbove || 0) ? 0 : Number(tenant.website.deliveryFee || 0);
    const decremented = [];
    const releaseStock = async () => {
      for (const prior of decremented) await Product.updateOne({ _id: prior.productId, ...(prior.variant ? { "variants.value": prior.variant } : {}) }, { $inc: prior.variant ? { "variants.$.stock": prior.quantity, soldCount: -prior.quantity } : { stock: prior.quantity, soldCount: -prior.quantity } });
    };
    try {
      for (const item of enrichedItems) {
        const variantUpdate = item.variant ? { "variants.$.stock": -item.quantity, soldCount: item.quantity } : { stock: -item.quantity, soldCount: item.quantity };
        const stockFilter = item.variant ? { variants: { $elemMatch: { value: item.variant, stock: { $gte: item.quantity } } } } : { stock: { $gte: item.quantity } };
        const p = await Product.findOneAndUpdate({ _id: item.productId, isActive: true, ...stockFilter, $or: [{ tenantId: tenant._id }, ...(shared.has(String(item.productId)) ? [{ tenantId: null }] : [])] }, { $inc: variantUpdate }, { new: true });
        if (!p) { await releaseStock(); return res.status(409).json({ success: false, message: "Stock changed while placing your order. Please retry." }); }
        decremented.push(item);
      }
    } catch (error) { await releaseStock(); throw error; }
    let order;
    try {
      order = await Order.create({ tenantId: tenant._id, guestName: String(guestName).trim().slice(0, 120), guestPhone: digits, guestCity: String(city).trim().slice(0, 100), items: enrichedItems, totalAmount, deliveryFee, grandTotal: totalAmount + deliveryFee, city: String(city).trim().slice(0, 100), deliveryAddress: String(deliveryAddress).trim().slice(0, 500), landmark: String(landmark || "").slice(0, 200), pincode: String(pincode || "").slice(0, 12), orderSource: "website", landingPageSlug: tenant.slug, paymentMethod: "whatsapp", statusTimeline: [{ status: "pending", message: "Order received from jewellery storefront" }] });
    } catch (e) { await releaseStock(); throw e; }
    await Lead.create({ tenantId: tenant._id, name: String(guestName).trim().slice(0, 120), phone: digits, city: String(city).trim().slice(0, 100), source: "website", status: "converted", convertedOrderId: order._id, convertedAt: new Date(), interestedIn: enrichedItems.map((i) => i.name) }).catch((e) => console.warn("Could not record client store order contact:", e.message));
    res.status(201).json({ success: true, order: { orderNumber: order.orderNumber, grandTotal: order.grandTotal } });
  } catch (_error) { res.status(500).json({ success: false, message: "Could not place this order. Please try again." }); }
});

router.post("/:slug/admin/setup", c.setup);
router.post("/:slug/admin/login", c.login);
router.post("/:slug/admin/logout", c.logout);
router.get("/:slug/admin/me", tenantAdmin, c.me);
router.get("/:slug/admin/products", tenantAdmin, requireModule("products"), c.adminProducts);
router.post("/:slug/admin/products", tenantAdmin, requireModule("products"), upload.array("images", 8), c.createProduct);
router.put("/:slug/admin/products/:id", tenantAdmin, requireModule("products"), upload.array("images", 8), c.updateProduct);
router.delete("/:slug/admin/products/:id", tenantAdmin, requireModule("products"), c.deleteProduct);
router.get("/:slug/admin/orders", tenantAdmin, requireModule("orders"), c.getOrders);
router.patch("/:slug/admin/orders/:id", tenantAdmin, requireModule("orders"), c.updateOrder);
router.get("/:slug/admin/enquiries", tenantAdmin, requireModule("enquiries"), c.getEnquiries);
router.patch("/:slug/admin/enquiries/:id", tenantAdmin, requireModule("enquiries"), c.updateEnquiry);
router.put("/:slug/admin/website", tenantAdmin, requireModule("homepage"), c.updateWebsite);
router.post("/:slug/admin/media", tenantAdmin, requireModule("homepage"), upload.single("image"), c.uploadMedia);
router.get("/:slug/admin/analytics", tenantAdmin, requireModule("analytics"), c.analytics);

module.exports = router;
