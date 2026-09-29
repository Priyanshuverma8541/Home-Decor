import { boot, showError } from './layout.js';
import { $, esc, toast, copyText } from './utils.js';
import { api, refreshSession } from './api.js';

await boot('settings');
const yn = (v) => `<span class="badge ${v ? 'ok' : 'warn'}">${v ? 'Yes' : 'No'}</span>`;
try {
  const s = (await api.get('/settings')).data;
  $('#sys').innerHTML = `<dl class="kv"><dt>Version</dt><dd>${esc(s.version)}</dd><dt>Environment</dt><dd>${esc(s.environment)}</dd><dt>Public API base</dt><dd><code>${esc(s.publicApiBase)}</code></dd>
    <dt>Dashboard origins</dt><dd>${s.dashboardOrigins.map((o) => `<code>${esc(o)}</code>`).join('<br>')}</dd><dt>VAPID public key</dt><dd style="word-break:break-all"><code>${esc(s.vapidPublicKey)}</code></dd>
    <dt>Cloudinary uploads</dt><dd>${yn(s.cloudinaryConfigured)}</dd><dt>Scheduler</dt><dd>${yn(s.scheduler.enabled)} every ${s.scheduler.intervalSeconds}s</dd><dt>Push batching</dt><dd>${s.push.batchSize} per batch, ${s.push.concurrency} concurrent, TTL ${s.push.ttl}s</dd>
    <dt>Geocoder</dt><dd>${esc(s.nominatim.baseUrl)}</dd><dt>Session lifetime</dt><dd>${esc(s.jwtExpiresIn)}</dd></dl><p class="muted small">Secrets (JWT secret, VAPID private key, Cloudinary secret, database URI) are configured as backend environment variables and are never shown here.</p>`;
  $('#rates').innerHTML = `<dl class="kv">${Object.entries(s.rateLimits).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl><p class="muted small">Change these with the RATE_* environment variables.</p>`;
} catch (e) { if (e.status === 403) $('#sys-card').hidden = true; else showError(e, $('#sys')); }
$('#pw-form').addEventListener('submit', async (e) => {
  e.preventDefault(); const f = e.target; const err = $('#pw-err'); err.hidden = true;
  if (f.newPassword.value !== f.confirm.value) { err.textContent = 'New passwords do not match'; err.hidden = false; return; }
  try { const r = await api.post('/auth/change-password', { currentPassword: f.currentPassword.value, newPassword: f.newPassword.value }); refreshSession(r.data.token); f.reset(); toast('Password changed. Other sessions were signed out.', 'success'); }
  catch (ex) { err.textContent = ex.message; err.hidden = false; }
});
