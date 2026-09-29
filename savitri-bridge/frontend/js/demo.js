// Demo subscriber page logic. Uses the same reusable client that external websites use.
import { PUBLIC_API } from './config.js';
const $ = (s) => document.querySelector(s);
const q = new URLSearchParams(location.search);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dot = (cls) => `<span class="status-dot ${cls}"></span>`;
const KEY = 'sb_demo_project';

// Project id can come from ?project=pk_... or be typed once and remembered in this browser.
let projectId = q.get('project') || localStorage.getItem(KEY) || '';
$('#project-id').value = projectId;

function setup() {
  projectId = $('#project-id').value.trim();
  if (!/^pk_[a-f0-9]{20}$/.test(projectId)) { $('#setup-msg').textContent = 'Enter a valid public project ID (looks like pk_ followed by 20 characters). Create a project in the dashboard whose allowed origins include this page\'s origin.'; return false; }
  localStorage.setItem(KEY, projectId); $('#setup-msg').textContent = '';
  PushBridgeClient.init({ apiBase: PUBLIC_API, projectId, serviceWorkerPath: 'sw.js', storagePrefix: 'sb_demo' });
  return true;
}
const msg = (t, type = 'info') => { const m = $('#msg'); m.className = `notice ${type === 'error' ? 'err' : type === 'ok' ? 'ok' : ''}`; m.textContent = t; m.hidden = !t; };

async function refresh() {
  if (!setup()) return;
  try {
    const s = await PushBridgeClient.getSubscriptionStatus();
    const p = s.platform || {};
    $('#origin').textContent = location.origin;
    $('#st-support').innerHTML = s.supported ? `${dot('ok')}Supported` : `${dot('err')}Not supported in this browser`;
    $('#st-sw').innerHTML = s.serviceWorker ? `${dot('ok')}Registered` : `${dot('warn')}Not registered yet`;
    $('#st-perm').innerHTML = `${dot(s.permission === 'granted' ? 'ok' : s.permission === 'denied' ? 'err' : 'warn')}${esc(s.permission)}`;
    $('#st-sub').innerHTML = s.browserSubscribed ? `${dot('ok')}Browser subscription exists${p.pushActive ? ' · active on platform' : ' · not active on platform'}` : `${dot('warn')}Not subscribed`;
    $('#st-id').textContent = s.subscriberId || '–';
    $('#st-loc').innerHTML = `${dot(s.locationPermission === 'granted' ? 'ok' : s.locationPermission === 'denied' ? 'err' : 'warn')}${esc(s.locationPermission)}${p.location ? ` · ${esc([p.location.city, p.location.country].filter(Boolean).join(', '))}` : ''}`;
    const dv = p.device || {}; const meta = PushBridgeClient.collectDeviceMetadata();
    $('#st-dev').textContent = [dv.deviceType, dv.browser, dv.os].filter(Boolean).join(' · ') || `${meta.platform || 'unknown'} (registers on subscribe)`;
    if (s.platformError) msg(`Platform says: ${s.platformError}`, 'error');
    $('#enable').disabled = !s.supported; $('#disable').disabled = !s.browserSubscribed; $('#loc').disabled = !s.subscriberId;
  } catch (e) { msg(e.message, 'error'); }
}
$('#save-project').addEventListener('click', refresh);
$('#enable').addEventListener('click', async () => {
  if (!setup()) return; msg('Requesting permission…');
  try { const r = await PushBridgeClient.enableNotifications(); msg(`Subscribed as ${r.subscriberId}. Now send a real push from the dashboard (Subscribers → Send test push).`, 'ok'); } catch (e) { msg(e.message, 'error'); }
  refresh();
});
$('#disable').addEventListener('click', async () => { if (!setup()) return; try { await PushBridgeClient.unsubscribeFromPush(); msg('Unsubscribed. Browser permission itself stays as you set it in browser settings.', 'ok'); } catch (e) { msg(e.message, 'error'); } refresh(); });
$('#loc').addEventListener('click', async () => {
  if (!setup()) return; msg('Waiting for the browser location prompt…');
  try { const p = await PushBridgeClient.updateLocation(); msg(`Location saved: ${[p.city, p.state, p.country].filter(Boolean).join(', ') || 'coordinates stored (address lookup unavailable)'}`, 'ok'); } catch (e) { msg(`${e.message}. Push notifications still work without location.`, 'error'); }
  refresh();
});
$('#refresh').addEventListener('click', refresh);
$('#local-test').addEventListener('click', async () => {
  // LOCAL TEST: shown by this page itself, no server involved. It does NOT prove remote push works.
  if (Notification.permission !== 'granted') { msg('Enable notifications first.', 'error'); return; }
  const reg = await navigator.serviceWorker.getRegistration();
  (reg || { showNotification: (t, o) => new Notification(t, o) }).showNotification('LOCAL TEST notification', { body: 'Shown locally by this page. This is not a remote Web Push.', tag: 'sb-local-test' });
});
if (projectId) refresh();
