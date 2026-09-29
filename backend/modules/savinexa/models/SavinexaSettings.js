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
  theme: { type: String, default: "default" },
}, { timestamps: true });

module.exports = mongoose.model("SavinexaSettings", savinexaSettingsSchema);
