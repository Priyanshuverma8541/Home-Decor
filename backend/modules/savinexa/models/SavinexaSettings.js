const mongoose = require("mongoose");

const savinexaSettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: "Savinexa" },
  logo: { type: String },
  favicon: { type: String },
  primaryColor: { type: String, default: "#1f2937" },
  secondaryColor: { type: String, default: "#eab308" },
  background: { type: String, default: "#f8fafc" },
  typography: { type: String, default: "Inter" },
  borderRadius: { type: String, default: "18px" },
  heroStyle: { type: String, default: "modern" },
  animationIntensity: { type: String, default: "moderate" },
  productCardStyle: { type: String, default: "premium" },
  contact: {
    email: { type: String },
    phone: { type: String },
    whatsapp: { type: String },
  },
  socialLinks: {
    instagram: { type: String },
    facebook: { type: String },
    whatsapp: { type: String },
    youtube: { type: String },
  },
  commerce: {
    currency: { type: String, default: "INR" },
    ctaDefaults: {
      primaryLabel: { type: String, default: "Buy now" },
      secondaryLabel: { type: String, default: "Explore" },
    },
  },
  seo: {
    defaultMetaTitle: { type: String, default: "Savinexa" },
    defaultMetaDescription: { type: String },
    canonicalUrl: { type: String },
  },
  marketing: {
    campaignSettings: { type: Object, default: {} },
    utmSettings: { type: Object, default: {} },
    consentConfiguration: { type: Object, default: {} },
  },
  announcementBar: {
    enabled: { type: Boolean, default: false },
    text: { type: String },
    link: { type: String },
  },
  hero: {
    eyebrow: { type: String, default: "Premium lifestyle collection", maxlength: 120 },
    title: { type: String, default: "Savinexa", maxlength: 160 },
    subtitle: { type: String, default: "Curated essentials, elevated living, and product experiences designed for modern homes and premium lifestyles.", maxlength: 600 },
    image: { type: String, default: "", maxlength: 2000 },
    mobileImage: { type: String, default: "", maxlength: 2000 },
    overlayColor: { type: String, default: "#101828" },
    overlayOpacity: { type: Number, default: 0.72, min: 0, max: 1 },
    primaryCtaLabel: { type: String, default: "Explore collection", maxlength: 50 },
    primaryCtaUrl: { type: String, default: "/savinexa/products", maxlength: 500 },
    secondaryCtaLabel: { type: String, default: "Shop Savitri Livings", maxlength: 50 },
    secondaryCtaUrl: { type: String, default: "/shop", maxlength: 500 },
  },
  homeSections: {
    featuredProducts: { enabled: { type: Boolean, default: true }, title: { type: String, default: "Featured products", maxlength: 100 } },
    categories: { enabled: { type: Boolean, default: true }, title: { type: String, default: "Shop by category", maxlength: 100 } },
    collections: { enabled: { type: Boolean, default: true }, title: { type: String, default: "Collections", maxlength: 100 } },
  },
  footer: {
    tagline: { type: String, default: "Thoughtful finds for everyday living.", maxlength: 300 },
    background: { type: String, default: "#1f2937" },
    textColor: { type: String, default: "#ffffff" },
  },  theme: { type: String, default: "default" },
}, { timestamps: true });

module.exports = mongoose.model("SavinexaSettings", savinexaSettingsSchema);
