const mongoose = require("mongoose");
const GrowthSettings = require("./models/GrowthSettings");
const GrowthCandidate = require("./models/GrowthCandidate");
const GrowthProfile = require("./models/GrowthProfile");
const TrustCompany = require("./models/TrustCompany");
const TrustJob = require("./models/TrustJob");
const TrustApplication = require("./models/TrustApplication");

const DEFAULT_SETTINGS = {
  key: "growth-livings", enabled: true, title: "Growth Livings",
  headline: "Build Your Professional Identity. Discover Opportunities. Grow Together.",
  description: "A connected ecosystem for professional portfolios, networking, recruitment and career opportunities.",
  products: {
    resume: { title: "Resume / Portfolio", description: "Build a personal portfolio website with live templates, Gemini writing support and one-click publishing.", url: "/portfolio-builder", status: "active", previewImage: "" },
    trustThem: { title: "Trust Them", description: "Connect professionals, recruiters, companies and candidates around career opportunities.", url: "", status: "in-development", previewImage: "" },
  },
  seo: { title: "Growth Livings | Savitri Livings", description: "Professional portfolios, connections and career opportunities from Growth Livings." },
};

const text = (value, max, fallback = "") => typeof value === "string" ? value.trim().slice(0, max) : fallback;
const safeUrl = (value, { allowPath = false } = {}) => {
  const input = text(value, 1000);
  if (!input) return "";
  if (allowPath && input.startsWith("/") && !input.startsWith("//")) return input;
  try { const url = new URL(input); return ["https:", "http:"].includes(url.protocol) ? url.toString() : ""; } catch { return ""; }
};
const fail = (res, status, message) => res.status(status).json({ success: false, message });
const validSlug = (value) => /^[a-z0-9-]{2,100}$/.test(String(value || ""));
const settingsValue = async () => {
  const saved = await GrowthSettings.findOne({ key: "growth-livings" }).lean();
  const settings = saved ? { ...DEFAULT_SETTINGS, ...saved, products: { ...DEFAULT_SETTINGS.products, ...saved.products }, seo: { ...DEFAULT_SETTINGS.seo, ...saved.seo } } : DEFAULT_SETTINGS;
  if (!settings.products.resume.url) settings.products.resume.url = "/portfolio-builder";
  if (settings.products.resume.status === "in-development") settings.products.resume.status = "active";
  return settings;
};
const publicProfile = (candidate) => ({ slug: candidate.slug, name: candidate.displayName, headline: candidate.headline, ...(candidate.publicProfile || {}), ...(candidate.resumeUrl ? { resumeUrl: candidate.resumeUrl } : {}) });

exports.getPublicSettings = async (_req, res, next) => {
  try { const settings = await settingsValue(); res.json({ success: true, settings }); } catch (error) { next(error); }
};

exports.getAdminSettings = async (_req, res, next) => {
  try { res.json({ success: true, settings: await settingsValue() }); } catch (error) { next(error); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const input = req.body || {};
    const products = {};
    for (const key of ["resume", "trustThem"]) {
      const current = input.products?.[key] || {};
      products[key] = {
        title: text(current.title, 100), description: text(current.description, 1200), url: safeUrl(current.url, { allowPath: true }),
        status: ["active", "in-development", "coming-soon", "disabled"].includes(current.status) ? current.status : "coming-soon",
        previewImage: safeUrl(current.previewImage),
      };
    }
    const settings = await GrowthSettings.findOneAndUpdate({ key: "growth-livings" }, { $set: {
      enabled: input.enabled !== false,
      title: text(input.title, 100, DEFAULT_SETTINGS.title),
      headline: text(input.headline, 220, DEFAULT_SETTINGS.headline),
      description: text(input.description, 1000, DEFAULT_SETTINGS.description),
      products,
      seo: { title: text(input.seo?.title, 180, DEFAULT_SETTINGS.seo.title), description: text(input.seo?.description, 320, DEFAULT_SETTINGS.seo.description) },
    } }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    res.json({ success: true, settings });
  } catch (error) { next(error); }
};

exports.getPublicCandidate = async (req, res, next) => {
  try {
    const candidate = await GrowthCandidate.findOne({ slug: req.params.slug, visibility: "published", candidateApprovedAt: { $ne: null } }).select("slug displayName headline publicProfile resumeUrl");
    if (!candidate) return fail(res, 404, "This portfolio is not published.");
    res.json({ success: true, profile: publicProfile(candidate) });
  } catch (error) { next(error); }
};

exports.listPublicCandidates = async (_req, res, next) => {
  try {
    const candidates = await GrowthCandidate.find({ visibility: "published", candidateApprovedAt: { $ne: null } }).select("slug displayName headline publicProfile").sort({ displayName: 1 }).limit(100);
    res.json({ success: true, candidates: candidates.map((candidate) => publicProfile(candidate)) });
  } catch (error) { next(error); }
};

exports.listAdminCandidates = async (_req, res, next) => {
  try {
    const candidates = await GrowthCandidate.find().select("+ownerUserId +candidateApprovedAt +privateContact +resumeUrl").populate("ownerUserId", "fullName email").sort({ updatedAt: -1 }).limit(200);
    res.json({ success: true, candidates });
  } catch (error) { next(error); }
};

exports.createCandidate = async (req, res, next) => {
  try {
    const { slug, displayName, ownerEmail } = req.body || {};
    if (!validSlug(slug) || !text(displayName, 120)) return fail(res, 400, "A valid candidate slug and display name are required.");
    let ownerUserId = null;
    if (ownerEmail) {
      const User = require("../../models/User");
      const owner = await User.findOne({ email: text(ownerEmail, 254).toLowerCase() }).select("_id");
      if (!owner) return fail(res, 404, "Create the candidate's Savitri account first, then link it here.");
      ownerUserId = owner._id;
    }
    const candidate = await GrowthCandidate.create({ slug: slug.toLowerCase(), displayName: text(displayName, 120), ownerUserId, visibility: "draft" });
    res.status(201).json({ success: true, candidate });
  } catch (error) { if (error.code === 11000) return fail(res, 409, "That candidate slug is already registered."); next(error); }
};

exports.updateCandidate = async (req, res, next) => {
  try {
    const input = req.body || {};
    const update = {};
    if (input.displayName !== undefined) update.displayName = text(input.displayName, 120);
    if (input.headline !== undefined) update.headline = text(input.headline, 220);
    if (input.publicProfile !== undefined && input.publicProfile && typeof input.publicProfile === "object" && !Array.isArray(input.publicProfile)) update.publicProfile = input.publicProfile;
    if (input.privateContact !== undefined && input.privateContact && typeof input.privateContact === "object" && !Array.isArray(input.privateContact)) update.privateContact = input.privateContact;
    if (input.resumeUrl !== undefined) update.resumeUrl = safeUrl(input.resumeUrl);
    if (["draft", "published", "archived"].includes(input.visibility)) update.visibility = input.visibility;
    if (input.ownerEmail !== undefined) {
      const email = text(input.ownerEmail, 254).toLowerCase();
      if (!email) update.ownerUserId = null;
      else {
        const User = require("../../models/User");
        const owner = await User.findOne({ email }).select("_id");
        if (!owner) return fail(res, 404, "Create the candidate's Savitri account first, then link it here.");
        update.ownerUserId = owner._id;
      }
    }
    const candidate = await GrowthCandidate.findOneAndUpdate({ slug: req.params.slug }, { $set: update }, { new: true, runValidators: true }).select("+ownerUserId +candidateApprovedAt +privateContact +resumeUrl").populate("ownerUserId", "fullName email");
    if (!candidate) return fail(res, 404, "Candidate not found.");
    res.json({ success: true, candidate });
  } catch (error) { next(error); }
};

exports.listMyPortfolios = async (req, res, next) => {
  try {
    const candidates = await GrowthCandidate.find({ ownerUserId: req.user._id }).select("slug displayName headline publicProfile visibility +candidateApprovedAt +resumeUrl");
    res.json({ success: true, candidates });
  } catch (error) { next(error); }
};

exports.approveMyPortfolio = async (req, res, next) => {
  try {
    const candidate = await GrowthCandidate.findOne({ slug: req.params.slug, ownerUserId: req.user._id }).select("+ownerUserId +candidateApprovedAt");
    if (!candidate) return fail(res, 404, "No portfolio is linked to this account.");
    candidate.candidateApprovedAt = new Date();
    await candidate.save();
    res.json({ success: true, candidate: { slug: candidate.slug, candidateApprovedAt: candidate.candidateApprovedAt, visibility: candidate.visibility } });
  } catch (error) { next(error); }
};

exports.withdrawPortfolioApproval = async (req, res, next) => {
  try {
    const candidate = await GrowthCandidate.findOne({ slug: req.params.slug, ownerUserId: req.user._id }).select("+ownerUserId +candidateApprovedAt");
    if (!candidate) return fail(res, 404, "No portfolio is linked to this account.");
    candidate.candidateApprovedAt = null;
    await candidate.save();
    res.json({ success: true, message: "Portfolio approval withdrawn; its public page is now private." });
  } catch (error) { next(error); }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const profile = await GrowthProfile.findOne({ userId: req.user._id }).lean();
    res.json({ success: true, profile: profile || { headline: "", summary: "", city: "", skills: [], visibility: "private" } });
  } catch (error) { next(error); }
};

exports.saveMyProfile = async (req, res, next) => {
  try {
    const input = req.body || {};
    const skills = Array.isArray(input.skills) ? input.skills.slice(0, 40).map((item) => text(item, 80)).filter(Boolean) : [];
    const profile = await GrowthProfile.findOneAndUpdate({ userId: req.user._id }, { $set: {
      headline: text(input.headline, 180), summary: text(input.summary, 3000), city: text(input.city, 100), skills,
      visibility: input.visibility === "public" ? "public" : "private",
    } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    res.json({ success: true, profile });
  } catch (error) { next(error); }
};

exports.listPublicProfiles = async (req, res, next) => {
  try {
    const filter = { visibility: "public" };
    if (req.query.skill) filter.skills = new RegExp(String(req.query.skill).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const profiles = await GrowthProfile.find(filter).select("headline summary city skills").populate("userId", "fullName").sort({ updatedAt: -1 }).limit(100);
    res.json({ success: true, profiles: profiles.map((item) => ({ id: item._id, name: item.userId?.fullName || "Professional", headline: item.headline, summary: item.summary, city: item.city, skills: item.skills })) });
  } catch (error) { next(error); }
};

exports.listPublicCompanies = async (_req, res, next) => {
  try {
    const companies = await TrustCompany.find({ visibility: "published" }).select("name slug industry summary location website logoUrl").sort({ name: 1 }).limit(100);
    res.json({ success: true, companies });
  } catch (error) { next(error); }
};

exports.listAdminCompanies = async (_req, res, next) => {
  try { const companies = await TrustCompany.find().select("+publicEmail").sort({ updatedAt: -1 }).limit(200); res.json({ success: true, companies }); } catch (error) { next(error); }
};

exports.saveCompany = async (req, res, next) => {
  try {
    const input = req.body || {};
    if (!text(input.name, 160) || !validSlug(input.slug)) return fail(res, 400, "Company name and a valid slug are required.");
    const values = { name: text(input.name, 160), slug: input.slug.toLowerCase(), industry: text(input.industry, 120), summary: text(input.summary, 3000), location: text(input.location, 180), website: safeUrl(input.website), logoUrl: safeUrl(input.logoUrl), publicEmail: text(input.publicEmail, 254).toLowerCase(), visibility: ["draft", "published", "archived"].includes(input.visibility) ? input.visibility : "draft" };
    const company = req.params.id ? await TrustCompany.findByIdAndUpdate(req.params.id, { $set: values }, { new: true, runValidators: true }).select("+publicEmail") : await TrustCompany.create(values);
    if (!company) return fail(res, 404, "Company not found.");
    res.status(req.params.id ? 200 : 201).json({ success: true, company });
  } catch (error) { if (error.code === 11000) return fail(res, 409, "That company slug is already in use."); next(error); }
};

exports.listPublicJobs = async (req, res, next) => {
  try {
    const filter = { visibility: "published", $or: [{ closesAt: null }, { closesAt: { $gt: new Date() } }] };
    if (req.query.q) { const term = String(req.query.q).slice(0, 80); filter.$and = [{ $or: [{ title: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }, { summary: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }, { skills: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }] }]; }
    const jobs = await TrustJob.find(filter).populate({ path: "companyId", match: { visibility: "published" }, select: "name slug logoUrl industry location" }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, jobs: jobs.filter((job) => job.companyId) });
  } catch (error) { next(error); }
};

exports.listAdminJobs = async (_req, res, next) => {
  try { const jobs = await TrustJob.find().populate("companyId", "name slug").sort({ updatedAt: -1 }).limit(300); res.json({ success: true, jobs }); } catch (error) { next(error); }
};

exports.saveJob = async (req, res, next) => {
  try {
    const input = req.body || {};
    if (!mongoose.isValidObjectId(input.companyId) || !text(input.title, 180)) return fail(res, 400, "Choose a company and provide a job title.");
    const company = await TrustCompany.findById(input.companyId).select("_id");
    if (!company) return fail(res, 404, "Company not found.");
    const skills = Array.isArray(input.skills) ? input.skills.slice(0, 40).map((item) => text(item, 80)).filter(Boolean) : [];
    const values = { companyId: company._id, title: text(input.title, 180), summary: text(input.summary, 500), description: text(input.description, 12000), location: text(input.location, 180), workMode: ["onsite", "hybrid", "remote", "unspecified"].includes(input.workMode) ? input.workMode : "unspecified", employmentType: ["full-time", "part-time", "contract", "internship"].includes(input.employmentType) ? input.employmentType : "full-time", experience: text(input.experience, 120), skills, applicationUrl: safeUrl(input.applicationUrl), visibility: ["draft", "published", "closed", "archived"].includes(input.visibility) ? input.visibility : "draft", closesAt: input.closesAt && !Number.isNaN(Date.parse(input.closesAt)) ? new Date(input.closesAt) : null };
    let job;
    if (req.params.id) job = await TrustJob.findByIdAndUpdate(req.params.id, { $set: values }, { new: true, runValidators: true }).populate("companyId", "name slug");
    else job = await TrustJob.create({ ...values, createdBy: req.user._id });
    if (!job) return fail(res, 404, "Job not found.");
    res.status(req.params.id ? 200 : 201).json({ success: true, job });
  } catch (error) { next(error); }
};

exports.applyToJob = async (req, res, next) => {
  try {
    if (req.body?.consentedToShare !== true) return fail(res, 400, "Confirm that you want to share your application with this employer.");
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, "Job not found.");
    const job = await TrustJob.findOne({ _id: req.params.id, visibility: "published", $or: [{ closesAt: null }, { closesAt: { $gt: new Date() } }] }).select("_id");
    if (!job) return fail(res, 404, "This opportunity is no longer accepting applications.");
    const application = await TrustApplication.create({ jobId: job._id, candidateId: req.user._id, message: text(req.body?.message, 3000), consentedToShare: true, consentedAt: new Date() });
    res.status(201).json({ success: true, application: { id: application._id, status: application.status } });
  } catch (error) { if (error.code === 11000) return fail(res, 409, "You have already applied to this opportunity."); next(error); }
};

exports.listApplications = async (_req, res, next) => {
  try {
    const applications = await TrustApplication.find().populate("jobId", "title companyId").populate("candidateId", "fullName email").sort({ createdAt: -1 }).limit(500).lean();
    res.json({ success: true, applications });
  } catch (error) { next(error); }
};

exports.updateApplication = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !["submitted", "reviewing", "interview", "closed"].includes(req.body?.status)) return fail(res, 400, "Choose a valid application status.");
    const application = await TrustApplication.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true, runValidators: true }).populate("jobId", "title").populate("candidateId", "fullName email");
    if (!application) return fail(res, 404, "Application not found.");
    res.json({ success: true, application });
  } catch (error) { next(error); }
};
