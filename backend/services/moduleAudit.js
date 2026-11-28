const ModuleAuditEvent = require("../models/ModuleAuditEvent");

async function recordModuleAudit({ req, action, product, assignment, submission, summary = "" }) {
  try {
    await ModuleAuditEvent.create({
      product: product?._id || product,
      assignment: assignment?._id || assignment,
      submission: submission?._id || submission,
      actor: req?.user?._id,
      actorEmail: String(req?.user?.email || "").trim().toLowerCase(),
      actorRole: req?.user?.role || "",
      action,
      summary: String(summary).slice(0, 1000),
    });
  } catch (error) {
    console.error("Module audit write failed:", error.message);
  }
}

module.exports = { recordModuleAudit };
