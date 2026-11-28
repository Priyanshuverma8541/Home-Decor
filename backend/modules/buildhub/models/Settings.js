const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: "buildhub" },
  brandName: { type: String, default: "BuildHub" }, tagline: { type: String, default: "Real projects. Real code. Real mentorship." },
  heroHeadline: { type: String, default: "Real projects. Real code. Real mentorship." },
  heroSubtext: { type: String, default: "Production-ready projects, practical guidance, and custom digital experiences for ambitious students and growing businesses." },
  whatsappNumber: { type: String, default: "6207855397" }, instagramHandle: { type: String, default: "livingcrafts__" },
  supportEmail: { type: String, default: "savitrilivings@gmail.com" }, supportPhone: { type: String, default: "6207855397" }, city: { type: String, default: "Buxar, Bihar" },
  upiId: { type: String, default: "6207855397@ybl" }, upiName: { type: String, default: "Savitri Livings" }, qrImageUrl: { type: String, default: "" },
  founderName: { type: String, default: "Priyanshu Verma" }, founderRole: { type: String, default: "Full-stack developer" }, founderBio: { type: String, default: "I build digital products for real businesses and help students learn from practical projects." }, founderPhotoUrl: { type: String, default: "" },
  serviceTiers: [{ name: String, priceFrom: Number, priceTo: Number, description: String, features: [String] }],
  activeCoupons: [{ code: String, discountPct: Number, discountFlat: Number, validUntil: Date, usageLimit: Number, usedCount: { type: Number, default: 0 }, isActive: { type: Boolean, default: true } }],
  totalSales: { type: Number, default: 0 }, totalRevenue: { type: Number, default: 0 }, showAnnouncement: { type: Boolean, default: false }, announcementText: { type: String, default: "" }, maintenanceMode: { type: Boolean, default: false },
  seoTitle: { type: String, default: "BuildHub | Savitri Livings" }, seoDescription: { type: String, default: "Production projects, developer services, and practical mentorship from Savitri Livings." }, ogImageUrl: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("SavitriBuildHubSettings", settingsSchema);
