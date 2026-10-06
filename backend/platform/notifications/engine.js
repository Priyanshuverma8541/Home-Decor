/**
 * Reusable Web Push dispatch engine.
 * Persistence and payload configuration are injected so delivery behavior
 * stays independent of Express routes and can be reused by other apps.
 */
const createNotificationEngine = ({ webpush, Subscription, setup, buildPayload }) => {
  if (!webpush || !Subscription || typeof setup !== "function" || typeof buildPayload !== "function") {
    throw new TypeError("Notification engine requires webpush, Subscription, setup and buildPayload adapters");
  }

  const dispatchCampaign = async (campaign, req = {}) => {
    if (!campaign) throw new Error("Campaign not found");
    setup();

    const appId = campaign.appId || "app_savitri_livings";
    const query = { status: "active", $or: [{ appIds: appId }, ...(appId === "app_savitri_livings" ? [{ appIds: { $exists: false } }] : [])] };
    if (campaign.audience === "selected") query._id = { $in: campaign.subscriptionIds || [] };
    const subscriptions = await Subscription.find(query).select("+endpoint +p256dh +auth");

    campaign.status = "sending";
    await campaign.save();
    const stats = { targeted: subscriptions.length, accepted: 0, failed: 0, stale: 0, clicked: Number(campaign.stats?.clicked || 0) };

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          JSON.stringify(buildPayload(campaign, subscription, req)),
          { TTL: 86400, urgency: "normal" }
        );
        stats.accepted += 1;
        subscription.lastSuccessAt = new Date();
        subscription.status = "active";
        await subscription.save();
        console.log("[Push] Accepted by push service:", subscription._id.toString());
      } catch (error) {
        const expired = [404, 410].includes(error.statusCode);
        stats[expired ? "stale" : "failed"] += 1;
        if (expired) subscription.status = "expired";
        subscription.lastFailureAt = new Date();
        await subscription.save();
        console.error("[Push] Failed:", error.statusCode || "unknown status");
      }
    }

    campaign.stats = stats;
    campaign.sentAt = new Date();
    campaign.status = stats.failed || stats.stale ? (stats.accepted ? "partial" : "failed") : "sent";
    await campaign.save();
    return { campaign, stats };
  };

  return { dispatchCampaign };
};

module.exports = { createNotificationEngine };