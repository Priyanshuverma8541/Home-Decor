/* SavitriBridge Service Worker - push display + click tracking.
 * If your site already has a Service Worker, copy the two listeners below into it instead of registering a second one. */
'use strict';

const FALLBACK = { title: 'New notification', body: '' };

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

function parsePayload(event) {
  if (!event.data) return {};
  try { const j = event.data.json(); return j && typeof j === 'object' ? j : {}; }
  catch (_) { try { return { body: event.data.text() }; } catch (__) { return {}; } } // malformed payload must never crash the worker
}
const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : undefined);

self.addEventListener('push', (event) => {
  const p = parsePayload(event);
  const options = {
    body: str(p.body, 300) ?? FALLBACK.body,
    icon: str(p.icon, 2048), badge: str(p.badge, 2048), image: str(p.image, 2048), // browsers ignore what they don't support
    tag: str(p.tag, 60), renotify: !!p.tag, requireInteraction: !!p.requireInteraction,
    data: { url: str(p.url, 2048), sendId: str(p.sendId, 64), clickToken: str(p.clickToken, 64), trackUrl: str(p.trackUrl, 2048), campaignId: str(p.campaignId, 64) }
  };
  event.waitUntil(self.registration.showNotification(str(p.title, 100) || FALLBACK.title, options));
});

function safeTarget(raw) {
  try { const u = new URL(raw, self.location.origin); return ['http:', 'https:'].includes(u.protocol) ? u.href : self.location.origin + '/'; }
  catch (_) { return self.location.origin + '/'; }
}
async function track(d) {
  if (!d.sendId || !d.clickToken || !d.trackUrl) return;
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 5000);
  try {
    await fetch(d.trackUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sendId: d.sendId, clickToken: d.clickToken }), keepalive: true, credentials: 'omit', signal: ctl.signal });
  } catch (_) { /* tracking failure must NEVER block navigation */ } finally { clearTimeout(t); }
}
async function openTarget(target) {
  const dest = new URL(target);
  const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const c of wins) {
    if (new URL(c.url).origin === dest.origin && 'focus' in c) {
      try { await c.focus(); if (c.url !== target && 'navigate' in c) await c.navigate(target); return; } catch (_) { break; }
    }
  }
  if (self.clients.openWindow) await self.clients.openWindow(target);
}
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const d = event.notification.data || {};
  // Run both concurrently; allSettled guarantees a tracking error cannot stop the navigation.
  event.waitUntil(Promise.allSettled([track(d), openTarget(safeTarget(d.url))]));
});
