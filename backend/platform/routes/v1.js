const router = require("express").Router();
const PlatformEvent = require("../models/PlatformEvent");
const { platformAuth } = require("../middleware/apiKey");
const fail = (res, status, message) => res.status(status).json({ success: false, message });

router.post("/events", platformAuth({ scope: "events:write", allowPublic: true }), async (req, res, next) => {
  try {
    const event = typeof req.body?.event === "string" ? req.body.event.trim() : "";
    if (!/^[a-zA-Z][a-zA-Z0-9_.:-]{0,99}$/.test(event)) return fail(res, 400, "Event must be 1–100 letters, numbers or . _ : - characters and start with a letter");
    const properties = req.body.properties === undefined ? {} : req.body.properties;
    if (!properties || typeof properties !== "object" || Array.isArray(properties)) return fail(res, 400, "Event properties must be a JSON object");
    if (Buffer.byteLength(JSON.stringify(properties), "utf8") > 10000) return fail(res, 413, "Event properties exceed the 10 KB limit");
    const userId = req.body.userId === undefined ? "" : String(req.body.userId).trim();
    if (userId.length > 200) return fail(res, 400, "userId must be 200 characters or fewer");
    const occurredAt = req.body.occurredAt ? new Date(req.body.occurredAt) : new Date();
    if (Number.isNaN(occurredAt.getTime())) return fail(res, 400, "occurredAt must be a valid date");
    const record = await PlatformEvent.create({
      application: req.platformApplication._id,
      appId: req.platformApplication.appId,
      event,
      userId,
      properties,
      occurredAt,
      source: req.platformAuthType === "public" ? "public_key" : "api_key",
    });
    res.status(202).json({ success: true, eventId: record._id, appId: record.appId, accepted: true });
  } catch (error) { next(error); }
});

router.get("/events", platformAuth({ scope: "analytics:read" }), async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const filter = { application: req.platformApplication._id };
    if (typeof req.query.event === "string") filter.event = req.query.event.slice(0, 100);
    const events = await PlatformEvent.find(filter).sort({ createdAt: -1 }).limit(limit).select("-application -properties").lean();
    res.json({ success: true, appId: req.platformApplication.appId, events });
  } catch (error) { next(error); }
});

module.exports = router;