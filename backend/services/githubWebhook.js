const crypto = require("crypto");
const { safeRepository } = require("./moduleRegistryValidation");

function verifyGithubSignature(rawBody, signatureHeader, secret) {
  if (!Buffer.isBuffer(rawBody) || !secret || typeof signatureHeader !== "string") return false;
  const match = /^sha256=([a-f0-9]{64})$/i.exec(signatureHeader);
  if (!match) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest();
  const supplied = Buffer.from(match[1], "hex");
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

function getCheckStatus(event, payload) {
  const repoValue = payload?.repository?.html_url;
  const action = String(payload?.action || "");
  let sha = "";
  let status = "";
  let conclusion = "";

  if (event === "check_suite") {
    sha = String(payload?.check_suite?.head_sha || "");
    if (["requested", "rerequested"].includes(action)) status = "pending";
    if (action === "completed") {
      conclusion = String(payload?.check_suite?.conclusion || "");
      status = conclusion === "success" ? "passed" : "failed";
    }
  } else return null;

  if (!status || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(sha)) return null;
  let repositoryUrl;
  try { repositoryUrl = safeRepository(repoValue); } catch { return null; }
  return { repositoryUrl, commitSha: sha.toLowerCase(), status, conclusion, action };
}

module.exports = { verifyGithubSignature, getCheckStatus };
