const crypto = require("crypto");
const router = require("express").Router();
const Application = require("../models/Application");
const ApiKey = require("../models/ApiKey");
const { protect, adminOnly } = require("../../middleware/auth");

const scopes = new Set(["users:write", "subscribers:read", "subscribers:write", "notifications:send", "campaigns:write", "events:write", "analytics:read", "webhooks:write"]);
const makeKey = (prefix) => `${prefix}_${crypto.randomBytes(32).toString("base64url")}`;
const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");
const fail = (res, status, message) => res.status(status).json({ success: false, message });
const safeApplication = (app) => ({
  appId: app.appId,
  name: app.name,
  description: app.description,
  platform: app.platform,
  status: app.status,
  allowedDomains: app.allowedDomains,
  publicKey: app.publicKey,
  createdAt: app.createdAt,
  updatedAt: app.updatedAt,
});

router.use(protect, adminOnly);

router.get("/", async (_req, res, next) => {
  try {
    await Application.findOneAndUpdate(
      { appId: "app_savitri_livings" },
      { $setOnInsert: { name: "Savitri Livings", description: "Savitri Livings web application", platform: "web", status: "active", publicKey: makeKey("pk_live") }, $addToSet: { allowedDomains: { $each: ["home-decor-inky.vercel.app", "savitri-kolkata.vercel.app"] } } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await Application.findOneAndUpdate({ appId: "app_savinexa" }, { $setOnInsert: { name: "SaviNexa", description: "SaviNexa talent and curated products website", platform: "web", status: "active", publicKey: makeKey("pk_live"), allowedDomains: ["home-decor-inky.vercel.app"] } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await Application.findOneAndUpdate({ appId: "app_savitri_kolkata" }, { $setOnInsert: { name: "Savitri Livings Kolkata", description: "Kolkata storefront web push subscribers and campaigns", platform: "web", status: "active", publicKey: makeKey("pk_live"), allowedDomains: ["savitri-kolkata.vercel.app"] } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const apps = await Application.find().select("+publicKey").sort({ createdAt: -1 });
    res.json({ success: true, applications: apps.map(safeApplication) });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 100) : "";
    if (!name) return fail(res, 400, "Application name is required");
    const appId = typeof req.body.appId === "string" && req.body.appId.trim()
      ? req.body.appId.trim().toLowerCase()
      : `app_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
    if (!/^app_[a-z0-9_]{2,80}$/.test(appId)) return fail(res, 400, "appId must start with app_ and contain lowercase letters, numbers or underscores");
    const domains = Array.isArray(req.body.allowedDomains) ? req.body.allowedDomains.slice(0, 50) : [];
    const allowedDomains = [];
    for (const value of domains) {
      if (typeof value !== "string") continue;
      try {
        const url = new URL(value.includes("://") ? value : `https://${value}`);
        if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) continue;
        allowedDomains.push(url.host.toLowerCase());
      } catch (_error) { /* ignore malformed domain entries */ }
    }
    const publicKey = makeKey("pk_live");
    const app = await Application.create({
      appId,
      name,
      description: String(req.body.description || "").trim().slice(0, 500),
      platform: ["web", "mobile", "server", "other"].includes(req.body.platform) ? req.body.platform : "web",
      allowedDomains: [...new Set(allowedDomains)],
      publicKey,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, application: safeApplication(app), publicKey });
  } catch (error) {
    if (error.code === 11000) return fail(res, 409, "An application with this appId already exists");
    next(error);
  }
});

router.patch("/:appId", async (req, res, next) => {
  try {
    const allowed = ["name", "description", "platform", "status", "allowedDomains"];
    const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
    if (updates.name !== undefined) updates.name = String(updates.name).trim().slice(0, 100);
    if (updates.description !== undefined) updates.description = String(updates.description).trim().slice(0, 500);
    if (updates.status !== undefined && !["active", "paused", "revoked"].includes(updates.status)) return fail(res, 400, "Invalid application status");
    if (updates.platform !== undefined && !["web", "mobile", "server", "other"].includes(updates.platform)) return fail(res, 400, "Invalid application platform");
    const app = await Application.findOneAndUpdate({ appId: req.params.appId }, { $set: updates }, { new: true, runValidators: true }).select("+publicKey");
    if (!app) return fail(res, 404, "Application not found");
    if (app.status !== "active") await ApiKey.updateMany({ application: app._id, status: "active" }, { $set: { status: "revoked", revokedAt: new Date() } });
    res.json({ success: true, application: safeApplication(app) });
  } catch (error) { next(error); }
});

router.get("/:appId/keys", async (req, res, next) => {
  try {
    const app = await Application.findOne({ appId: req.params.appId });
    if (!app) return fail(res, 404, "Application not found");
    const keys = await ApiKey.find({ application: app._id }).sort({ createdAt: -1 }).select("-secretHash").lean();
    res.json({ success: true, keys: keys.map(({ _id, name, prefix, scopes, status, expiresAt, lastUsedAt, revokedAt, createdAt }) => ({ _id, name, prefix, scopes, status, expiresAt, lastUsedAt, revokedAt, createdAt })) });
  } catch (error) { next(error); }
});

router.post("/:appId/keys", async (req, res, next) => {
  try {
    const app = await Application.findOne({ appId: req.params.appId });
    if (!app) return fail(res, 404, "Application not found");
    if (app.status !== "active") return fail(res, 409, "Activate the application before creating API keys");
    const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 100) : "";
    const requestedScopes = Array.isArray(req.body?.scopes) ? [...new Set(req.body.scopes)] : [];
    if (!name) return fail(res, 400, "API key name is required");
    if (!requestedScopes.length || requestedScopes.some((scope) => !scopes.has(scope))) return fail(res, 400, "Select one or more valid API key scopes");
    const secret = makeKey("sk_live");
    const key = await ApiKey.create({ application: app._id, name, prefix: secret.slice(0, 15), secretHash: digest(secret), scopes: requestedScopes, createdBy: req.user._id });
    res.status(201).json({ success: true, key: { id: key._id, name: key.name, prefix: key.prefix, scopes: key.scopes }, secret });
  } catch (error) { next(error); }
});

router.post("/:appId/keys/:keyId/rotate", async (req, res, next) => {
  try {
    const app = await Application.findOne({ appId: req.params.appId });
    if (!app) return fail(res, 404, "Application not found");
    const previous = await ApiKey.findOne({ _id: req.params.keyId, application: app._id, status: "active" });
    if (!previous) return fail(res, 404, "Active API key not found");
    const secret = makeKey("sk_live");
    const replacement = await ApiKey.create({ application: app._id, name: previous.name, prefix: secret.slice(0, 15), secretHash: digest(secret), scopes: previous.scopes, createdBy: req.user._id });
    previous.status = "revoked";
    previous.revokedAt = new Date();
    await previous.save();
    res.status(201).json({ success: true, key: { id: replacement._id, name: replacement.name, prefix: replacement.prefix, scopes: replacement.scopes }, secret });
  } catch (error) { next(error); }
});

router.delete("/:appId/keys/:keyId", async (req, res, next) => {
  try {
    const app = await Application.findOne({ appId: req.params.appId });
    if (!app) return fail(res, 404, "Application not found");
    const key = await ApiKey.findOneAndUpdate({ _id: req.params.keyId, application: app._id, status: "active" }, { $set: { status: "revoked", revokedAt: new Date() } }, { new: true });
    if (!key) return fail(res, 404, "Active API key not found");
    res.json({ success: true, message: "API key revoked" });
  } catch (error) { next(error); }
});

module.exports = router;
