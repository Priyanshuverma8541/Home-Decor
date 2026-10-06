/* Canonical Savitri service worker for PWA lifecycle and app-scoped Web Push. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

const safeTarget = (raw) => {
  try { const target = new URL(raw || "/", self.location.origin); return target.origin === self.location.origin ? target.href : `${self.location.origin}/`; }
  catch { return `${self.location.origin}/`; }
};

const PUSH_CONFIG_CACHE = "sl-push-config-v1";
const PUSH_CONFIG_KEY = new URL("/__savitri_push_config__", self.location.origin).href;
async function getPushConfig() {
  const cache = await caches.open(PUSH_CONFIG_CACHE);
  const response = await cache.match(PUSH_CONFIG_KEY);
  return response ? response.json().catch(() => ({})) : {};
}

async function sendSubscriptionToBackend(subscription, path = "subscribe") {
  const config = await getPushConfig();
  if (!config.apiBase || !subscription) return;
  const json = subscription.toJSON();
  const appIds = Array.isArray(config.appIds) && config.appIds.length ? config.appIds : [config.appId || "app_savitri_livings"];
  await Promise.allSettled(appIds.map((appId) => fetch(`${config.apiBase}/api/push/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(path === "subscribe" ? {
      endpoint: json.endpoint,
      keys: json.keys,
      appId,
      browser: "Other",
      platform: "Other",
      language: self.navigator.language || "",
      expirationTime: subscription.expirationTime,
    } : { endpoint: json.endpoint, appId }),
    credentials: "omit",
  })));
}

self.addEventListener("message", (event) => {
  const value = event.data || {};
  if (value.type !== "CONFIG_PUSH_API" || typeof value.apiBase !== "string") return;
  let url;
  try { url = new URL(value.apiBase); } catch { return; }
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(PUSH_CONFIG_CACHE);
    const previous = await getPushConfig();
    const appIds = Array.isArray(value.appIds) ? value.appIds : [...new Set([...(previous.appIds || []), value.appId || "app_savitri_livings"])];
    await cache.put(PUSH_CONFIG_KEY, new Response(JSON.stringify({ apiBase: url.origin, appId: value.appId || "app_savitri_livings", appIds: [...new Set(appIds)] })));
  })());
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil((async () => {
    if (event.oldSubscription) await sendSubscriptionToBackend(event.oldSubscription, "unsubscribe");
    let subscription = event.newSubscription;
    if (!subscription) {
      const config = await getPushConfig();
      if (!config.apiBase) return;
      const response = await fetch(`${config.apiBase}/api/push/config`, { credentials: "omit" });
      if (!response.ok) return;
      const vapid = await response.json();
      if (!vapid.configured || !vapid.publicKey) return;
      const padded = vapid.publicKey + "=".repeat((4 - vapid.publicKey.length % 4) % 4);
      const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
      const applicationServerKey = Uint8Array.from(raw, (character) => character.charCodeAt(0));
      subscription = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    }
    await sendSubscriptionToBackend(subscription, "subscribe");
  })());
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = { body: event.data?.text() || "" }; }
  const brand = data.appId === "app_savinexa" ? "Savinexa" : "Savitri Livings";
  const options = {
    body: data.body || "",
    icon: data.icon || "/brand/savitri-jewellers-mark.png",
    badge: data.badge || "/brand/savitri-jewellers-mark.png",
    image: data.image || undefined,
    tag: data.tag || `${data.appId || "savitri"}-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || "/", campaignId: data.campaignId || null, endpoint: data.endpoint || null, trackUrl: data.trackUrl || null, appId: data.appId || "app_savitri_livings" },
    actions: [{ action: "open", title: "Open" }, { action: "dismiss", title: "Dismiss" }],
  };
  event.waitUntil(self.registration.showNotification(data.title || brand, options));
});

self.addEventListener("notificationclick", (event) => {
  const clickData = event.notification.data || {};
  const targetUrl = safeTarget(clickData.url || "/");
  event.notification.close();
  if (event.action === "dismiss") return;
  event.waitUntil(Promise.allSettled([
    clickData.trackUrl && clickData.endpoint ? fetch(clickData.trackUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: clickData.endpoint, campaignId: clickData.campaignId, appId: clickData.appId }), keepalive: true, credentials: "omit" }) : Promise.resolve(),
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const match = clients.find((client) => new URL(client.url).origin === self.location.origin);
      if (match) return match.focus().then(() => match.navigate(targetUrl));
      return self.clients.openWindow(targetUrl);
    }),
  ]));
});