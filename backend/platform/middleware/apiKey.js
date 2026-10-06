const crypto = require("crypto");
const Application = require("../models/Application");
const ApiKey = require("../models/ApiKey");

const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");

const platformAuth = ({ scope, allowPublic = false } = {}) => async (req, res, next) => {
  try {
    const authorization = req.get("authorization") || "";
    const bearer = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    const publicKey = req.get("x-savitri-public-key") || (bearer.startsWith("pk_") ? bearer : "");
    if (allowPublic && publicKey.startsWith("pk_")) {
      const origin = req.get("origin");
      if (!origin) return res.status(401).json({ success: false, message: "A registered Origin is required for public application keys" });
      const app = await Application.findOne({ publicKey }).select("+publicKey");
      if (!app || app.status !== "active") return res.status(401).json({ success: false, message: "Invalid or inactive application key" });
      const host = new URL(origin).host.toLowerCase();
      if (!app.allowedDomains.includes(host)) return res.status(403).json({ success: false, message: "Origin is not allowed for this application" });
      req.platformApplication = app;
      req.platformAuthType = "public";
      return next();
    }

    if (!bearer.startsWith("sk_")) return res.status(401).json({ success: false, message: "A platform API key is required" });
    const key = await ApiKey.findOne({ secretHash: digest(bearer), status: "active" }).select("+secretHash").populate("application");
    if (!key || !key.application || key.application.status !== "active") return res.status(401).json({ success: false, message: "Invalid or revoked platform API key" });
    if (key.expiresAt && key.expiresAt <= new Date()) return res.status(401).json({ success: false, message: "Platform API key has expired" });
    if (scope && !key.scopes.includes(scope)) return res.status(403).json({ success: false, message: "API key is missing the required permission" });
    if (req.body?.appId && req.body.appId !== key.application.appId) return res.status(403).json({ success: false, message: "API key cannot access another application" });
    req.platformApplication = key.application;
    req.platformApiKey = key;
    req.platformAuthType = "secret";
    if (!key.lastUsedAt || Date.now() - key.lastUsedAt.getTime() > 60000) {
      key.lastUsedAt = new Date();
      await key.save();
    }
    next();
  } catch (error) {
    if (error instanceof TypeError) return res.status(400).json({ success: false, message: "Invalid Origin header" });
    next(error);
  }
};

module.exports = { platformAuth };