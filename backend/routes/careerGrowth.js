const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/auth");
const CareerCompany = require("../models/CareerCompany");
const CareerJob = require("../models/CareerJob");
const CareerApplication = require("../models/CareerApplication");
const CareerProfile = require("../models/CareerProfile");
const starterCompanies = require("../data/careerCompanySeed.json");

router.use(protect);
const isCareerUser = (req, res, next) => {
  const allowedEmail = String(process.env.ARCHANA_CAREER_EMAIL || "").trim().toLowerCase();
  const userEmail = String(req.user?.email || "").trim().toLowerCase();
  if (req.user?.role === "admin" || Boolean(allowedEmail && userEmail === allowedEmail)) return next();
  return res.status(403).json({ success: false, message: "Career workspace access required" });
};
router.use(isCareerUser);

const companyFields = ["name", "sector", "description", "officialWebsite", "careersUrl", "linkedinCompanyUrl", "officialContactUrl", "officeLocations", "roleTypes", "sourceCheckedAt", "sourceNotes", "active"];
const jobFields = ["companyId", "companyName", "title", "location", "workMode", "experienceMinYears", "experienceMaxYears", "qualification", "skills", "employmentType", "description", "applicationUrl", "sourceUrl", "sourceType", "publishedAt", "deadlineAt", "verifiedAt", "status"];
const applicationFields = ["jobId", "companyId", "companyName", "roleTitle", "location", "applicationUrl", "source", "stage", "appliedAt", "nextFollowUpAt", "deadlineAt", "notes"];
const pick = (body, fields) => Object.fromEntries(fields.filter((key) => Object.hasOwn(body || {}, key)).map((key) => [key, body[key]]));
const fail = (res, status, message) => res.status(status).json({ success: false, message });
const validHttpUrl = (value) => { if (!value) return true; try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; } };

router.get("/profile", async (req, res, next) => {
  try { const profile = await CareerProfile.findOne({ profileKey: "archana-singh" }).lean(); res.json({ success: true, profile }); }
  catch (error) { next(error); }
});
router.post("/profile/import-resume", adminOnly, async (req, res, next) => {
  try {
    const privateContacts = Object.fromEntries([["email", process.env.ARCHANA_CAREER_EMAIL], ["phone", process.env.ARCHANA_CAREER_PHONE]].filter(([, value]) => value).map(([key, value]) => [key, value]));
    const profile = await CareerProfile.findOneAndUpdate({ profileKey: "archana-singh" }, { $set: { ...require("../data/careerProfileSeed.json"), ...privateContacts, updatedBy: req.user._id } }, { new: true, upsert: true, runValidators: true });
    res.json({ success: true, profile });
  } catch (error) { next(error); }
});

router.get("/summary", async (req, res, next) => {
  try {
    const ownerId = req.user.role === "admin" ? null : req.user._id;
    const [companies, openJobs, applications, followUps] = await Promise.all([
      CareerCompany.countDocuments({ active: true }),
      CareerJob.countDocuments({ status: "open" }),
      CareerApplication.countDocuments(ownerId ? { ownerId } : {}),
      CareerApplication.countDocuments({ ...(ownerId ? { ownerId } : {}), nextFollowUpAt: { $lt: new Date() }, stage: { $nin: ["closed", "rejected", "withdrawn"] } }),
    ]);
    res.json({ success: true, summary: { companies, openJobs, applications, overdueFollowUps: followUps, monitoring: "manual" } });
  } catch (error) { next(error); }
});

router.get("/companies", async (req, res, next) => {
  try { const companies = await CareerCompany.find(req.user.role === "admin" ? {} : { active: true }).sort({ name: 1 }).limit(500).lean(); res.json({ success: true, companies }); }
  catch (error) { next(error); }
});
router.post("/companies/import-starter", adminOnly, async (req, res, next) => {
  try {
    const ops = starterCompanies.map((company) => ({ updateOne: { filter: { name: company.name }, update: { $setOnInsert: { ...company, createdBy: req.user._id, updatedBy: req.user._id } }, upsert: true } }));
    const result = await CareerCompany.bulkWrite(ops, { ordered: false });
    res.json({ success: true, imported: result.upsertedCount, alreadyPresent: result.matchedCount, total: starterCompanies.length });
  } catch (error) { next(error); }
});
router.post("/companies", adminOnly, async (req, res, next) => {
  try {
    const data = pick(req.body, companyFields);
    if (!data.name) return fail(res, 400, "Company name is required");
    if (![data.officialWebsite, data.careersUrl, data.linkedinCompanyUrl, data.officialContactUrl].every(validHttpUrl)) return fail(res, 400, "Company links must use http or https");
    const company = await CareerCompany.create({ ...data, createdBy: req.user._id, updatedBy: req.user._id });
    res.status(201).json({ success: true, company });
  } catch (error) { if (error.code === 11000) return fail(res, 409, "That company is already in the directory"); next(error); }
});
router.patch("/companies/:id", adminOnly, async (req, res, next) => {
  try {
    const data = pick(req.body, companyFields);
    if (![data.officialWebsite, data.careersUrl, data.linkedinCompanyUrl, data.officialContactUrl].every(validHttpUrl)) return fail(res, 400, "Company links must use http or https");
    const company = await CareerCompany.findByIdAndUpdate(req.params.id, { $set: { ...data, updatedBy: req.user._id } }, { new: true, runValidators: true });
    if (!company) return fail(res, 404, "Company not found");
    res.json({ success: true, company });
  } catch (error) { next(error); }
});

router.get("/jobs", async (req, res, next) => {
  try {
    const query = req.user.role === "admin" ? {} : { status: "open", $or: [{ deadlineAt: { $exists: false } }, { deadlineAt: null }, { deadlineAt: { $gte: new Date() } }] };
    if (req.query.search) query.$text = { $search: String(req.query.search).slice(0, 100) };
    const jobs = await CareerJob.find(query).populate("companyId", "name officialWebsite careersUrl").sort({ verifiedAt: -1 }).limit(300).lean();
    res.json({ success: true, jobs });
  } catch (error) { next(error); }
});
router.post("/jobs", adminOnly, async (req, res, next) => {
  try {
    const data = pick(req.body, jobFields);
    if (!data.companyName || !data.title || !data.applicationUrl) return fail(res, 400, "Company, role title and application link are required");
    if (!validHttpUrl(data.applicationUrl) || !validHttpUrl(data.sourceUrl)) return fail(res, 400, "Job links must use http or https");
    const job = await CareerJob.create({ ...data, createdBy: req.user._id, updatedBy: req.user._id });
    res.status(201).json({ success: true, job });
  } catch (error) { next(error); }
});
router.patch("/jobs/:id", adminOnly, async (req, res, next) => {
  try {
    const data = pick(req.body, jobFields);
    if (!validHttpUrl(data.applicationUrl) || !validHttpUrl(data.sourceUrl)) return fail(res, 400, "Job links must use http or https");
    const job = await CareerJob.findByIdAndUpdate(req.params.id, { $set: { ...data, updatedBy: req.user._id } }, { new: true, runValidators: true });
    if (!job) return fail(res, 404, "Career listing not found");
    res.json({ success: true, job });
  } catch (error) { next(error); }
});

router.get("/applications", async (req, res, next) => {
  try {
    const query = req.user.role === "admin" && req.query.ownerId ? { ownerId: req.query.ownerId } : req.user.role === "admin" ? {} : { ownerId: req.user._id };
    if (req.query.stage) query.stage = req.query.stage;
    const applications = await CareerApplication.find(query).select("+notes").populate("jobId", "title location applicationUrl deadlineAt").sort({ nextFollowUpAt: 1, updatedAt: -1 }).limit(300).lean();
    res.json({ success: true, applications });
  } catch (error) { next(error); }
});
router.post("/applications", async (req, res, next) => {
  try {
    const data = pick(req.body, applicationFields);
    if (!data.companyName || !data.roleTitle) return fail(res, 400, "Company and role title are required");
    if (!validHttpUrl(data.applicationUrl)) return fail(res, 400, "Application link must use http or https");
    const application = await CareerApplication.create({ ...data, ownerId: req.user._id, createdBy: req.user._id, updatedBy: req.user._id });
    res.status(201).json({ success: true, application });
  } catch (error) { next(error); }
});
router.patch("/applications/:id", async (req, res, next) => {
  try {
    const data = pick(req.body, applicationFields);
    if (!validHttpUrl(data.applicationUrl)) return fail(res, 400, "Application link must use http or https");
    const query = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, ownerId: req.user._id };
    const application = await CareerApplication.findOneAndUpdate(query, { $set: { ...data, updatedBy: req.user._id } }, { new: true, runValidators: true }).select("+notes");
    if (!application) return fail(res, 404, "Application not found");
    res.json({ success: true, application });
  } catch (error) { next(error); }
});

module.exports = router;
