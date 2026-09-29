import { boot, showError, can } from './layout.js';
import { $, esc, fmtNum, fmtDate, badge, empty, loading, pager, debounce, toast, confirmDialog, params, codeBlock, fillForm } from './utils.js';
import { api } from './api.js';

const originsFrom = (t) => t.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

function projectDialog(existing, onSaved) {
  const d = $('#project-dialog'); const f = $('#project-form'); const err = $('#project-error');
  f.reset(); err.hidden = true;
  $('#project-dialog-title').textContent = existing ? 'Edit project' : 'New project';
  if (existing) fillForm(f, { ...existing, allowedOrigins: existing.allowedOrigins.join('\n') });
  d.showModal();
  f.onsubmit = async (e) => {
    e.preventDefault(); err.hidden = true;
    const body = { name: f.name.value.trim(), description: f.description.value.trim(), websiteUrl: f.websiteUrl.value.trim(), allowedOrigins: originsFrom(f.allowedOrigins.value), defaultIconUrl: f.defaultIconUrl.value.trim(), defaultBadgeUrl: f.defaultBadgeUrl.value.trim() };
    const btn = f.querySelector('[type=submit]'); btn.disabled = true;
    try {
      const r = existing ? await api.put(`/projects/${existing._id}`, body) : await api.post('/projects', body);
      d.close(); toast(existing ? 'Project updated' : 'Project created', 'success'); onSaved(r.data);
    } catch (ex) { err.textContent = ex.message; err.hidden = false; } finally { btn.disabled = false; }
  };
}
$('#project-cancel')?.addEventListener('click', () => $('#project-dialog').close());

export async function initList() {
  await boot('projects');
  const list = $('#list'); const pg = $('#pager'); const st = { page: 1, q: '', status: '' };
  if (can('projects.write')) $('#new-btn').hidden = false;
  async function load() {
    loading(list);
    try {
      const r = await api.get('/projects', { page: st.page, q: st.q, status: st.status, limit: 15 });
      list.innerHTML = r.data.length ? `<div class="table-wrap"><table><thead><tr><th>Project</th><th>Status</th><th>Active subscribers</th><th>Campaigns</th><th>Allowed origins</th><th>Created</th></tr></thead><tbody>${r.data.map((p) => `<tr>
        <td><a href="project-detail.html?id=${p._id}"><strong>${esc(p.name)}</strong></a><br><span class="muted small mono">${esc(p.publicProjectId)}</span></td><td>${badge(p.status)}</td>
        <td>${fmtNum(p.subscriberCount)}</td><td>${fmtNum(p.campaignCount)}</td><td class="small">${p.allowedOrigins.map((o) => esc(o)).join('<br>') || '<span class="muted">none</span>'}</td><td>${fmtDate(p.createdAt)}</td></tr>`).join('')}</tbody></table></div>`
        : empty('No projects found', can('projects.write') ? 'Create a project to represent a website that will send push notifications.' : '');
      pager(pg, r.meta, (p) => { st.page = p; load(); });
    } catch (e) { showError(e, list); }
  }
  $('#q').addEventListener('input', debounce((e) => { st.q = e.target.value; st.page = 1; load(); }));
  $('#status').addEventListener('change', (e) => { st.status = e.target.value; st.page = 1; load(); });
  $('#new-btn').addEventListener('click', () => projectDialog(null, (p) => { location.href = `project-detail.html?id=${p._id}`; }));
  load();
}

export async function initDetail() {
  await boot('projects', 'Project');
  const id = params().get('id'); const root = $('#detail');
  if (!id) { root.innerHTML = empty('No project selected'); return; }
  async function load() {
    loading(root);
    try {
      const p = (await api.get(`/projects/${id}`)).data; const i = p.integration;
      const snippet = `<script src="https://YOUR-DASHBOARD-HOST/js/push-client.js"></script>\n<script>\n  PushBridgeClient.init({\n    apiBase: '${i.apiBase}',\n    projectId: '${i.publicProjectId}',\n    serviceWorkerPath: '/sw.js'\n  });\n  document.getElementById('enable-push').onclick = () => PushBridgeClient.enableNotifications();\n</script>`;
      document.title = `${p.name} · SavitriBridge`;
      root.innerHTML = `<div class="page-head"><div><h2>${esc(p.name)} ${badge(p.status)}</h2><p>${esc(p.description || 'No description')}</p></div>
        <div class="actions">${can('projects.write') ? `<button class="btn" id="edit">Edit</button><button class="btn ${p.status === 'active' ? 'btn-danger' : 'btn-primary'}" id="toggle">${p.status === 'active' ? 'Deactivate' : 'Activate'}</button>` : ''}
        <a class="btn btn-primary" href="campaign-create.html?projectId=${p._id}">New campaign</a></div></div>
        <div class="stat-grid" style="margin-bottom:16px"><div class="stat"><div class="label">Active subscribers</div><div class="value">${fmtNum(p.subscriberCount)}</div></div><div class="stat"><div class="label">Campaigns</div><div class="value">${fmtNum(p.campaignCount)}</div></div></div>
        <div class="split"><div class="card"><h3>Project details</h3><dl class="kv"><dt>Website</dt><dd>${p.websiteUrl ? `<a href="${esc(p.websiteUrl)}" target="_blank" rel="noopener">${esc(p.websiteUrl)}</a>` : '–'}</dd>
          <dt>Allowed origins</dt><dd>${p.allowedOrigins.map((o) => `<code>${esc(o)}</code>`).join('<br>') || '<span class="notice warn">None — browsers cannot register until an origin is added</span>'}</dd>
          <dt>Default icon</dt><dd>${p.defaultIconUrl ? `<img src="${esc(p.defaultIconUrl)}" alt="" width="40">` : '–'}</dd><dt>Created</dt><dd>${fmtDate(p.createdAt)}</dd></dl>
          <p style="margin-top:14px"><a href="subscribers.html?projectId=${p._id}">View subscribers →</a> · <a href="campaigns.html?projectId=${p._id}">View campaigns →</a></p></div>
        <div class="card"><h3>Integration</h3><dl class="kv"><dt>Public project ID</dt><dd><code>${esc(i.publicProjectId)}</code> <button class="btn btn-sm" data-copy="${esc(i.publicProjectId)}">Copy</button><div class="muted small">Not a secret.</div></dd>
          <dt>Public API URL</dt><dd><code>${esc(i.apiBase)}</code> <button class="btn btn-sm" data-copy="${esc(i.apiBase)}">Copy</button></dd>
          <dt>VAPID public key</dt><dd style="word-break:break-all"><code>${esc(i.vapidPublicKey)}</code> <button class="btn btn-sm" data-copy="${esc(i.vapidPublicKey)}">Copy</button></dd></dl>
          <p class="muted small" style="margin:12px 0 6px">Minimal browser snippet (contains no secrets):</p>${codeBlock(snippet, 'snip')}<p class="small" style="margin-top:8px"><a href="integration.html?projectId=${p._id}">Full integration guide →</a></p></div></div>`;
      $('#edit')?.addEventListener('click', () => projectDialog(p, load));
      $('#toggle')?.addEventListener('click', async () => {
        const to = p.status === 'active' ? 'inactive' : 'active';
        if (to === 'inactive' && !(await confirmDialog({ title: 'Deactivate project?', message: 'Websites will no longer be able to register new subscribers for this project. Existing subscriptions are kept.', confirmText: 'Deactivate', danger: true }))) return;
        try { await api.patch(`/projects/${p._id}/status`, { status: to }); toast(`Project ${to}`, 'success'); load(); } catch (e) { toast(e.message, 'error'); }
      });
    } catch (e) { showError(e, root); }
  }
  load();
}
