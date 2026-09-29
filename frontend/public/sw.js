/* Savitri Livings Web Push service worker. It displays notifications even when the site is closed. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("push", (event) => {
  let data = {}; try { data = event.data?.json() || {}; } catch { data = { body: event.data?.text() || "" }; }
  event.waitUntil(self.registration.showNotification(data.title || "Savitri Livings", { body: data.body || "", icon: data.icon || "/brand/savitri-jewellers-mark.png", badge: "/brand/savitri-jewellers-mark.png", tag: data.tag, data: { url: data.url || "/" } }));
});
self.addEventListener("notificationclick", (event) => { event.notification.close(); const url = new URL(event.notification.data?.url || "/", self.location.origin).href; event.waitUntil(self.clients.matchAll({ type:"window", includeUncontrolled:true }).then((clients) => { const match = clients.find((client) => new URL(client.url).origin === self.location.origin); return match ? match.focus().then(() => match.navigate(url)) : self.clients.openWindow(url); })); });
