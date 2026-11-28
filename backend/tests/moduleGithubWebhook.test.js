const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { verifyGithubSignature, getCheckStatus } = require("../services/githubWebhook");

const secret = "test-webhook-secret-not-for-production";
const sha = "0123456789abcdef0123456789abcdef01234567";

test("verifies GitHub HMAC signatures against the exact raw request bytes", () => {
  const body = Buffer.from('{"action":"completed"}');
  const signature = `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
  assert.equal(verifyGithubSignature(body, signature, secret), true);
  assert.equal(verifyGithubSignature(Buffer.from('{"action":"requested"}'), signature, secret), false);
  assert.equal(verifyGithubSignature(body, signature, ""), false);
  assert.equal(verifyGithubSignature(body, "sha256=not-hex", secret), false);
  assert.equal(verifyGithubSignature("not-a-buffer", signature, secret), false);
});

test("maps aggregate check suite events to pending, passed, or failed", () => {
  const base = { repository: { html_url: "https://github.com/owner/repository" }, check_suite: { head_sha: sha } };
  assert.deepEqual(getCheckStatus("check_suite", { ...base, action: "requested" }), { repositoryUrl: "https://github.com/owner/repository", commitSha: sha, status: "pending", conclusion: "", action: "requested" });
  assert.equal(getCheckStatus("check_suite", { ...base, action: "completed", check_suite: { head_sha: sha, conclusion: "success" } }).status, "passed");
  assert.equal(getCheckStatus("check_suite", { ...base, action: "completed", check_suite: { head_sha: sha, conclusion: "failure" } }).status, "failed");
  assert.equal(getCheckStatus("check_run", { action: "completed" }), null);
});

test("ignores malformed SHAs and unregistered repository URL shapes", () => {
  assert.equal(getCheckStatus("check_suite", { action: "requested", repository: { html_url: "https://github.com/owner/repository" }, check_suite: { head_sha: "abc" } }), null);
  assert.equal(getCheckStatus("check_suite", { action: "requested", repository: { html_url: "https://evil.example/owner/repository" }, check_suite: { head_sha: sha } }), null);
});
