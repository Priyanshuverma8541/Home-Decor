import { boot, showError, can } from './layout.js';
import { $, esc, fmtNum, fmtDateTime, relTime, badge, empty, loading, pager, debounce, toast, confirmDialog, params } from './utils.js';
import { api } from './api.js';

export async function initList() {
  await boot('subscribers');
  const list = $('#list'); const pg = $('#pager');
  const st = { page: 1, q: '', status: '', projectId: params().get('projectId') || '', deviceType: '', sort: '-createdAt' };
  try { const ps = await api.get('/projects', { limit: 100 }); $('#project').innerHTML = '<option value="">All projects</option>' + ps.data.map((p) => `<option value="${p._id}" ${p._id === st.projectId ? 'selected' : ''}>${esc(p.name)}</option>`).join(''); } catch {}
  if (can('exports')) { $('#export').hidden = false; $('#export').onclick = () => api.download('/exports/subscribers.csv', { projectId: st.projectId, status: st.status, q: st.q, deviceType: st.deviceType }).catch((e) => toast(e.message, 'error')); }
  async function load() {
    loading(list);
    try {
      const r = await api.get('/subscribers', { ...st, limit: 20 });
      const sortLink = (f, label) => `<a href="#" data-sort="${f}">${label}${st.sort === f ? ' ↑' : st.sort === '-' + f ? ' ↓' : ''}</a>`;
      list.innerHTML = r.data.length ? `<div class="table-wrap"><table><thead><tr><th>${sortLink('subscriberId', 'Subscriber')}</th><th>Project</th><th>Status</th><th>Device</th><th>Language / TZ</th><th>Location</th><th>Subs</th><th>${sortLink('createdAt', 'Created')}</th><th>${sortLink('lastSeenAt', 'Last seen')}</th></tr></thead><tbody>${r.data.map((s) => `<tr>
        <td><a class="mono" href="subscriber-detail.html?id=${esc(s.subscriberId)}">${esc(s.subscriberId)}</a></td><td>${esc(s.project?.name || '–')}</td><td>${badge(s.status)}</td>
        <td class="small">${esc(s.device?.deviceType || '–')}<br><span class="muted">${esc([s.device?.browser, s.device?.os].filter(Boolean).join(' · '))}</span></td>
        <td class="small">${esc(s.language || '–')}<br><span class="muted">${esc(s.timezone || '')}</span></td>
        <td class="small">${s.location?.city || s.location?.country ? esc([s.location.city, s.location.country].filter(Boolean).join(', ')) + ' <span class="badge ok" title="Shared by the user via browser permission">permitted</span>' : '<span class="muted">not shared</span>'}</td>
        <td>${s.activeSubscriptions}/${s.subscriptionCount}</td><td class="small nowrap">${fmtDateTime(s.createdAt)}</td><td class="small nowrap">${relTime(s.lastSeenAt)}</td></tr>`).join('')}</tbody></table></div>`
        : empty('No subscribers match', 'Open the Demo page in a supported browser and click “Enable Notifications” to create one.');
      pager(pg, r.meta, (p) => { st.page = p; load(); });
    } catch (e) { showError(e, list); }
  }
  list.addEventListener('click', (e) => { const a = e.target.closest('[data-sort]'); if (!a) return; e.preventDefault(); const f = a.dataset.sort; st.sort = st.sort === f ? '-' + f : f; load(); });
  $('#q').addEventListener('input', debounce((e) => { st.q = e.target.value; st.page = 1; load(); }));
  $('#project').addEventListener('change', (e) => { st.projectId = e.target.value; st.page = 1; load(); });
  $('#status').addEventListener('change', (e) => { st.status = e.target.value; st.page = 1; load(); });
  $('#device').addEventListener('change', (e) => { st.deviceType = e.target.value; st.page = 1; load(); });
  load();
}

export async function initDetail() {
  await boot('subscribers', 'Subscriber');
  const id = params().get('id'); const root = $('#detail');
  if (!id) { root.innerHTML = empty('No subscriber selected'); return; }
  async function load() {
    loading(root);
    try {
      const s = (await api.get(`/subscribers/${encodeURIComponent(id)}`)).data; const dv = s.device || {}; const loc = s.location;
      const act = (a) => `<tr><td class="small nowrap">${fmtDateTime(a.attemptedAt)}</td><td>${a.campaign ? `<a href="campaign-detail.html?id=${a.campaign._id}">${esc(a.campaign.campaignName)}</a>` : '–'}</td><td>${badge(a.result)}</td><td class="small">${esc([a.pushServiceStatus, a.errorCategory].filter(Boolean).join(' · ') || '–')}</td><td class="small">${a.clickedAt ? `Clicked ${relTime(a.clickedAt)}` : '–'}</td></tr>`;
      root.innerHTML = `<div class="page-head"><div><h2 class="mono">${esc(s.subscriberId)} ${badge(s.status)}</h2><p>Browser/device subscriber in <a href="project-detail.html?id=${s.project?._id}">${esc(s.project?.name || 'project')}</a></p></div>
        <div class="actions">${can('push.test') && s.status === 'active' ? '<button class="btn btn-primary" id="test">Send test push</button>' : ''}
        ${can('subscribers.manage') ? (s.status === 'disabled' || s.status === 'inactive' ? '<button class="btn" id="enable">Re-enable</button>' : '<button class="btn" id="disable">Disable</button>') + '<button class="btn btn-danger" id="delete">Delete data</button>' : ''}</div></div>
        <div class="grid cols-2"><div class="card"><h3>Device &amp; browser</h3><dl class="kv"><dt>Device type</dt><dd>${esc(dv.deviceType || '–')}</dd><dt>Browser</dt><dd>${esc([dv.browser, dv.browserVersion].filter(Boolean).join(' ') || '–')}</dd><dt>Operating system</dt><dd>${esc([dv.os, dv.osVersion].filter(Boolean).join(' ') || '–')}</dd>
          <dt>Language</dt><dd>${esc(s.language || '–')}</dd><dt>Timezone</dt><dd>${esc(s.timezone || '–')}</dd><dt>Screen</dt><dd>${dv.screenWidth ? `${dv.screenWidth}×${dv.screenHeight} @${dv.pixelRatio || 1}x` : '–'}</dd><dt>Created</dt><dd>${fmtDateTime(s.createdAt)}</dd><dt>Last seen</dt><dd>${fmtDateTime(s.lastSeenAt)}</dd></dl>
          <p class="muted small" style="margin-top:10px">Device details are best-effort browser metadata, not identity.</p></div>
        <div class="card"><h3>Permissions &amp; location</h3><dl class="kv"><dt>Notification permission</dt><dd>${badge(s.permissions?.push || 'unknown')}</dd><dt>Location permission</dt><dd>${badge(s.permissions?.location || 'unknown')}</dd>
          <dt>Place</dt><dd>${loc?.city || loc?.country ? esc([loc.city, loc.state, loc.country].filter(Boolean).join(', ')) : '<span class="muted">Not shared</span>'}</dd>
          ${loc?.capturedAt ? `<dt>Coordinates</dt><dd>${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)} (±${Math.round(loc.accuracy || 0)} m)</dd><dt>Captured</dt><dd>${fmtDateTime(loc.capturedAt)}</dd>` : ''}</dl>
          ${loc?.capturedAt ? '<p class="small muted" style="margin-top:10px">Location was shared by the user through the browser permission prompt. Address data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> (Nominatim).</p>' : ''}
          <p class="small muted">Re-enabling here only restores platform-side delivery. It cannot override a browser permission the user has blocked.</p></div></div>
        <div class="card" style="margin-top:16px"><h3>Push subscriptions (${s.subscriptions.length})</h3>${s.subscriptions.length ? `<div class="table-wrap"><table><thead><tr><th>Status</th><th>Created</th><th>Last success</th><th>Last failure</th><th>Failures</th></tr></thead><tbody>${s.subscriptions.map((x) => `<tr><td>${badge(x.status)}</td><td class="small">${fmtDateTime(x.createdAt)}</td><td class="small">${fmtDateTime(x.lastSuccessAt)}</td><td class="small">${fmtDateTime(x.lastFailureAt)}</td><td>${x.failureCount || 0}</td></tr>`).join('')}</tbody></table></div><p class="muted small">Endpoint and encryption keys are stored securely and never shown.</p>` : empty('No subscriptions')}</div>
        <div class="card" style="margin-top:16px"><div class="card-head"><h3>Recent campaign activity</h3><span class="badge brand">${fmtNum(s.trackedClicks)} tracked clicks</span></div>${s.recentActivity.length ? `<div class="table-wrap"><table><thead><tr><th>Attempted</th><th>Campaign</th><th>Result</th><th>Details</th><th>Click</th></tr></thead><tbody>${s.recentActivity.map(act).join('')}</tbody></table></div>` : empty('No pushes sent to this subscriber yet')}</div>
        ${s.recentFailures.length ? `<div class="card" style="margin-top:16px"><h3>Recent push failures</h3><div class="table-wrap"><table><thead><tr><th>Attempted</th><th>Campaign</th><th>Result</th><th>Details</th><th></th></tr></thead><tbody>${s.recentFailures.map(act).join('')}</tbody></table></div></div>` : ''}`;
      $('#test')?.addEventListener('click', async () => {
        if (!(await confirmDialog({ title: 'Send test push?', message: `A real Web Push will be sent to ${s.subscriberId}. It is recorded as a transactional test campaign.`, confirmText: 'Send test push' }))) return;
        try { const r = await api.post(`/subscribers/${encodeURIComponent(id)}/test-push`, { confirm: true }); toast(r.data.message, 'success'); setTimeout(load, 4000); } catch (e) { toast(e.message, 'error'); }
      });
      $('#disable')?.addEventListener('click', async () => { if (await confirmDialog({ title: 'Disable subscriber?', message: 'No campaigns will be sent to this subscriber until re-enabled.', confirmText: 'Disable', danger: true })) { try { await api.post(`/subscribers/${encodeURIComponent(id)}/disable`); toast('Subscriber disabled', 'success'); load(); } catch (e) { toast(e.message, 'error'); } } });
      $('#enable')?.addEventListener('click', async () => { try { await api.post(`/subscribers/${encodeURIComponent(id)}/enable`); toast('Subscriber re-enabled at platform level', 'success'); load(); } catch (e) { toast(e.message, 'error'); } });
      $('#delete')?.addEventListener('click', async () => {
        if (!(await confirmDialog({ title: 'Delete subscriber data?', message: 'This permanently removes push credentials, device details and location for this subscriber. Aggregate campaign statistics are kept without personal data. This cannot be undone.', confirmText: 'Delete data', danger: true }))) return;
        try { await api.del(`/subscribers/${encodeURIComponent(id)}`); toast('Subscriber data deleted', 'success'); location.href = 'subscribers.html'; } catch (e) { toast(e.message, 'error'); }
      });
    } catch (e) { showError(e, root); }
  }
  load();
}
