/* Savitri Livings Web Push service worker. It displays real browser/system notifications even when the site is closed. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

const safeTarget = (raw) => {
  try {
    const target = new URL(raw || "/", self.location.origin);
    return ["http:", "https:"].includes(target.protocol) ? target.href : `${self.location.origin}/`;
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
