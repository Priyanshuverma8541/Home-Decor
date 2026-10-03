/* Savitri Livings Web Push service worker. It displays real browser/system notifications even when the site is closed. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

const safeTarget = (raw) => {
  try {
    const target = new URL(raw || "/", self.location.origin);
    return target.protocol === "https:" && [self.location.hostname, "home-decor-inky.vercel.app"].includes(target.hostname.toLowerCase()) ? target.href : `${self.location.origin}/`;
  } catch {
    return `${self.location.origin}/`;
  }
};

async function trackNotificationClick(data) {
  if (!data?.trackUrl || !data?.endpoint) return;
  try {
    await fetch(data.trackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: data.endpoint, campaignId: data.campaignId || null }),
      keepalive: true,
      credentials: "omit",
    });
  } catch (_error) {
    // Tracking failures should never block opening the target page.
  }
}

const PUSH_CONFIG_CACHE = "sl-push-config-v1";
const PUSH_CONFIG_KEY = new URL("/__savitri_push_config__", self.location.origin).href;

async function getPushApiBase() {
  const cache = await caches.open(PUSH_CONFIG_CACHE);
  const response = await cache.match(PUSH_CONFIG_KEY);
  if (!response) return "";
  const value = await response.json().catch(() => ({}));
  return typeof value.apiBase === "string" ? value.apiBase : "";
}

async function sendSubscriptionToBackend(subscription, path = "subscribe") {
  const apiBase = await getPushApiBase();
  if (!apiBase || !subscription) return;
  const json = subscription.toJSON();
  await fetch(`${apiBase}/api/push/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(path === "subscribe" ? {
      endpoint: json.endpoint,
      keys: json.keys,
      browser: self.navigator.userAgent,
      platform: "unknown",
      expirationTime: subscription.expirationTime,
    } : { endpoint: json.endpoint }),
    credentials: "omit",
  });
}

self.addEventListener("message", (event) => {
  const value = event.data || {};
  if (value.type !== "CONFIG_PUSH_API" || typeof value.apiBase !== "string") return;
  let url;
  try { url = new URL(value.apiBase); } catch { return; }
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(PUSH_CONFIG_CACHE);
    await cache.put(PUSH_CONFIG_KEY, new Response(JSON.stringify({ apiBase: url.origin })));
  })());
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil((async () => {
    let subscription = event.newSubscription;
    if (!subscription) {
      if (event.oldSubscription) await sendSubscriptionToBackend(event.oldSubscription, "unsubscribe").catch(() => {});
      const apiBase = await getPushApiBase();
      if (!apiBase) return;
      const response = await fetch(`${apiBase}/api/push/config`, { credentials: "omit" });
      if (!response.ok) return;
      const config = await response.json();
      if (!config.configured || !config.publicKey) return;
      const padded = config.publicKey + "=".repeat((4 - config.publicKey.length % 4) % 4);
      const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
      const applicationServerKey = Uint8Array.from(raw, (character) => character.charCodeAt(0));
      subscription = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    }
    await sendSubscriptionToBackend(subscription);
  })());
});
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { body: event.data?.text() || "" };
  }

  const title = data.title || "Savitri Livings";
  const body = data.body || "";
  const icon = data.icon || "/brand/savitri-jewellers-mark.png";
  const image = data.image || "";
  const notificationData = {
    url: data.url || "/",
    campaignId: data.campaignId || null,
    endpoint: data.endpoint || null,
    trackUrl: data.trackUrl || null,
  };

  const options = {
    body,
    icon,
    badge: "/brand/savitri-jewellers-mark.png",
    image: image || undefined,
    tag: data.tag || `sl-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: notificationData,
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  const clickData = event.notification.data || {};
  const targetUrl = safeTarget(clickData.url || "/");
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  event.waitUntil(Promise.allSettled([
    trackNotificationClick(clickData),
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const match = clients.find((client) => new URL(client.url).origin === self.location.origin);
      if (match) return match.focus().then(() => match.navigate(targetUrl));
      return self.clients.openWindow(targetUrl);
    }),
  ]));
});
