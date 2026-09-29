import { boot } from './layout.js';
import { $, esc, codeBlock, params } from './utils.js';
import { api } from './api.js';
import { PUBLIC_API } from './config.js';

await boot('integration');
let pid = 'pk_YOUR_PUBLIC_PROJECT_ID'; let vapid = 'YOUR_VAPID_PUBLIC_KEY'; let origins = ['https://your-site.example'];
const host = location.origin;
try {
  const ps = (await api.get('/projects', { limit: 100 })).data;
  $('#project').innerHTML = ps.map((p) => `<option value="${p._id}">${esc(p.name)}</option>`).join('') || '<option value="">No projects yet</option>';
  const want = params().get('projectId'); if (want) $('#project').value = want;
  async function pick() {
    const id = $('#project').value; if (!id) return;
    const p = (await api.get(`/projects/${id}`)).data; pid = p.integration.publicProjectId; vapid = p.integration.vapidPublicKey; origins = p.allowedOrigins;
    render(p.name);
  }
  $('#project').onchange = pick; if (ps.length) await pick(); else render('');
} catch { render(''); }

function render() {
  $('#cfg').innerHTML = `<dl class="kv"><dt>Public project ID</dt><dd><code>${esc(pid)}</code> <button class="btn btn-sm" data-copy="${esc(pid)}">Copy</button></dd><dt>Public API URL</dt><dd><code>${esc(PUBLIC_API)}</code> <button class="btn btn-sm" data-copy="${esc(PUBLIC_API)}">Copy</button></dd><dt>VAPID public key</dt><dd style="word-break:break-all"><code>${esc(vapid)}</code></dd><dt>Allowed origins</dt><dd>${origins.map((o) => `<code>${esc(o)}</code>`).join('<br>') || 'none configured'}</dd></dl>`;
  $('#c-basic').innerHTML = codeBlock(`<!-- 1. Copy push-client.js and sw.js from SavitriBridge into your site (sw.js must be served from your site's root). -->
<script src="/push-client.js"></script>

<button id="enable-push" type="button">Enable notifications</button>
<button id="disable-push" type="button">Turn off</button>

<script>
  PushBridgeClient.init({
    apiBase: '${PUBLIC_API}',
    projectId: '${pid}',
    serviceWorkerPath: '/sw.js'
  });
  // Permission is requested ONLY from this click, never on page load.
  document.getElementById('enable-push').addEventListener('click', async () => {
    try { const r = await PushBridgeClient.enableNotifications(); alert('Subscribed: ' + r.subscriberId); }
    catch (e) { alert(e.message); }
  });
  document.getElementById('disable-push').addEventListener('click', () => PushBridgeClient.unsubscribeFromPush());
</script>`, 'c1');
  $('#c-sw').innerHTML = codeBlock(`// Option A: no service worker yet -> serve SavitriBridge's sw.js at /sw.js on your site.

// Option B: you ALREADY have a service worker -> do not register a second one with the same scope.
// Copy the 'push' and 'notificationclick' listeners from SavitriBridge's sw.js into your existing file,
// or pull them in with:  importScripts('/savitribridge-push.js');
// and pass your existing worker's path as serviceWorkerPath in PushBridgeClient.init(...).`, 'c2');
  $('#c-loc').innerHTML = codeBlock(`// Optional and separate from notification permission. Call ONLY from a click on e.g. "Share my location".
document.getElementById('share-location').addEventListener('click', async () => {
  try { const place = await PushBridgeClient.updateLocation(); console.log(place.city, place.country); }
  catch (e) { console.log('Location not shared:', e.message); } // push keeps working
});`, 'c3');
  $('#c-status').innerHTML = codeBlock(`const s = await PushBridgeClient.getSubscriptionStatus();
// { supported, permission, serviceWorker, browserSubscribed, subscriberId, platform:{ pushActive, ... }, locationPermission }`, 'c4');
  $('#c-livings').innerHTML = codeBlock(`// Savitri Livings (https://home-decor-inky.vercel.app) - example, Channel A (browser only)
PushBridgeClient.init({ apiBase: '${PUBLIC_API}', projectId: '${pid}', serviceWorkerPath: '/sw.js' });
// Add the "Enable notifications" button to the storefront UI and wire it as shown above.
// Allowed origin to add to the Savitri Livings project in SavitriBridge:  https://home-decor-inky.vercel.app`, 'c5');
  $('#c-future').innerHTML = codeBlock(`POST /api/v1/integration/send        (planned, NOT implemented in v1)
Authorization: Bearer <server-side API key>   // server-to-server only, never in browser code
{ "externalRef": "order-1042", "audience": { "subscriberId": "SUB_xxx" }, "message": { "title": "...", "body": "...", "url": "https://..." } }`, 'c6');
}
