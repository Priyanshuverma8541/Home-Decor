const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanProduct, cleanSubmission, safeHttpsUrl, safeRepository } = require("../services/moduleRegistryValidation");

const base = () => ({ productId: "image-editor", name: "Image Editor", category: "tools", integrationType: "internal", internalKey: "portfolio-builder", routeSection: "tools", visibility: { tools: true, directRoute: true } });

test("normalizes a valid internal module and derives the route", () => {
  const result = cleanProduct(base());
  assert.equal(result.productId, "image-editor");
  assert.equal(result.frontendRoute, "/tools/image-editor");
  assert.equal(result.integrationType, "internal");
  assert.deepEqual(result.allowedRoles, []);
});

test("rejects malformed IDs, reserved paths and unsupported internal entry keys", () => {
  assert.throws(() => cleanProduct({ ...base(), productId: "../admin" }), /Product ID/);
  assert.throws(() => cleanProduct({ ...base(), productId: "developer-zone", routeSection: "tools" }), /reserved/);
  assert.throws(() => cleanProduct({ ...base(), internalKey: "run-arbitrary-code" }), /supported internal/);
});

test("requires public HTTPS deployment URLs and exact iframe origin allowlisting", () => {
  assert.throws(() => safeHttpsUrl("http://example.com", "Deployment URL", false), /HTTPS/);
  assert.throws(() => safeHttpsUrl("https://user:pass@example.com", "Deployment URL", false), /public HTTPS/);
  assert.throws(() => safeHttpsUrl("https://localhost", "Deployment URL", false), /public HTTPS/);
  assert.throws(() => cleanProduct({ ...base(), integrationType: "iframe", deploymentUrl: "https://app.example.com", allowedOrigins: ["https://other.example.com"] }), /allowlist/);
  const result = cleanProduct({ ...base(), integrationType: "iframe", deploymentUrl: "https://app.example.com/path", allowedOrigins: ["https://app.example.com/anything"] });
  assert.deepEqual(result.allowedOrigins, ["https://app.example.com"]);
});

test("allows an unconfigured external draft, but requires deployment configuration before approval", () => {
  const draft = cleanProduct({ ...base(), integrationType: "deployed", deploymentUrl: "" });
  assert.equal(draft.deploymentUrl, "");
  assert.throws(() => cleanProduct({ ...base(), integrationType: "deployed" }, { requireDeploymentUrl: true }), /Deployment URL/);
  assert.throws(() => cleanProduct({ ...base(), integrationType: "iframe", deploymentUrl: "https://embed.example.com", allowedOrigins: [] }), /allowlist/);
});

test("validates GitHub repositories, roles and permission scopes", () => {
  assert.equal(safeRepository("https://github.com/owner/project.git"), "https://github.com/owner/project");
  assert.throws(() => safeRepository("https://github.com/owner/project/issues"), /github\.com\/owner\/repository/);
  assert.throws(() => cleanProduct({ ...base(), allowedRoles: ["superuser"] }), /access roles/);
  assert.throws(() => cleanProduct({ ...base(), permissions: ["database:admin"] }), /permission scopes/);
});

test("requires discovery placement for featured products", () => {
  assert.throws(() => cleanProduct({ ...base(), visibility: { featured: true } }), /visible in at least one section/);
  assert.equal(cleanProduct({ ...base(), visibility: { featured: true, tools: true } }).visibility.featured, true);
});

test("validates version submissions and optional GitHub references", () => {
  const result = cleanSubmission({ version: "1.2.0", repositoryUrl: "https://github.com/owner/app", branch: "release", pullRequestUrl: "https://github.com/owner/app/pull/18", commitSha: "a".repeat(40), documentationUrl: "https://github.com/owner/app/blob/main/README.md", summary: "Added the first module release." });
  assert.equal(result.version, "1.2.0");
  assert.equal(result.repositoryUrl, "https://github.com/owner/app");
  assert.throws(() => cleanSubmission({ version: "1.0", summary: "x" }), /semantic versioning/);
  assert.throws(() => cleanSubmission({ version: "1.0.0", summary: "x", commitSha: "not-a-sha" }), /Commit ID/);
  assert.throws(() => cleanSubmission({ version: "1.0.0", summary: "x", pullRequestUrl: "https://evil.example/pull/1" }), /pull request/);
});
