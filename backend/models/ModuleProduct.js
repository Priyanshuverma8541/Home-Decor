const mongoose = require("mongoose");

const releaseSchema = new mongoose.Schema({
  version: { type: String, trim: true, maxlength: 32 },
  integrationType: { type: String, enum: ["internal", "deployed", "microfrontend", "iframe", "api"] },
  internalKey: { type: String, enum: ["portfolio-builder", "games", "media-downloader", "developer-zone", ""] , default: "" },
  deploymentUrl: { type: String, trim: true, maxlength: 1000, default: "" },
  allowedOrigins: [{ type: String, trim: true, lowercase: true }],
  repositoryUrl: { type: String, trim: true, maxlength: 500, default: "" },
  branch: { type: String, trim: true, maxlength: 120, default: "main" },
  commitSha: { type: String, trim: true, maxlength: 64, default: "" },
  changelog: { type: String, trim: true, maxlength: 2000, default: "" },
  buildStatus: { type: String, enum: ["not-run", "pending", "passed", "failed"], default: "not-run" },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  publishedAt: { type: Date },
  status: { type: String, enum: ["submitted", "under-review", "changes-requested", "approved", "published", "rejected", "archived"], default: "submitted" },
}, { _id: true });

const moduleProductSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, maxlength: 64, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1200, default: "" },
  logoUrl: { type: String, trim: true, maxlength: 1000, default: "" },
  thumbnailUrl: { type: String, trim: true, maxlength: 1000, default: "" },
  category: { type: String, enum: ["tools", "games", "jobs", "networking", "business", "other"], default: "other", index: true },
  developer: { name: { type: String, trim: true, maxlength: 120, default: "" }, email: { type: String, trim: true, lowercase: true, maxlength: 200, default: "" } },
  version: { type: String, trim: true, maxlength: 32, default: "0.1.0" },
  integrationType: { type: String, enum: ["internal", "deployed", "microfrontend", "iframe", "api"], default: "internal" },
  internalKey: { type: String, enum: ["portfolio-builder", "games", "media-downloader", "developer-zone", ""], default: "" },
  repositoryUrl: { type: String, trim: true, maxlength: 500, default: "" },
  branch: { type: String, trim: true, maxlength: 120, default: "main" },
  deploymentUrl: { type: String, trim: true, maxlength: 1000, default: "" },
  allowedOrigins: [{ type: String, trim: true, lowercase: true }],
  routeSection: { type: String, enum: ["apps", "tools", "games", "jobs", "networking"], default: "apps" },
  frontendRoute: { type: String, trim: true, maxlength: 140, required: true, unique: true },
  authenticationRequired: { type: Boolean, default: false },
  allowedRoles: [{ type: String, enum: ["customer", "admin", "delivery", "vendor"] }],
  permissions: [{ type: String, enum: ["profile:read", "catalog:read", "orders:read", "leads:write", "media:read", "notifications:send"] }],
  visibility: { homepage: { type: Boolean, default: false }, tools: { type: Boolean, default: false }, games: { type: Boolean, default: false }, jobs: { type: Boolean, default: false }, networking: { type: Boolean, default: false }, directRoute: { type: Boolean, default: true }, featured: { type: Boolean, default: false } },
  status: { type: String, enum: ["draft", "assigned", "in-development", "submitted", "under-review", "changes-requested", "approved", "rejected", "published", "suspended", "archived"], default: "draft", index: true },
  isPublished: { type: Boolean, default: false, index: true },
  approvedRelease: { type: releaseSchema, default: null },
  releaseCandidate: { type: releaseSchema, default: null },
  versionHistory: { type: [releaseSchema], default: [] },
  lastBuildStatus: { type: String, enum: ["not-run", "pending", "passed", "failed"], default: "not-run" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

moduleProductSchema.index({ isPublished: 1, status: 1, category: 1 });
module.exports = mongoose.model("ModuleProduct", moduleProductSchema);
