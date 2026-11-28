const ipaddr = require("ipaddr.js");

const INTERNAL_KEYS = new Set(["portfolio-builder", "games", "media-downloader", "developer-zone"]);
const SECTIONS = new Set(["apps", "tools", "games", "jobs", "networking"]);
const RESERVED_ROUTES = new Set(["tools/developer-zone"]);
const ROLES = new Set(["customer", "admin", "delivery", "vendor"]);
const PERMISSIONS = new Set(["profile:read", "catalog:read", "orders:read", "leads:write", "media:read", "notifications:send"]);
const VISIBILITY = ["homepage", "tools", "games", "jobs", "networking", "directRoute", "featured"];
const fail = (message) => { throw new Error(message); };
const text = (value, max, label, required = false) => {
  const cleaned = typeof value === "string" ? value.trim() : "";
  if (required && !cleaned) fail(`${label} is required.`);
  if (cleaned.length > max) fail(`${label} must be ${max} characters or fewer.`);
  return cleaned;
};
const list = (value) => Array.isArray(value) ? value : typeof value === "string" ? value.split(/[\n,]/) : [];

function safeHttpsUrl(value, label, optional = true) {
  const raw = text(value, 1000, label, !optional);
  if (!raw) return "";
  let url;
  try { url = new URL(raw); } catch { fail(`${label} must be a valid HTTPS URL.`); }
  if (url.protocol !== "https:" || url.username || url.password || url.port || !url.hostname.includes(".") || url.hostname.endsWith(".localhost") || url.hostname.endsWith(".local") || url.hostname === "localhost") fail(`${label} must use a public HTTPS origin without credentials or a custom port.`);
  try {
    const ip = ipaddr.parse(url.hostname.replace(/^\[|\]$/g, ""));
    if (ip.range() !== "unicast") fail(`${label} cannot use a private or reserved IP address.`);
  } catch (error) {
    if (error.message.includes("private or reserved")) throw error;
    if (/^[\d.:[\]]+$/.test(url.hostname)) fail(`${label} must not use a malformed IP address.`);
  }
  return url.toString();
}

function safeRepository(value) {
  const raw = text(value, 500, "Repository URL");
  if (!raw) return "";
  let url;
  try { url = new URL(raw); } catch { fail("Repository URL must be a GitHub repository URL."); }
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com" || url.username || url.password || url.port || !/^\/[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}(?:\.git)?\/?$/.test(url.pathname)) fail("Repository URL must point to github.com/owner/repository.");
  return `https://github.com/${url.pathname.split("/").filter(Boolean).slice(0, 2).join("/").replace(/\.git$/, "")}`;
}

function cleanProduct(body = {}, { requireDeploymentUrl = false } = {}) {
  const productId = text(body.productId, 64, "Product ID", true).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(productId)) fail("Product ID must use lowercase letters, numbers and single hyphens.");
  const name = text(body.name, 120, "Product name", true);
  const category = ["tools", "games", "jobs", "networking", "business", "other"].includes(body.category) ? body.category : "other";
  const integrationType = ["internal", "deployed", "microfrontend", "iframe", "api"].includes(body.integrationType) ? body.integrationType : "internal";
  const version = text(body.version || "0.1.0", 32, "Version", true);
  if (!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(version)) fail("Version must use semantic versioning, such as 1.0.0.");
  const routeSection = SECTIONS.has(body.routeSection) ? body.routeSection : (["tools", "games", "jobs", "networking"].includes(category) ? category : "apps");
  const route = `${routeSection}/${productId}`;
  if (RESERVED_ROUTES.has(route)) fail("That route is reserved by Savitri Livings.");
  const internalKey = integrationType === "internal" ? text(body.internalKey, 64, "Internal entry point", true) : "";
  if (integrationType === "internal" && !INTERNAL_KEYS.has(internalKey)) fail("Choose a supported internal entry point.");
  const deploymentUrl = integrationType === "internal" ? "" : safeHttpsUrl(body.deploymentUrl, "Deployment URL", !requireDeploymentUrl);
  const origins = [...new Set(list(body.allowedOrigins).map(value => safeHttpsUrl(String(value || "").trim(), "Allowed origin", false)).map(value => new URL(value).origin.toLowerCase()))];
  if (["iframe", "microfrontend"].includes(integrationType) && deploymentUrl && !origins.includes(new URL(deploymentUrl).origin.toLowerCase())) fail("The deployment origin must be included in the iframe allowlist.");
  const allowedRoles = [...new Set(list(body.allowedRoles).map(value => String(value).trim()).filter(Boolean))];
  if (allowedRoles.some(role => !ROLES.has(role))) fail("One or more access roles are not supported.");
  const permissions = [...new Set(list(body.permissions).map(value => String(value).trim()).filter(Boolean))];
  if (permissions.some(permission => !PERMISSIONS.has(permission))) fail("One or more requested permission scopes are not supported.");
  const visibilityInput = body.visibility && typeof body.visibility === "object" ? body.visibility : {};
  const visibility = Object.fromEntries(VISIBILITY.map(key => [key, visibilityInput[key] === true]));
  if (visibility["featured"] && ![visibility.homepage, visibility.tools, visibility.games, visibility.jobs, visibility.networking].some(Boolean)) fail("A featured product must be visible in at least one section.");
  return {
    productId, name, category, version, routeSection, frontendRoute: `/${route}`,
    description: text(body.description, 1200, "Description"),
    logoUrl: safeHttpsUrl(body.logoUrl, "Logo URL"), thumbnailUrl: safeHttpsUrl(body.thumbnailUrl, "Thumbnail URL"),
    developer: { name: text(body.developer?.name, 120, "Developer name"), email: text(body.developer?.email, 200, "Developer email").toLowerCase() },
    integrationType, internalKey,
    repositoryUrl: safeRepository(body.repositoryUrl),
    branch: text(body.branch || "main", 120, "Branch"),
    deploymentUrl, allowedOrigins: origins,
    authenticationRequired: body.authenticationRequired === true,
    allowedRoles, permissions, visibility,
  };
}

function cleanSubmission(body = {}) {
  const version = text(body.version, 32, "Version", true);
  if (!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(version)) fail("Version must use semantic versioning, such as 1.0.0.");
  const repositoryUrl = safeRepository(body.repositoryUrl);
  const pullRequestUrl = text(body.pullRequestUrl, 500, "Pull request URL");
  if (pullRequestUrl) {
    let url;
    try { url = new URL(pullRequestUrl); } catch { fail("Pull request URL must be a GitHub pull request."); }
    if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com" || !/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/\d+\/?$/.test(url.pathname)) fail("Pull request URL must point to a GitHub pull request.");
  }
  const documentationUrl = safeHttpsUrl(body.documentationUrl, "Documentation URL");
  const commitSha = text(body.commitSha, 64, "Commit ID");
  if (commitSha && !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(commitSha)) fail("Commit ID must be a full 40 or 64 character hexadecimal SHA.");
  return { version, repositoryUrl, branch: text(body.branch || "main", 120, "Branch"), pullRequestUrl, commitSha, documentationUrl, summary: text(body.summary, 3000, "Submission summary", true) };
}

module.exports = { INTERNAL_KEYS, SECTIONS, safeHttpsUrl, safeRepository, cleanProduct, cleanSubmission };
