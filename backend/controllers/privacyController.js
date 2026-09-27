const mongoose = require("mongoose");
const PrivacyConsent = require("../models/PrivacyConsent");
const Settings = require("../models/Settings");
const User = require("../models/User");

const ALLOWED_STATUSES = new Set(["consented", "denied", "granted", "not-granted", "unsupported"]);
const validSubjectId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{16,80}$/.test(value);

exports.saveConsent = async (req, res, next) => {
  try {
    const { subjectId, decisions } = req.body || {};
    if (!validSubjectId(subjectId)) return res.status(400).json({ success: false, message: "A valid privacy subject ID is required" });
    if (!Array.isArray(decisions) || decisions.length < 1 || decisions.length > 30) {
      return res.status(400).json({ success: false, message: "Submit between 1 and 30 capability decisions" });
    }

    const settings = await Settings.findOne().select("permissionCapabilities") || await Settings.create({});
    const enabledCapabilities = new Map((settings?.permissionCapabilities || [])
      .filter((capability) => capability.enabled)
      .map((capability) => [capability.key, capability]));
    const now = new Date();
    const normalized = [];
    const seen = new Set();

    for (const decision of decisions) {
      const key = typeof decision?.key === "string" ? decision.key : "";
      if (!/^[a-zA-Z0-9_-]{1,80}$/.test(key) || seen.has(key)) {
        return res.status(400).json({ success: false, message: "Capability keys must be unique and valid" });
      }
      if (!ALLOWED_STATUSES.has(decision.status)) {
        return res.status(400).json({ success: false, message: `Invalid consent status for ${key}` });
      }
      const configured = enabledCapabilities.get(key);
      if (!configured) return res.status(400).json({ success: false, message: `Capability is not enabled: ${key}` });
      seen.add(key);
      normalized.push({
        key,
        label: configured.label,
        category: configured.category || "browser",
        status: decision.status,
        decidedAt: now,
      });
    }

    let record = await PrivacyConsent.findOne({ subjectId });
    if (!record) record = new PrivacyConsent({ subjectId });
    if (req.user?._id) record.userId = req.user._id;
    record.policyVersion = "1";
    record.lastSeenAt = now;

    for (const decision of normalized) {
      const previous = record.decisions.findIndex((item) => item.key === decision.key);
      if (previous >= 0) record.decisions[previous] = decision;
      else record.decisions.push(decision);
      record.history.push({ key: decision.key, status: decision.status, decidedAt: now });
    }
    if (record.history.length > 250) record.history = record.history.slice(-250);
    await record.save();

    res.status(200).json({ success: true, consent: { updatedAt: record.updatedAt, decisions: record.decisions } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "Consent was updated in another request. Please retry." });
    next(error);
  }
};

exports.getMine = async (req, res, next) => {
  try {
    const subjectId = req.get("x-privacy-subject-id");
    if (!validSubjectId(subjectId)) return res.status(400).json({ success: false, message: "A valid privacy subject ID is required" });
    let record = null;
    if (req.user?._id) record = await PrivacyConsent.findOne({ userId: req.user._id }).sort({ lastSeenAt: -1 });
    if (!record) record = await PrivacyConsent.findOne({ subjectId });
    res.json({ success: true, decisions: record?.decisions || [] });
  } catch (error) { next(error); }
};

exports.getAdminSummary = async (_req, res, next) => {
  try {
    const [subjects, decisionStats] = await Promise.all([
      PrivacyConsent.countDocuments(),
      PrivacyConsent.aggregate([
        { $unwind: "$decisions" },
        { $group: { _id: { key: "$decisions.key", label: "$decisions.label", status: "$decisions.status" }, count: { $sum: 1 } } },
        { $sort: { "_id.key": 1, "_id.status": 1 } },
      ]),
    ]);
    res.json({ success: true, summary: { subjects, decisionStats } });
  } catch (error) { next(error); }
};

exports.getAdminConsents = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const filter = {};
    const key = String(req.query.capability || "").trim();
    const status = String(req.query.status || "").trim();
    const search = String(req.query.search || "").trim().slice(0, 100);

    if (key || (status && ALLOWED_STATUSES.has(status))) {
      filter.decisions = { $elemMatch: {
        ...(key ? { key } : {}),
        ...(status && ALLOWED_STATUSES.has(status) ? { status } : {}),
      } };
    }
    if (search) {
      const matchingUsers = await User.find({ $or: [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ] }).select("_id").limit(100).lean();
      filter.$or = [
        { subjectId: { $regex: search, $options: "i" } },
        { userId: { $in: matchingUsers.map((user) => user._id) } },
      ];
    }

    const [records, total] = await Promise.all([
      PrivacyConsent.find(filter).populate("userId", "fullName email").sort({ lastSeenAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      PrivacyConsent.countDocuments(filter),
    ]);
    res.json({ success: true, records, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.deleteAdminConsent = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid consent record ID" });
    const record = await PrivacyConsent.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Privacy record not found" });
    res.json({ success: true });
  } catch (error) { next(error); }
};
