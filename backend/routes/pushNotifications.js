const crypto = require("crypto");
const router = require("express").Router();
const webpush = require("web-push");
const Subscription = require("../models/WebPushSubscription");
const PushCampaign = require("../models/PushCampaign");
const { optionalProtect, protect, adminOnly } = require("../middleware/auth");

const configured = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const fail = (res, status, message) => res.status(status).json({ success: false, message });
const setup = () => { if (!configured()) throw new Error("Web Push is not configured. Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT to the backend environment."); webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY); };
const getTrackApiUrl = () => {
  const candidates = [process.env.API_BASE_URL, process.env.BACKEND_URL, process.env.PUBLIC_API_URL, process.env.SERVER_URL, process.env.API_URL, process.env.CLIENT_URL, process.env.ADMIN_URL, process.env.FRONTEND_URL].filter(Boolean);
  return candidates[0] ? candidates[0].replace(/\/$/, "") + "/api/push/track-click" : "";
};

router.get("/config", (_req, res) => res.json({ success: true, configured: configured(), publicKey: process.env.VAPID_PUBLIC_KEY || "" }));
router.post("/subscribe", optionalProtect, async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint?.startsWith("https://") || !keys?.p256dh || !keys?.auth) return fail(res, 400, "A valid browser push subscription is required");
    const subscription = await Subscription.findOneAndUpdate({ endpointHash: hash(endpoint) }, { $set: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: req.user?._id, status: "active", device: { browser: req.get("user-agent")?.slice(0, 120), platform: req.body.platform || "", language: req.body.language || "" } } }, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.status(201).json({ success: true, subscription: subscription.toJSON() });
  } catch (error) { next(error); }
});
router.post("/unsubscribe", optionalProtect, async (req, res, next) => { try { if (!req.body.endpoint) return fail(res, 400, "Subscription endpoint is required"); await Subscription.updateOne({ endpointHash: hash(req.body.endpoint) }, { $set: { status: "unsubscribed" } }); res.json({ success: true }); } catch (error) { next(error); } });

router.get("/admin/summary", protect, adminOnly, async (_req, res, next) => { try { const [active, campaigns] = await Promise.all([Subscription.countDocuments({ status: "active" }), PushCampaign.find().sort({ createdAt: -1 }).limit(12)]); res.json({ success: true, configured: configured(), activeSubscriptions: active, campaigns }); } catch (error) { next(error); } });
router.get("/admin/subscribers", protect, adminOnly, async (_req, res, next) => { try { res.json({ success: true, subscribers: await Subscription.find().populate("userId", "fullName email phone").sort({ createdAt: -1 }) }); } catch (error) { next(error); } });
router.post("/admin/campaigns", protect, adminOnly, async (req, res, next) => {
  try {
    const { name, title, body, targetUrl = "/", iconUrl = "", audience = "all", subscriptionIds = [] } = req.body;
    if (!name?.trim() || !title?.trim() || !body?.trim()) return fail(res, 400, "Campaign name, notification title and message are required");
    const campaign = await PushCampaign.create({ name, title, body, targetUrl, iconUrl, audience, subscriptionIds, createdBy: req.user._id });
    res.status(201).json({ success: true, campaign });
  } catch (error) { next(error); }
});
router.post("/admin/campaigns/:id/send", protect, adminOnly, async (req, res, next) => {
  try {
    setup(); const campaign = await PushCampaign.findById(req.params.id); if (!campaign) return fail(res, 404, "Push campaign not found");
    const query = { status: "active" }; if (campaign.audience === "selected") query._id = { $in: campaign.subscriptionIds };
    const subscriptions = await Subscription.find(query).select("+endpoint +p256dh +auth"); const stats = { targeted: subscriptions.length, accepted: 0, failed: 0, stale: 0, clicked: Number(campaign.stats?.clicked || 0) };
    campaign.status = "sending"; campaign.stats = stats; await campaign.save();
    const trackUrl = getTrackApiUrl();
    for (const subscription of subscriptions) {
      const payload = JSON.stringify({ title: campaign.title, body: campaign.body, icon: campaign.iconUrl || undefined, tag: `sl-${campaign._id}`, url: campaign.targetUrl || "/", campaignId: String(campaign._id), trackUrl: trackUrl || undefined, endpoint: subscription.endpoint });
      try { await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload, { TTL: 86400, urgency: "normal" }); stats.accepted += 1; subscription.lastSuccessAt = new Date(); await subscription.save(); } catch (error) { const stale = [404, 410].includes(error.statusCode); stats[stale ? "stale" : "failed"] += 1; subscription.status = stale ? "expired" : subscription.status; subscription.lastFailureAt = new Date(); await subscription.save(); } }
    campaign.stats = stats; campaign.sentAt = new Date(); campaign.status = stats.failed || stats.stale ? (stats.accepted ? "partial" : "failed") : "sent"; await campaign.save();
    res.json({ success: true, campaign });
  } catch (error) { next(error); }
});

router.post("/track-click", async (req, res, next) => {
  try {
    const { endpoint, campaignId } = req.body || {};
    if (!endpoint && !campaignId) return res.json({ success: true, tracked: false });

    if (endpoint) {
      const subscription = await Subscription.findOne({ endpointHash: hash(endpoint) });
      if (subscription) {
        subscription.clickCount = (Number(subscription.clickCount) || 0) + 1;
        subscription.lastClickedAt = new Date();
        await subscription.save();
      }
    }

    if (campaignId) {
      const campaign = await PushCampaign.findById(campaignId);
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

    res.json({ success: true, tracked: true });
  } catch (error) { next(error); }
});

module.exports = router;
