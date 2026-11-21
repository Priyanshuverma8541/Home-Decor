const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/auth");
const ExplorerHRContact = require("../models/ExplorerHRContact");
const ExplorerHRActivity = require("../models/ExplorerHRActivity");

router.use(protect, adminOnly);

const fields = ["fullName", "jobTitle", "companyName", "workEmail", "workPhone", "linkedInUrl", "otherProfileUrl", "technologies", "hiringAreas", "source", "contactBasis", "contactBasisDetails", "relationshipStatus", "nextFollowUpAt", "privateNotes"];
const pick = (body) => Object.fromEntries(fields.filter((key) => Object.hasOwn(body || {}, key)).map((key) => [key, body[key]]));
const fail = (res, status, message) => res.status(status).json({ success: false, message });
const validContactBasis = (data) => Boolean(data.source && data.contactBasis && data.contactBasisDetails);

router.get("/contacts", async (req, res, next) => {
  try {
    const query = {};
    if (req.query.status) query.relationshipStatus = req.query.status;
    if (req.query.followUp === "overdue") query.nextFollowUpAt = { $lt: new Date() };
    if (req.query.followUp === "upcoming") query.nextFollowUpAt = { $gte: new Date(), $lte: new Date(Date.now() + 30 * 86400000) };
    if (req.query.search) {
      const term = String(req.query.search).trim().slice(0, 100);
      if (term) query.$or = ["fullName", "jobTitle", "companyName", "workEmail", "source", "technologies", "hiringAreas"].map((field) => ({ [field]: { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }));
    }
    const contacts = await ExplorerHRContact.find(query).select("+privateNotes").sort({ nextFollowUpAt: 1, updatedAt: -1 }).limit(300).lean();
    res.json({ success: true, contacts });
  } catch (error) { next(error); }
});

router.post("/contacts", async (req, res, next) => {
  try {
    const data = pick(req.body);
    if (!data.fullName || !validContactBasis(data)) return fail(res, 400, "Name, source, contact basis, and basis details are required");
    const contact = await ExplorerHRContact.create({ ...data, createdBy: req.user._id, updatedBy: req.user._id });
    await ExplorerHRActivity.create({ contactId: contact._id, actorId: req.user._id, type: "created", summary: "Contact record created" });
    res.status(201).json({ success: true, contact });
  } catch (error) { next(error); }
});

router.patch("/contacts/:id", async (req, res, next) => {
  try {
    const data = pick(req.body);
    if ((Object.hasOwn(data, "source") || Object.hasOwn(data, "contactBasis") || Object.hasOwn(data, "contactBasisDetails")) && !validContactBasis({ ...await ExplorerHRContact.findById(req.params.id).lean(), ...data })) return fail(res, 400, "Source and contact basis details are required");
    const contact = await ExplorerHRContact.findByIdAndUpdate(req.params.id, { $set: { ...data, updatedBy: req.user._id } }, { new: true, runValidators: true }).select("+privateNotes");
    if (!contact) return fail(res, 404, "HR contact not found");
    await ExplorerHRActivity.create({ contactId: contact._id, actorId: req.user._id, type: "updated", summary: "Contact record updated" });
    res.json({ success: true, contact });
  } catch (error) { next(error); }
});

router.get("/contacts/:id/activities", async (req, res, next) => {
  try {
    if (!await ExplorerHRContact.exists({ _id: req.params.id })) return fail(res, 404, "HR contact not found");
    const activities = await ExplorerHRActivity.find({ contactId: req.params.id }).populate("actorId", "fullName").sort({ occurredAt: -1 }).limit(200).lean();
    res.json({ success: true, activities });
  } catch (error) { next(error); }
});

router.post("/contacts/:id/activities", async (req, res, next) => {
  try {
    const contact = await ExplorerHRContact.findById(req.params.id);
    if (!contact) return fail(res, 404, "HR contact not found");
    const { type, summary, occurredAt, nextFollowUpAt } = req.body || {};
    if (!type || !summary) return fail(res, 400, "Activity type and summary are required");
    const activity = await ExplorerHRActivity.create({ contactId: contact._id, actorId: req.user._id, type, summary, occurredAt, nextFollowUpAt });
    if (nextFollowUpAt) { contact.nextFollowUpAt = nextFollowUpAt; contact.updatedBy = req.user._id; await contact.save(); }
    res.status(201).json({ success: true, activity });
  } catch (error) { next(error); }
});

module.exports = router;
