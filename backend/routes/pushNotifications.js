const crypto = require("crypto");
const router = require("express").Router();
const webpush = require("web-push");
const Subscription = require("../models/WebPushSubscription");
const PushCampaign = require("../models/PushCampaign");
const { optionalProtect, protect, adminOnly } = require("../middleware/auth");
const { createNotificationEngine } = require("../platform/notifications/engine");
const VALID_PUSH_APP_IDS = new Set(["app_savitri_livings", "app_savinexa", "app_savitri_kolkata"]);
const requestedAppId = (req) => VALID_PUSH_APP_IDS.has(req.query?.appId) ? req.query.appId : VALID_PUSH_APP_IDS.has(req.body?.appId) ? req.body.appId : "app_savitri_livings";
const subscriptionAppFilter = (appId) => ({ $or: [{ appIds: appId }, ...(appId === "app_savitri_livings" ? [{ appIds: { $exists: false } }] : [])] });
const campaignAppFilter = (appId) => ({ $or: [{ appId }, ...(appId === "app_savitri_livings" ? [{ appId: { $exists: false } }] : [])] });

const configured = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const fail = (res, status, message) => res.status(status).json({ success: false, message });

const setup = () => {
  if (!configured()) throw new Error("Web Push is not configured. Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT to the backend environment.");
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
};

const normalizeText = (value, maxLength = 300, fallback = "") => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
};

const allowedBrowser = new Set(["Chrome", "Safari", "Firefox", "Edge", "Other"]);
const allowedPlatform = new Set(["Android", "iOS", "Windows", "macOS", "Linux", "Other"]);
const allowedLanguage = (value) => typeof value === "string" && /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(value) ? value : "";

const normalizeTargetUrl = (value, requestOrigin = "") => {
  if (typeof value !== "string") return "/";
  const trimmed = value.trim();
  if (!trimmed) return "/";

  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const hostnames = new Set([
        "localhost",
        "127.0.0.1",
        "home-decor-inky.vercel.app",
        "savitri-kolkata.vercel.app",
      ]);
      const host = url.hostname.toLowerCase();
      if (url.protocol === "https:" && hostnames.has(host)) {
        return url.toString();
      }
    } catch (_error) {
      return "/";
    }
    return "/";
  }

  return "/";
};

const normalizeImageUrl = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) return trimmed;
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  return "";
};

const getRequestOrigin = (req = {}) => {
  const configuredBase = [process.env.API_BASE_URL, process.env.BACKEND_URL, process.env.PUBLIC_API_URL, process.env.SERVER_URL, process.env.API_URL, process.env.RENDER_EXTERNAL_URL].find(Boolean);
  if (configuredBase) return configuredBase.replace(/\/$/, "");
  const forwardedProto = req.get ? req.get("x-forwarded-proto")?.split(",")[0].trim() : "http";
  const forwardedHost = req.get ? req.get("x-forwarded-host")?.split(",")[0].trim() : "localhost:8081";
  return `${forwardedProto || "http"}://${forwardedHost || "localhost:8081"}`;
};

const getTrackApiUrl = (req = {}) => {
  const origin = getRequestOrigin(req);
  return `${origin.replace(/\/$/, "")}/api/push/track-click`;
};

const buildPayload = (campaign, subscription, req = {}) => {
  const appId = campaign.appId || "app_savitri_livings";
  const brand = appId === "app_savinexa" ? "Savinexa" : appId === "app_savitri_kolkata" ? "Savitri Livings Kolkata" : "Savitri Livings";
  const title = normalizeText(campaign.title, 100, brand) || brand;
  const body = normalizeText(campaign.body, 300, "");
  const targetUrl = normalizeTargetUrl(campaign.targetUrl, getRequestOrigin(req));
  const icon = normalizeImageUrl(campaign.iconUrl) || (appId === "app_savinexa" ? "/brand/savitri-jewellers-mark.png" : "/brand/savitri-jewellers-mark.png");
  const image = normalizeImageUrl(campaign.imageUrl);

  return {
    title,
    body,
    icon,
    image: image || undefined,
    tag: `${appId}-${String(campaign._id)}`,
    appId,
    url: targetUrl,
    campaignId: String(campaign._id),
    trackUrl: getTrackApiUrl(req),
    endpoint: subscription.endpoint,
  };
};

const { dispatchCampaign } = createNotificationEngine({ webpush, Subscription, setup, buildPayload });

let schedulerStarted = false;
const startScheduledCampaigns = () => {
  if (schedulerStarted) return;
  schedulerStarted = true;
  setInterval(async () => {
    try {
      const dueCampaigns = await PushCampaign.find({ status: "scheduled", scheduledAt: { $lte: new Date() } }).limit(20);
      for (const campaign of dueCampaigns) {
        console.log("[Push] Dispatching scheduled campaign:", campaign._id.toString());
        await dispatchCampaign(campaign, { headers: { origin: process.env.CLIENT_URL || process.env.ADMIN_URL || "http://localhost:5176" } });
      }
    } catch (error) {
      console.error("[Push] Scheduled campaign check failed:", error.message);
    }
  }, 60000);
};

router.get("/config", (_req, res) => res.json({ success: true, configured: configured(), publicKey: process.env.VAPID_PUBLIC_KEY || "" }));
router.post("/status", optionalProtect, async (req, res, next) => { try { const appId = requestedAppId(req); const endpoint = req.body?.endpoint; const registration = endpoint ? await Subscription.findOne({ endpointHash: hash(endpoint) }) : null; const appIds = registration?.appIds?.length ? registration.appIds : ["app_savitri_livings"]; res.json({ success: true, appId, subscribed: Boolean(registration && appIds.includes(appId) && registration.status === "active") }); } catch (error) { next(error); } });

router.post("/subscribe", optionalProtect, async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body || {};
    const appId = requestedAppId(req);
    if (!endpoint?.startsWith("https://") || !keys?.p256dh || !keys?.auth) return fail(res, 400, "A valid browser push subscription is required");

    const update = {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      endpointHash: hash(endpoint),
      userId: req.user?._id || null,
      status: "active",
      // Keep only coarse, allow-listed device metadata. Never store full UA,
      // precise location, contacts, or hardware identifiers.
      device: {
        browser: allowedBrowser.has(req.body.browser) ? req.body.browser : "Other",
        platform: allowedPlatform.has(req.body.platform) ? req.body.platform : "Other",
        language: allowedLanguage(req.body.language),
      },
      expirationTime: req.body.expirationTime ? new Date(req.body.expirationTime) : null,
    };

    const existing = await Subscription.findOne({ endpointHash: update.endpointHash }).select("appIds").lean();
    const existingAppIds = existing?.appIds?.length ? existing.appIds : existing ? ["app_savitri_livings"] : [];
    const updateFields = { ...update, appIds: [...new Set([...existingAppIds, appId])] };
    if (!req.user?._id) delete updateFields.userId;
    const subscription = await Subscription.findOneAndUpdate(
      { endpointHash: update.endpointHash },
      { $set: updateFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log("[Push] Subscription registered:", subscription._id.toString());
    res.status(201).json({ success: true, subscription: subscription.toJSON() });
  } catch (error) {
    next(error);
  }
});

router.post("/unsubscribe", optionalProtect, async (req, res, next) => {
  try {
    const endpoint = req.body?.endpoint;
    if (!endpoint) return fail(res, 400, "Subscription endpoint is required");

    const appId = requestedAppId(req);
    const subscription = await Subscription.findOne({ endpointHash: hash(endpoint) }).select("+endpoint");
    if (!subscription) return res.json({ success: true, remainingAppIds: [] });
    const currentAppIds = subscription.appIds?.length ? subscription.appIds : ["app_savitri_livings"];
    subscription.appIds = currentAppIds.filter((id) => id !== appId);
    if (!subscription.appIds.length) subscription.status = "unsubscribed";
    await subscription.save();
    console.log("[Push] Subscription removed from application:", appId);
    res.json({ success: true, remainingAppIds: subscription.appIds });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/summary", protect, adminOnly, async (req, res, next) => {
  try {
    const appId = requestedAppId(req);
    const subscriberScope = subscriptionAppFilter(appId);
    const campaignScope = campaignAppFilter(appId);
    const [subscribers, active, inactive, campaigns, metrics] = await Promise.all([
      Subscription.countDocuments(subscriberScope),
      Subscription.countDocuments({ $and: [subscriberScope, { status: "active" }] }),
      Subscription.countDocuments({ $and: [subscriberScope, { status: { $in: ["expired", "unsubscribed"] } }] }),
      PushCampaign.countDocuments(campaignScope),
      PushCampaign.aggregate([
        { $match: campaignScope },
        { $group: {
          _id: null,
          campaignsSent: { $sum: { $cond: [{ $in: ["$status", ["sent", "partial"]] }, 1, 0] } },
          scheduled: { $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] } },
          attempts: { $sum: { $ifNull: ["$stats.targeted", 0] } },
          accepted: { $sum: { $ifNull: ["$stats.accepted", 0] } },
          failed: { $sum: { $ifNull: ["$stats.failed", 0] } },
          stale: { $sum: { $ifNull: ["$stats.stale", 0] } },
          clicked: { $sum: { $ifNull: ["$stats.clicked", 0] } },
        } },
      ]),
    ]);
    const summary = metrics[0] || { campaignsSent: 0, scheduled: 0, attempts: 0, accepted: 0, failed: 0, stale: 0, clicked: 0 };
    const campaignList = await PushCampaign.find(campaignScope).sort({ createdAt: -1 }).limit(12);
    res.json({ success: true, appId, configured: configured(), totalSubscribers: subscribers, activeSubscribers: active, inactiveSubscribers: inactive, campaignCount: campaigns, campaignsSent: summary.campaignsSent, scheduledCampaigns: summary.scheduled, pushAttempts: summary.attempts, acceptedPushes: summary.accepted, failedPushes: summary.failed + summary.stale, invalidSubscriptions: summary.stale, clicks: summary.clicked, campaigns: campaignList });
  } catch (error) { next(error); }
});

router.get("/admin/subscribers", protect, adminOnly, async (req, res, next) => {
  try {
    const appId = requestedAppId(req);
    const subscribers = await Subscription.find({ $and: [subscriptionAppFilter(appId), { status: "active" }] }).populate("userId", "fullName email phone").sort({ createdAt: -1 }).lean();
    res.json({ success: true, appId, subscribers });
  } catch (error) { next(error); }
});

router.get("/admin/campaigns", protect, adminOnly, async (req, res, next) => {
  try {
    const appId = requestedAppId(req);
    const campaigns = await PushCampaign.find(campaignAppFilter(appId)).sort({ createdAt: -1 }).lean();
    res.json({ success: true, appId, campaigns });
  } catch (error) { next(error); }
});
router.get("/admin/campaigns/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const campaign = await PushCampaign.findOne({ _id: req.params.id, ...campaignAppFilter(requestedAppId(req)) });
    if (!campaign) return fail(res, 404, "Campaign not found");
    res.json({ success: true, campaign });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/campaigns", protect, adminOnly, async (req, res, next) => {
  try {
    const { name, title, body, description, targetUrl = "/", imageUrl = "", iconUrl = "", audience = "all", subscriptionIds = [], sendMode = "draft", scheduledAt } = req.body || {};

    if (!name?.trim() || !title?.trim() || !body?.trim()) {
      return fail(res, 400, "Campaign name, notification title and message are required");
    }

    const sanitizedTargetUrl = normalizeTargetUrl(targetUrl, getRequestOrigin(req));
    const campaignPayload = {
      appId: requestedAppId(req),
      name: name.trim(),
      title: normalizeText(title, 100, ""),
      body: normalizeText(body, 300, ""),
      description: normalizeText(description, 250, ""),
      targetUrl: sanitizedTargetUrl,
      imageUrl: normalizeImageUrl(imageUrl),
      iconUrl: normalizeImageUrl(iconUrl) || "/brand/savitri-jewellers-mark.png",
      audience,
      subscriptionIds: Array.isArray(subscriptionIds) ? subscriptionIds : [],
      sendMode,
      scheduledAt: sendMode === "schedule" ? new Date(scheduledAt || Date.now() + 60000) : null,
      status: sendMode === "schedule" ? "scheduled" : "draft",
      createdBy: req.user._id,
    };

    const campaign = await PushCampaign.create(campaignPayload);

    if (sendMode === "now") {
      const result = await dispatchCampaign(campaign, req);
      return res.status(201).json({ success: true, campaign: result.campaign, sent: true });
    }

    res.status(201).json({ success: true, campaign });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/campaigns/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const campaign = await PushCampaign.findOne({ _id: req.params.id, ...campaignAppFilter(requestedAppId(req)) });
    if (!campaign) return fail(res, 404, "Campaign not found");

    const updates = { ...req.body };
    delete updates.appId;
    if (updates.title) updates.title = normalizeText(updates.title, 100, "");
    if (updates.body) updates.body = normalizeText(updates.body, 300, "");
    if (updates.description) updates.description = normalizeText(updates.description, 250, "");
    if (updates.targetUrl) updates.targetUrl = normalizeTargetUrl(updates.targetUrl, getRequestOrigin(req));
    if (updates.iconUrl !== undefined) updates.iconUrl = normalizeImageUrl(updates.iconUrl) || "/brand/savitri-jewellers-mark.png";
    if (updates.imageUrl !== undefined) updates.imageUrl = normalizeImageUrl(updates.imageUrl);
    if (updates.sendMode === "schedule") updates.scheduledAt = updates.scheduledAt ? new Date(updates.scheduledAt) : new Date(Date.now() + 60000);
    if (updates.sendMode === "draft") updates.scheduledAt = null;

    Object.assign(campaign, updates);
    if (campaign.sendMode === "schedule" && !campaign.scheduledAt) campaign.status = "scheduled";
    if (campaign.sendMode === "draft") campaign.status = "draft";
    await campaign.save();
    res.json({ success: true, campaign });
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/campaigns/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const campaign = await PushCampaign.findOneAndDelete({ _id: req.params.id, ...campaignAppFilter(requestedAppId(req)) });
    if (!campaign) return fail(res, 404, "Campaign not found");
    res.json({ success: true, message: "Campaign deleted" });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/campaigns/:id/send", protect, adminOnly, async (req, res, next) => {
  try {
    const campaign = await PushCampaign.findOne({ _id: req.params.id, ...campaignAppFilter(requestedAppId(req)) });
    if (!campaign) return fail(res, 404, "Push campaign not found");
    const result = await dispatchCampaign(campaign, req);
    res.json({ success: true, campaign: result.campaign, stats: result.stats });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/campaigns/:id/cancel", protect, adminOnly, async (req, res, next) => {
  try {
    const campaign = await PushCampaign.findOne({ _id: req.params.id, ...campaignAppFilter(requestedAppId(req)) });
    if (!campaign) return fail(res, 404, "Campaign not found");
    campaign.status = "draft";
    campaign.sendMode = "draft";
    campaign.scheduledAt = null;
    await campaign.save();
    res.json({ success: true, campaign });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/test", protect, adminOnly, async (req, res, next) => {
  try {
    const { subscriptionId, endpoint, title, body, targetUrl = "/", imageUrl = "", iconUrl = "" } = req.body || {};
    if (!title?.trim() || !body?.trim()) return fail(res, 400, "Title and body are required for the test notification");

    const appId = requestedAppId(req);
    const scope = subscriptionAppFilter(appId);
    const subscription = subscriptionId ? await Subscription.findOne({ _id: subscriptionId, $and: [scope, { status: "active" }] }) : endpoint ? await Subscription.findOne({ endpointHash: hash(endpoint), $and: [scope, { status: "active" }] }) : await Subscription.findOne({ userId: req.user._id, $and: [scope, { status: "active" }] }).sort({ updatedAt: -1 });
    if (!subscription) return fail(res, 404, "No active subscriber found to test against");

    setup();
    const payload = JSON.stringify({
      title: normalizeText(title, 100, "Savitri Livings"),
      body: normalizeText(body, 300, ""),
      icon: normalizeImageUrl(iconUrl) || "/brand/savitri-jewellers-mark.png",
      image: normalizeImageUrl(imageUrl) || undefined,
      tag: "sl-admin-test",
      url: normalizeTargetUrl(targetUrl, getRequestOrigin(req)),
      campaignId: "test",
      appId,
      trackUrl: getTrackApiUrl(req),
      endpoint: subscription.endpoint,
    });

    await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload, { TTL: 86400, urgency: "normal" });
    res.json({ success: true, message: "Test notification sent" });
  } catch (error) {
    next(error);
  }
});

router.post("/track-click", async (req, res, next) => {
  try {
    const { endpoint, campaignId } = req.body || {};
    const appId = VALID_PUSH_APP_IDS.has(req.body?.appId) ? req.body.appId : "app_savitri_livings";
    if (!endpoint && !campaignId) return res.json({ success: true, tracked: false });

    if (endpoint) {
      const subscription = await Subscription.findOne({ endpointHash: hash(endpoint) });
      if (subscription) {
        subscription.clickCount = (Number(subscription.clickCount) || 0) + 1;
        subscription.lastClickedAt = new Date();
        await subscription.save();
      }
    }

    if (campaignId && campaignId !== "test") {
      const campaign = await PushCampaign.findOne({ _id: campaignId, ...campaignAppFilter(appId) });
      if (campaign) {
        const nextStats = {
          targeted: Number(campaign.stats?.targeted || 0),
          accepted: Number(campaign.stats?.accepted || 0),
          failed: Number(campaign.stats?.failed || 0),
          stale: Number(campaign.stats?.stale || 0),
          clicked: Number(campaign.stats?.clicked || 0) + 1,
        };
        campaign.stats = nextStats;
        campaign.lastClickedAt = new Date();
        await campaign.save();
      }
    }

    console.log("[Push] Notification click recorded:", campaignId || "n/a");
    res.json({ success: true, tracked: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
module.exports.startScheduledCampaigns = startScheduledCampaigns;
