/* Savitri Livings Web Push service worker. It displays notifications even when the site is closed. */
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
  } catch (error) {
    // tracking failure must never block the user from opening the page
  }
}
self.addEventListener("push", (event) => {
  let data = {}; try { data = event.data?.json() || {}; } catch { data = { body: event.data?.text() || "" }; }
  event.waitUntil(self.registration.showNotification(data.title || "Savitri Livings", {
    body: data.body || "",
    icon: data.icon || "/brand/savitri-jewellers-mark.png",
    badge: "/brand/savitri-jewellers-mark.png",
    tag: data.tag,
    data: { url: data.url || "/", campaignId: data.campaignId || null, endpoint: data.endpoint || null, trackUrl: data.trackUrl || null },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const clickData = event.notification.data || {};
  const url = safeTarget(clickData.url);

  event.waitUntil(Promise.allSettled([
    trackNotificationClick(clickData),
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const match = clients.find((client) => new URL(client.url).origin === self.location.origin);
      if (match) return match.focus().then(() => match.navigate(url));
      return self.clients.openWindow(url);
    })
  ]));
});
