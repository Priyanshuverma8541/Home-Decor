const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  type: { type: String, enum: ["sellable", "portfolio"], default: "sellable", required: true },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  shortDesc: { type: String, required: true, maxlength: 500 },
  longDesc: { type: String, default: "", maxlength: 12000 },
  thumbnail: { type: String, default: "" }, images: [{ type: String }], demoVideoUrl: String,
  category: { type: String, enum: ["mern", "design", "fullstack", "mobile", "ai", "other"], default: "mern" },
  techStack: [String], features: [String], liveDemoUrl: String, githubUrl: String,
  pricing: { codeOnly: { type: Number, default: 499 }, codeAndCall: { type: Number, default: 999 }, mentorship: { type: Number, default: 1999 }, customBuild: { type: Number, default: 4999 } },
  privateGithubUrl: { type: String, default: "" }, docsPdfUrl: { type: String, default: "" },
  clientName: String, industry: String, testimonial: String, builtIn: String,
  isFeatured: { type: Boolean, default: false }, isActive: { type: Boolean, default: true }, order: { type: Number, default: 0 },
  views: { type: Number, default: 0 }, purchases: { type: Number, default: 0 },
}, { timestamps: true });

projectSchema.index({ type: 1, isActive: 1, order: 1 });
module.exports = mongoose.model("SavitriBuildHubProject", projectSchema);
