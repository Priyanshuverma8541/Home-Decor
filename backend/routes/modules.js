const express = require("express");
const { protect, optionalProtect, adminOnly } = require("../middleware/auth");
const ModuleProduct = require("../models/ModuleProduct");
const DeveloperAssignment = require("../models/DeveloperAssignment");
const ModuleSubmission = require("../models/ModuleSubmission");
const ModuleAuditEvent = require("../models/ModuleAuditEvent");
const { cleanProduct, cleanSubmission } = require("../services/moduleRegistryValidation");
const { recordModuleAudit } = require("../services/moduleAudit");

const router = express.Router();
const fail = (res, status, message) => res.status(status).json({ success: false, message });
const validObjectId = value => /^[a-f0-9]{24}$/i.test(String(value || ""));
const cleanEmail = value => String(value || "").trim().toLowerCase();
const publicRelease = product => product.approvedRelease ? {
  version: product.approvedRelease.version,
  integrationType: product.approvedRelease.integrationType,
  internalKey: product.approvedRelease.internalKey,
  deploymentUrl: product.approvedRelease.deploymentUrl,
  allowedOrigins: product.approvedRelease.allowedOrigins,
} : null;
const publicProduct = product => ({
  productId: product.productId, name: product.name, description: product.description,
  logoUrl: product.logoUrl, thumbnailUrl: product.thumbnailUrl, category: product.category,
  routeSection: product.routeSection, frontendRoute: product.frontendRoute,
  visibility: product.visibility, authenticationRequired: product.authenticationRequired,
  allowedRoles: product.allowedRoles, permissions: product.permissions,
  publishedRelease: publicRelease(product), updatedAt: product.updatedAt,
});
const adminProduct = product => product.toObject ? product.toObject() : product;

function accessError(product, req, { requireDirectRoute = true } = {}) {
  if (!product?.isPublished || product.status !== "published" || !product.approvedRelease) return { status: 404, message: "This product is not published." };
  if (requireDirectRoute && !product.visibility?.directRoute) return { status: 404, message: "This product is not available by direct route." };
  if (product.authenticationRequired && !req.user) return { status: 401, message: "Sign in to open this product." };
  if (product.allowedRoles?.length && !product.allowedRoles.includes(req.user?.role)) return { status: 403, message: "Your account does not have access to this product." };
  return null;
}

function applyProductConfig(product, config) {
  for (const key of ["productId", "name", "description", "logoUrl", "thumbnailUrl", "category", "developer", "version", "integrationType", "internalKey", "repositoryUrl", "branch", "deploymentUrl", "allowedOrigins", "routeSection", "frontendRoute", "authenticationRequired", "allowedRoles", "permissions", "visibility"]) product[key] = config[key];
}

router.get("/discover/:placement", optionalProtect, async (req, res, next) => {
  const placement = String(req.params.placement || "");
  if (!["homepage", "tools", "games", "jobs", "networking"].includes(placement)) return fail(res, 400, "Unknown product placement.");
  try {
    const products = await ModuleProduct.find({ isPublished: true, status: "published", [`visibility.${placement}`]: true }).sort({ "visibility.featured": -1, updatedAt: -1 }).lean();
    const visible = products.filter(product => !accessError(product, req, { requireDirectRoute: false })).map(publicProduct);
    res.json({ success: true, products: visible });
  } catch (error) { next(error); }
});

router.get("/resolve/:section/:productId", optionalProtect, async (req, res, next) => {
  try {
    const product = await ModuleProduct.findOne({ productId: String(req.params.productId).toLowerCase() });
    if (!product || product.routeSection !== req.params.section) return fail(res, 404, "Product route not found.");
    const denied = accessError(product, req);
    if (denied) return fail(res, denied.status, denied.message);
    res.json({ success: true, product: publicProduct(product) });
  } catch (error) { next(error); }
});

router.get("/developer/assignments", protect, async (req, res, next) => {
  const email = cleanEmail(req.user?.email);
  if (!email) return fail(res, 403, "A Savitri Livings account with an email address is required for developer assignments.");
  try {
    const assignments = await DeveloperAssignment.find({ developerEmail: email, status: { $nin: ["cancelled"] } }).populate("product", "productId name description category version status frontendRoute integrationType repositoryUrl branch").sort({ deadline: 1, updatedAt: -1 }).lean();
    res.json({ success: true, assignments });
  } catch (error) { next(error); }
});

router.patch("/developer/assignments/:id", protect, async (req, res, next) => {
  if (!validObjectId(req.params.id)) return fail(res, 404, "Assignment not found.");
  if (!["assigned", "in-development"].includes(req.body?.status)) return fail(res, 400, "Developers can mark an assigned task as in development.");
  try {
    const assignment = await DeveloperAssignment.findOne({ _id: req.params.id, developerEmail: cleanEmail(req.user?.email), status: { $in: ["assigned", "in-development", "changes-requested"] } });
    if (!assignment) return fail(res, 404, "Assignment not found.");
    const product = await ModuleProduct.findById(assignment.product);
    if (!product || ["archived", "suspended"].includes(product.status)) return fail(res, 409, "This product is archived or suspended; contact the administrator before continuing.");
    assignment.status = req.body.status; await assignment.save();
    if (product && !product.isPublished) { product.status = "in-development"; await product.save(); }
    await recordModuleAudit({ req, action: "developer.progress-updated", product, assignment, summary: `Task moved to ${assignment.status}.` });
    res.json({ success: true, assignment });
  } catch (error) { next(error); }
});

router.post("/developer/assignments/:id/submissions", protect, async (req, res, next) => {
  if (!validObjectId(req.params.id)) return fail(res, 404, "Assignment not found.");
  const email = cleanEmail(req.user?.email);
  try {
    const assignment = await DeveloperAssignment.findOne({ _id: req.params.id, developerEmail: email, status: { $in: ["assigned", "in-development", "changes-requested"] } });
    if (!assignment) return fail(res, 404, "Assignment not found.");
    const product = await ModuleProduct.findById(assignment.product);
    if (!product) return fail(res, 404, "Assigned product not found.");
    if (["archived", "suspended"].includes(product.status)) return fail(res, 409, "This product is archived or suspended; the administrator must restore it before a submission can be accepted.");
    const values = cleanSubmission({ ...req.body, repositoryUrl: req.body?.repositoryUrl || assignment.repositoryUrl, branch: req.body?.branch || assignment.branch });
    const submission = await ModuleSubmission.create({ product: product._id, assignment: assignment._id, developerName: assignment.developerName, developerEmail: email, ...values });
    assignment.status = "submitted"; await assignment.save();
    if (!product.isPublished) product.status = "submitted";
    product.lastBuildStatus = "not-run"; await product.save();
    await recordModuleAudit({ req, action: "submission.created", product, assignment, submission, summary: `Submitted version ${submission.version}.` });
    res.status(201).json({ success: true, submission: { _id: submission._id, version: submission.version, status: submission.status, createdAt: submission.createdAt } });
  } catch (error) { if (error.message && !error.status) return fail(res, 400, error.message); next(error); }
});

router.get("/admin", protect, adminOnly, async (_req, res, next) => {
  try {
    const [total, published, pending, development, suspended, archived, submissions, assignments, recent] = await Promise.all([
      ModuleProduct.countDocuments({ status: { $ne: "archived" } }), ModuleProduct.countDocuments({ isPublished: true, status: "published" }),
      ModuleSubmission.countDocuments({ status: { $in: ["submitted", "under-review"] } }),
      ModuleProduct.countDocuments({ status: { $in: ["assigned", "in-development", "changes-requested"] } }),
      ModuleProduct.countDocuments({ status: "suspended" }), ModuleProduct.countDocuments({ status: "archived" }),
      ModuleSubmission.find().populate("product", "productId name").sort({ createdAt: -1 }).limit(50).lean(),
      DeveloperAssignment.find().populate("product", "productId name").sort({ updatedAt: -1 }).limit(100).lean(),
      ModuleProduct.find().sort({ updatedAt: -1 }).limit(8).lean(),
    ]);
    res.json({ success: true, stats: { total, published, pending, development, suspended, archived }, submissions, assignments, recent });
  } catch (error) { next(error); }
});

router.get("/admin/products", protect, adminOnly, async (_req, res, next) => {
  try { res.json({ success: true, products: await ModuleProduct.find().sort({ updatedAt: -1 }).lean() }); } catch (error) { next(error); }
});

router.get("/admin/audit", protect, adminOnly, async (_req, res, next) => {
  try {
    const events = await ModuleAuditEvent.find().populate("product", "productId name").sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, events });
  } catch (error) { next(error); }
});

router.post("/admin/products", protect, adminOnly, async (req, res, next) => {
  try {
    const config = cleanProduct(req.body);
    if (await ModuleProduct.exists({ productId: config.productId })) return fail(res, 409, "That product ID is already registered.");
    if (await ModuleProduct.exists({ frontendRoute: config.frontendRoute })) return fail(res, 409, "That frontend route is already registered.");
    const product = await ModuleProduct.create({ ...config, status: "draft", createdBy: req.user._id, updatedBy: req.user._id });
    await recordModuleAudit({ req, action: "product.created", product, summary: `Registered ${product.name}.` });
    res.status(201).json({ success: true, product: adminProduct(product) });
  } catch (error) { if (error.code === 11000) return fail(res, 409, "Product ID or frontend route is already registered."); if (error.message) return fail(res, 400, error.message); next(error); }
});

router.patch("/admin/products/:id", protect, adminOnly, async (req, res, next) => {
  if (!validObjectId(req.params.id)) return fail(res, 404, "Product not found.");
  try {
    const product = await ModuleProduct.findById(req.params.id);
    if (!product) return fail(res, 404, "Product not found.");
    if (["archived", "suspended"].includes(product.status)) return fail(res, 409, "Restore this product before assigning new work.");
    const config = cleanProduct({ ...product.toObject(), ...req.body, developer: { ...(product.developer || {}), ...(req.body.developer || {}) }, visibility: { ...(product.visibility || {}), ...(req.body.visibility || {}) } });
    if (config.productId !== product.productId) return fail(res, 400, "Product ID is permanent after registration.");
    applyProductConfig(product, config);
    product.updatedBy = req.user._id;
    if (product.isPublished) { product.status = "published"; product.version = product.approvedRelease?.version || product.version; }
    else if (!["archived", "suspended"].includes(product.status)) product.status = "in-development";
    await product.save();
    await recordModuleAudit({ req, action: "product.updated", product, summary: `Updated ${product.name} configuration.` });
    res.json({ success: true, product: adminProduct(product) });
  } catch (error) { if (error.code === 11000) return fail(res, 409, "That frontend route is already registered."); if (error.message) return fail(res, 400, error.message); next(error); }
});

router.post("/admin/products/:id/assignments", protect, adminOnly, async (req, res, next) => {
  if (!validObjectId(req.params.id)) return fail(res, 404, "Product not found.");
  try {
    const product = await ModuleProduct.findById(req.params.id);
    if (!product) return fail(res, 404, "Product not found.");
    const developerName = String(req.body.developerName || "").trim();
    const developerEmail = cleanEmail(req.body.developerEmail);
    const taskTitle = String(req.body.taskTitle || "").trim();
    const requirements = String(req.body.requirements || "").trim();
    if (!developerName || developerName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(developerEmail) || developerEmail.length > 200 || !taskTitle || taskTitle.length > 180 || !requirements || requirements.length > 8000) return fail(res, 400, "Add a valid developer name and email, task title, and requirements (maximum 8,000 characters).");
    const deadline = req.body.deadline ? new Date(req.body.deadline) : null;
    if (deadline && Number.isNaN(deadline.getTime())) return fail(res, 400, "Enter a valid deadline.");
    const assignment = await DeveloperAssignment.create({ product: product._id, developerName, developerEmail, taskTitle, requirements, deadline, modulePath: String(req.body.modulePath || "").slice(0, 500), repositoryUrl: product.repositoryUrl, branch: product.branch, assignedBy: req.user._id });
    if (!product.isPublished) { product.status = "assigned"; await product.save(); }
    await recordModuleAudit({ req, action: "developer.assigned", product, assignment, summary: `Assigned ${developerName} to ${taskTitle}.` });
    res.status(201).json({ success: true, assignment });
  } catch (error) { next(error); }
});

router.patch("/admin/assignments/:id", protect, adminOnly, async (req, res, next) => {
  if (!validObjectId(req.params.id)) return fail(res, 404, "Assignment not found.");
  const allowed = new Set(["assigned", "in-development", "under-review", "approved", "rejected", "completed", "cancelled"]);
  if (!allowed.has(req.body.status)) return fail(res, 400, "Choose a valid assignment status.");
  try {
    const assignment = await DeveloperAssignment.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status, ...(req.body.feedback !== undefined ? { feedback: String(req.body.feedback).slice(0, 4000) } : {}) } }, { new: true, runValidators: true }).populate("product", "productId name");
    if (!assignment) return fail(res, 404, "Assignment not found.");
    await recordModuleAudit({ req, action: "assignment.updated", product: assignment.product?._id, assignment, summary: `Admin set task status to ${assignment.status}.` });
    res.json({ success: true, assignment });
  } catch (error) { next(error); }
});

router.get("/admin/submissions", protect, adminOnly, async (req, res, next) => {
  try {
    const filter = req.query.status && ["submitted", "under-review", "changes-requested", "approved", "rejected"].includes(req.query.status) ? { status: req.query.status } : {};
    const submissions = await ModuleSubmission.find(filter).populate("product", "productId name status isPublished").populate("assignment", "taskTitle requirements developerEmail status").sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, submissions });
  } catch (error) { next(error); }
});

router.patch("/admin/submissions/:id/review", protect, adminOnly, async (req, res, next) => {
  if (!validObjectId(req.params.id)) return fail(res, 404, "Submission not found.");
  const decision = req.body.decision;
  if (!["under-review", "changes-requested", "approved", "rejected"].includes(decision)) return fail(res, 400, "Choose a valid review decision.");
  const feedback = String(req.body.feedback || "").trim().slice(0, 4000);
  if (["changes-requested", "rejected"].includes(decision) && !feedback) return fail(res, 400, "Add review feedback for this decision.");
  try {
    const submission = await ModuleSubmission.findById(req.params.id);
    if (!submission) return fail(res, 404, "Submission not found.");
    const product = await ModuleProduct.findById(submission.product);
    if (!product) return fail(res, 404, "Product not found.");
    if (["archived", "suspended"].includes(product.status)) return fail(res, 409, "Restore this product before reviewing or publishing submissions.");
    const assignment = await DeveloperAssignment.findById(submission.assignment);
    if (decision === "approved" && submission.status === "approved") return fail(res, 409, "This submission has already been approved. Submit a new version for another release.");
    if (decision === "approved" && product.versionHistory.some(item => item.version === submission.version && item.status !== "rejected")) return fail(res, 409, "This version is already present in release history. Submit a new semantic version.");
    const releaseConfig = decision === "approved" ? cleanProduct(product.toObject(), { requireDeploymentUrl: true }) : null;
    submission.status = decision; submission.reviewFeedback = feedback; submission.reviewedBy = req.user._id; submission.reviewedAt = new Date(); await submission.save();
    if (assignment) { assignment.status = decision === "under-review" ? "under-review" : decision; assignment.feedback = feedback; await assignment.save(); }
    await recordModuleAudit({ req, action: `submission.${decision}`, product, assignment, submission, summary: `Version ${submission.version}: ${decision}.` });
    if (decision === "approved") {
      const release = { version: submission.version, integrationType: releaseConfig.integrationType, internalKey: releaseConfig.internalKey, deploymentUrl: releaseConfig.deploymentUrl, allowedOrigins: releaseConfig.allowedOrigins, repositoryUrl: submission.repositoryUrl || releaseConfig.repositoryUrl, branch: submission.branch || releaseConfig.branch, commitSha: submission.commitSha, changelog: submission.summary, buildStatus: submission.buildStatus, approvedAt: new Date(), approvedBy: req.user._id, status: "approved" };
      if (!product.isPublished) { product.repositoryUrl = release.repositoryUrl; product.branch = release.branch; }
      product.releaseCandidate = release;
      product.status = product.isPublished ? "published" : "approved";
      product.versionHistory.push(release);
      if (product.versionHistory.length > 30) product.versionHistory = product.versionHistory.slice(-30);
      product.lastBuildStatus = release.buildStatus || "not-run"; await product.save();
    } else if (!product.isPublished) {
      product.status = decision === "under-review" ? "under-review" : decision;
      await product.save();
    }
    res.json({ success: true, submission });
  } catch (error) { if (error.message && !error.status) return fail(res, 400, error.message); next(error); }
});

router.post("/admin/products/:id/publish", protect, adminOnly, async (req, res, next) => {
  if (!validObjectId(req.params.id)) return fail(res, 404, "Product not found.");
  try {
    const product = await ModuleProduct.findById(req.params.id);
    if (!product) return fail(res, 404, "Product not found.");
    if (!product.releaseCandidate || !["approved", "published"].includes(product.releaseCandidate.status)) return fail(res, 409, "Review and approve a developer submission before publishing.");
    const candidate = product.releaseCandidate.toObject ? product.releaseCandidate.toObject() : product.releaseCandidate;
    if (["pending", "failed"].includes(candidate.buildStatus)) return fail(res, 409, `The submitted commit has a ${candidate.buildStatus} GitHub check status. Wait for checks to finish and resolve any failures before publishing.`);
    const approvedVersion = product.versionHistory.find(item => item.version === candidate.version && item.status === "approved");
    if (approvedVersion) { approvedVersion.status = "published"; approvedVersion.publishedAt = new Date(); }
    candidate.status = "published"; candidate.publishedAt = new Date();
    product.approvedRelease = candidate;
    product.version = candidate.version; product.integrationType = candidate.integrationType; product.internalKey = candidate.internalKey;
    product.deploymentUrl = candidate.deploymentUrl; product.allowedOrigins = candidate.allowedOrigins;
    product.repositoryUrl = candidate.repositoryUrl; product.branch = candidate.branch;
    product.isPublished = true; product.status = "published";
    product.lastBuildStatus = candidate.buildStatus || "not-run";
    await product.save();
    await recordModuleAudit({ req, action: "product.published", product, summary: `Published version ${product.version}; build status: ${product.lastBuildStatus}.` });
    res.json({ success: true, product: adminProduct(product) });
  } catch (error) { next(error); }
});

router.post("/admin/products/:id/unpublish", protect, adminOnly, async (req, res, next) => {
  if (!validObjectId(req.params.id)) return fail(res, 404, "Product not found.");
  try {
    const product = await ModuleProduct.findById(req.params.id);
    if (!product) return fail(res, 404, "Product not found.");
    product.isPublished = false; if (product.status === "published") product.status = product.releaseCandidate ? "approved" : "draft"; await product.save();
    await recordModuleAudit({ req, action: "product.unpublished", product, summary: `Unpublished ${product.name}.` });
    res.json({ success: true, product: adminProduct(product) });
  } catch (error) { next(error); }
});

router.post("/admin/products/:id/restore", protect, adminOnly, async (req, res, next) => {
  if (!validObjectId(req.params.id)) return fail(res, 404, "Product not found.");
  try {
    const product = await ModuleProduct.findById(req.params.id);
    if (!product) return fail(res, 404, "Product not found.");
    if (product.status !== "suspended" || !product.approvedRelease?.version) return fail(res, 409, "Only a suspended product with a prior published release can be restored.");
    product.isPublished = true; product.status = "published";
    product.releaseCandidate = { ...product.approvedRelease.toObject(), status: "published" };
    await product.save();
    await recordModuleAudit({ req, action: "product.restored", product, summary: `Restored last stable release ${product.approvedRelease.version}.` });
    res.json({ success: true, product: adminProduct(product) });
  } catch (error) { next(error); }
});

router.post("/admin/products/:id/suspend", protect, adminOnly, async (req, res, next) => {
  if (!validObjectId(req.params.id)) return fail(res, 404, "Product not found.");
  try {
    const product = await ModuleProduct.findById(req.params.id);
    if (!product) return fail(res, 404, "Product not found.");
    product.isPublished = false; product.status = "suspended"; await product.save();
    await recordModuleAudit({ req, action: "product.suspended", product, summary: `Suspended ${product.name}.` });
    res.json({ success: true, product: adminProduct(product) });
  } catch (error) { next(error); }
});

router.post("/admin/products/:id/rollback", protect, adminOnly, async (req, res, next) => {
  if (!validObjectId(req.params.id)) return fail(res, 404, "Product not found.");
  const version = String(req.body?.version || "").trim();
  try {
    const product = await ModuleProduct.findById(req.params.id);
    if (!product) return fail(res, 404, "Product not found.");
    const release = product.versionHistory.find(item => item.version === version && ["approved", "published"].includes(item.status));
    if (!release) return fail(res, 404, "No approved release exists for that version.");
    product.versionHistory.forEach(item => { if (item.status === "published") item.status = "approved"; });
    release.status = "published";
    product.approvedRelease = { ...release.toObject(), status: "published", publishedAt: new Date() };
    product.version = release.version; product.integrationType = release.integrationType; product.internalKey = release.internalKey;
    product.deploymentUrl = release.deploymentUrl; product.allowedOrigins = release.allowedOrigins;
    product.repositoryUrl = release.repositoryUrl; product.branch = release.branch;
    product.releaseCandidate = { ...release.toObject(), status: "published", publishedAt: new Date() };
    product.isPublished = true; product.status = "published"; await product.save();
    await recordModuleAudit({ req, action: "product.rollback", product, summary: `Rolled back to ${version}.` });
    res.json({ success: true, product: adminProduct(product) });
  } catch (error) { next(error); }
});

router.post("/admin/products/:id/archive", protect, adminOnly, async (req, res, next) => {
  if (!validObjectId(req.params.id)) return fail(res, 404, "Product not found.");
  try {
    const product = await ModuleProduct.findById(req.params.id);
    if (!product) return fail(res, 404, "Product not found.");
    product.isPublished = false; product.status = "archived"; await product.save();
    await recordModuleAudit({ req, action: "product.archived", product, summary: `Archived ${product.name}.` });
    res.json({ success: true, product: adminProduct(product) });
  } catch (error) { next(error); }
});

module.exports = router;
