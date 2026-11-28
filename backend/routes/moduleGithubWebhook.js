const express = require("express");
const ModuleProduct = require("../models/ModuleProduct");
const ModuleSubmission = require("../models/ModuleSubmission");
const ModuleWebhookReceipt = require("../models/ModuleWebhookReceipt");
const { recordModuleAudit } = require("../services/moduleAudit");
const { verifyGithubSignature, getCheckStatus } = require("../services/githubWebhook");

const router = express.Router();
const ignored = (res, reason) => res.status(202).json({ success: true, ignored: reason });

router.post("/", async (req, res, next) => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ success: false, message: "GitHub webhook integration is not configured." });
  const rawBody = req.body;
  if (!verifyGithubSignature(rawBody, req.get("x-hub-signature-256"), secret)) return res.status(401).json({ success: false, message: "Invalid GitHub webhook signature." });

  const event = String(req.get("x-github-event") || "");
  const deliveryId = String(req.get("x-github-delivery") || "");
  if (!/^[a-z0-9-]{1,100}$/i.test(deliveryId)) return res.status(400).json({ success: false, message: "A valid GitHub delivery ID is required." });
  try {
    if (await ModuleWebhookReceipt.exists({ deliveryId })) return res.json({ success: true, duplicate: true });
  } catch (error) { return next(error); }
  let payload;
  try { payload = JSON.parse(rawBody.toString("utf8")); }
  catch { return res.status(400).json({ success: false, message: "Webhook body must be valid JSON." }); }
  const check = getCheckStatus(event, payload);
  if (!check) return ignored(res, "unsupported or incomplete check event");

  try {
    const submissions = await ModuleSubmission.find({ repositoryUrl: check.repositoryUrl, commitSha: check.commitSha }).limit(100);
    if (!submissions.length) return ignored(res, "commit does not match a submitted version");
    const matched = [];
    for (const submission of submissions) {
      const product = await ModuleProduct.findById(submission.product);
      if (!product) continue;
      submission.buildStatus = check.status;
      submission.buildConclusion = check.conclusion;
      submission.buildUpdatedAt = new Date();
      await submission.save();

      const versionMatchesCandidate = product.releaseCandidate?.version === submission.version && product.releaseCandidate?.commitSha === check.commitSha;
      const versionMatchesLive = product.approvedRelease?.version === submission.version && product.approvedRelease?.commitSha === check.commitSha;
      if (versionMatchesCandidate) product.releaseCandidate.buildStatus = check.status;
      if (versionMatchesLive) product.approvedRelease.buildStatus = check.status;
      const historyRelease = product.versionHistory.find(release => release.commitSha === check.commitSha && release.version === submission.version);
      if (historyRelease) historyRelease.buildStatus = check.status;
      if (versionMatchesCandidate || versionMatchesLive) product.lastBuildStatus = check.status;
      if (versionMatchesCandidate || versionMatchesLive || historyRelease) await product.save();
      matched.push({ product, submission });
    }
    if (!matched.length) return ignored(res, "no active product matches the submitted commit");
    try {
      await ModuleWebhookReceipt.create({ deliveryId, event, repositoryUrl: check.repositoryUrl, commitSha: check.commitSha, product: matched[0].product._id, submission: matched[0].submission._id });
    } catch (error) {
      if (error.code === 11000) return res.json({ success: true, duplicate: true });
      throw error;
    }
    for (const { product, submission } of matched) {
      await recordModuleAudit({ req: null, action: "github.check-status", product, submission, summary: `${submission.version} · ${check.status}${check.conclusion ? ` (${check.conclusion})` : ""}.` });
    }
    res.json({ success: true, status: check.status, updated: matched.length });
  } catch (error) { next(error); }
});

module.exports = router;
