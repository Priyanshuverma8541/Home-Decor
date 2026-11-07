const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 1200 },
  url: { type: String, trim: true, maxlength: 500, default: "" },
  status: { type: String, enum: ["active", "in-development", "coming-soon", "disabled"], default: "in-development" },
  previewImage: { type: String, trim: true, maxlength: 1000, default: "" },
}, { _id: false });

const schema = new mongoose.Schema({
  key: { type: String, default: "growth-livings", unique: true },
  enabled: { type: Boolean, default: true },
  title: { type: String, default: "Growth Livings", trim: true, maxlength: 100 },
  headline: { type: String, default: "Build Your Professional Identity. Discover Opportunities. Grow Together.", trim: true, maxlength: 220 },
  description: { type: String, default: "A connected ecosystem for professional portfolios, networking, recruitment and career opportunities.", trim: true, maxlength: 1000 },
  products: {
    resume: { type: productSchema, default: () => ({ title: "Resume / Portfolio", description: "Create a professional identity with a recruiter-ready portfolio and architectural experience.", status: "in-development" }) },
    trustThem: { type: productSchema, default: () => ({ title: "Trust Them", description: "Connect professionals, recruiters, companies and candidates around career opportunities.", status: "in-development" }) },
  },
  seo: { title: { type: String, maxlength: 180, default: "Growth Livings | Savitri Livings" }, description: { type: String, maxlength: 320, default: "Professional portfolios, connections and career opportunities from Growth Livings." } },
}, { timestamps: true, minimize: false });

module.exports = mongoose.models.GrowthSettings || mongoose.model("GrowthSettings", schema);
