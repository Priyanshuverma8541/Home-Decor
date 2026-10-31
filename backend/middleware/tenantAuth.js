const jwt = require("jsonwebtoken");
const ClientAdmin = require("../models/ClientAdmin");
const Tenant = require("../models/Tenant");

const cookieToken = (header = "") => {
  const item = header.split(";").map((v) => v.trim()).find((v) => v.startsWith("maa_session="));
  return item ? decodeURIComponent(item.slice("maa_session=".length)) : null;
};

exports.tenantAdmin = async (req, res, next) => {
  try {
    const token = String(req.headers["x-tenant-session"] || "") || cookieToken(req.headers.cookie || "");
    if (!token) return res.status(401).json({ success: false, message: "Sign in to continue" });
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    if (claims.kind !== "tenant-admin" || !claims.clientAdminId || !claims.tenantId) throw new Error("Invalid session");
    const account = await ClientAdmin.findById(claims.clientAdminId);
    if (!account || !account.isActive || String(account.tenantId) !== String(claims.tenantId) || account.sessionVersion !== claims.sessionVersion)
      return res.status(401).json({ success: false, message: "Your session has expired" });
    const tenant = await Tenant.findById(account.tenantId);
    if (!tenant || tenant.status !== "active") return res.status(403).json({ success: false, message: "Store access is unavailable" });
    if (req.params.slug && req.params.slug !== tenant.slug) return res.status(403).json({ success: false, message: "This account cannot access that store" });
    req.clientAdmin = account;
    req.tenant = tenant;
    next();
  } catch (_error) { return res.status(401).json({ success: false, message: "Sign in to continue" }); }
};

exports.module = (name) => (req, res, next) => {
  if (!req.clientAdmin?.modules?.includes(name) || req.tenant?.modules?.[name] === false)
    return res.status(403).json({ success: false, message: "This area is not enabled for your account" });
  next();
};
