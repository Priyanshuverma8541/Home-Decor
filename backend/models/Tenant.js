const mongoose = require("mongoose");
const sectionSchema = new mongoose.Schema({ key: String, title: String, enabled: Boolean, imageUrl: String, body: String }, { _id: false });
const categorySchema = new mongoose.Schema({ name: String, slug: String, description: String, imageUrl: String, enabled: { type: Boolean, default: true }, sortOrder: { type: Number, default: 0 } }, { _id: false });
const moduleDefaults = { products: true, categories: true, orders: true, enquiries: true, homepage: true, offers: true, analytics: true, whatsapp: true };
const tenantSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  status: { type: String, enum: ["draft", "active", "suspended"], default: "draft", index: true }, published: { type: Boolean, default: false },
  domain: { type: String, trim: true, lowercase: true, default: "" }, adminDomain: { type: String, trim: true, lowercase: true, default: "" }, aliases: [{ type: String, trim: true, lowercase: true }],
  sharedProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  website: {
    tagline: { type: String, maxlength: 180, default: "Jewellery for meaningful moments" }, description: { type: String, maxlength: 600, default: "Discover beautiful jewellery chosen with care." },
    logoUrl: { type: String, default: "" }, heroImageUrl: { type: String, default: "" }, heroEyebrow: { type: String, maxlength: 100, default: "MAA VINDHWSHANI JEWELLERY" }, heroTitle: { type: String, maxlength: 160, default: "Tradition, treasured." }, heroDescription: { type: String, maxlength: 500, default: "Discover jewellery for everyday beauty, celebrations and the moments you will remember." },
    primaryColor: { type: String, match: /^#[0-9a-fA-F]{6}$/, default: "#542d22" }, accentColor: { type: String, match: /^#[0-9a-fA-F]{6}$/, default: "#bd8b45" }, backgroundColor: { type: String, match: /^#[0-9a-fA-F]{6}$/, default: "#fbf7f0" },
    announcement: { type: String, maxlength: 180, default: "" }, showAnnouncement: { type: Boolean, default: false }, whatsappNumber: { type: String, default: "" }, phone: { type: String, default: "" }, email: { type: String, default: "" }, storeAddress: { type: String, maxlength: 500, default: "" }, shippingPolicy: { type: String, maxlength: 4000, default: "" }, returnPolicy: { type: String, maxlength: 4000, default: "" }, privacyPolicy: { type: String, maxlength: 4000, default: "" }, termsPolicy: { type: String, maxlength: 4000, default: "" }, instagramUrl: { type: String, default: "" }, facebookUrl: { type: String, default: "" },
    seoTitle: { type: String, maxlength: 160, default: "Maa Vindhwshani Jewellery" }, seoDescription: { type: String, maxlength: 300, default: "Shop occasion and fashion jewellery from Maa Vindhwshani Jewellery." }, freeDeliveryAbove: { type: Number, default: 0 }, deliveryFee: { type: Number, default: 0 }, deliveryCities: [{ type: String }],
    homepageSections: { type: [sectionSchema], default: () => [{ key: "categories", title: "Shop by collection", enabled: true }, { key: "featured", title: "Handpicked for you", enabled: true }, { key: "story", title: "A little about us", enabled: true }] },
    categories: { type: [categorySchema], default: () => [
      { name: "Artificial Jewellery", slug: "artificial-jewellery", enabled: true, sortOrder: 1 },
      { name: "Traditional Gold Look", slug: "traditional-gold-look", enabled: true, sortOrder: 2 },
      { name: "Occasion & Bridal", slug: "occasion-bridal", enabled: true, sortOrder: 3 },
      { name: "Everyday Favourites", slug: "everyday-favourites", enabled: true, sortOrder: 4 },
    ] },
  },
  modules: { type: new mongoose.Schema({ products: { type: Boolean, default: true }, categories: { type: Boolean, default: true }, orders: { type: Boolean, default: true }, enquiries: { type: Boolean, default: true }, homepage: { type: Boolean, default: true }, offers: { type: Boolean, default: true }, analytics: { type: Boolean, default: true }, whatsapp: { type: Boolean, default: true } }, { _id: false }), default: moduleDefaults },
  setupCodeHash: { type: String, select: false, default: "" }, setupCodeExpiresAt: { type: Date, default: null }, accessVersion: { type: Number, default: 1 },
}, { timestamps: true });
tenantSchema.index({ domain: 1 }); tenantSchema.index({ adminDomain: 1 });
module.exports = mongoose.model("Tenant", tenantSchema);
