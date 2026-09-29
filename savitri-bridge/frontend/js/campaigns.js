import { boot, showError, can } from './layout.js';
import { $, esc, fmtNum, fmtDateTime, pct, badge, empty, loading, pager, debounce, toast, confirmDialog, params, zonedToUtc, fillForm, formData } from './utils.js';
import { api } from './api.js';
import { CONFIG } from './config.js';
import { renderPreview, wireUploads, counter } from './notifForm.js';

const TZS = ['Asia/Kolkata', 'UTC', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Australia/Sydney'];
const AUD = { ALL_ACTIVE: 'All active subscribers', PROJECT: 'All active subscribers of a project', SUBSCRIBER: 'Individual subscriber' };

export async function initList() {
  await boot('campaigns');
  const list = $('#list'); const pg = $('#pager'); const st = { page: 1, q: '', status: '', projectId: params().get('projectId') || '', type: '' };
  if (can('campaigns.write')) $('#new-btn').hidden = false;
  try { const ps = await api.get('/projects', { limit: 100 }); $('#project').innerHTML = '<option value="">All projects</option>' + ps.data.map((p) => `<option value="${p._id}" ${p._id === st.projectId ? 'selected' : ''}>${esc(p.name)}</option>`).join(''); } catch {}
  if (can('exports')) { $('#export').hidden = false; $('#export').onclick = () => api.download('/exports/campaigns.csv').catch((e) => toast(e.message, 'error')); }
  async function load() {
    loading(list);
    try {
      const r = await api.get('/campaigns', { ...st, limit: 15 });
      list.innerHTML = r.data.length ? `<div class="table-wrap"><table><thead><tr><th>Campaign</th><th>Project / audience</th><th>Type</th><th>Status</th><th>When</th><th>Accepted</th><th>Clicks</th></tr></thead><tbody>${r.data.map((c) => `<tr>
        <td><a href="campaign-detail.html?id=${c._id}"><strong>${esc(c.campaignName)}</strong></a><br><span class="muted small">${esc(c.title)}</span></td><td class="small">${esc(c.project?.name || 'All projects')}<br><span class="muted">${esc(AUD[c.audienceType])}</span></td>
        <td>${badge(c.type)}</td><td>${badge(c.status)}</td><td class="small nowrap">${c.status === 'SCHEDULED' ? fmtDateTime(c.scheduledAt) : c.sentAt ? fmtDateTime(c.sentAt) : '–'}</td><td>${fmtNum(c.stats?.accepted)}</td><td>${fmtNum(c.stats?.clicks)}</td></tr>`).join('')}</tbody></table></div>`
        : empty('No campaigns yet', 'Create a campaign to send a rich push notification now or on a schedule.');
      pager(pg, r.meta, (p) => { st.page = p; load(); });
    } catch (e) { showError(e, list); }
  }
  $('#q').addEventListener('input', debounce((e) => { st.q = e.target.value; st.page = 1; load(); }));
  ['status', 'project', 'type'].forEach((k) => $(`#${k}`).addEventListener('change', (e) => { st[k === 'project' ? 'projectId' : k] = e.target.value; st.page = 1; load(); }));
  load();
}

export async function initCreate() {
  await boot('campaigns', 'Campaign');
  const f = $('#campaign-form'); const err = $('#form-error'); const q = params(); let editId = q.get('id'); let projects = [];
  f.timezone.innerHTML = TZS.map((z) => `<option ${z === CONFIG.DEFAULT_TIMEZONE ? 'selected' : ''}>${z}</option>`).join('');
  try {
    projects = (await api.get('/projects', { limit: 100 })).data.filter((p) => p.status === 'active');
    f.projectId.innerHTML = '<option value="">Select a project…</option>' + projects.map((p) => `<option value="${p._id}">${esc(p.name)}</option>`).join('');
    const tpls = (await api.get('/templates', { limit: 100, active: 'true' })).data;
    f.templateId.innerHTML = '<option value="">— none (write from scratch) —</option>' + tpls.map((t) => `<option value="${t._id}">${esc(t.templateName)}</option>`).join('');
    f._tpls = tpls;
  } catch (e) { showError(e, err); err.hidden = false; }
  const preview = () => renderPreview($('#preview'), formData(f));
  const syncAudience = () => {
    const a = f.audienceType.value;
    $('#aud-project').hidden = a !== 'PROJECT'; $('#aud-sub').hidden = a !== 'SUBSCRIBER';
    f.projectId.required = a === 'PROJECT'; f.selectedSubscriberId.required = a === 'SUBSCRIBER';
  };
  const applyTemplate = (t) => { fillForm(f, { title: t.title, body: t.body, targetUrl: t.targetUrl, iconUrl: t.iconUrl, badgeUrl: t.badgeUrl, imageUrl: t.imageUrl, notificationTag: t.notificationTag, requireInteraction: t.requireInteraction, type: t.type }); preview(); };
  f.templateId.addEventListener('change', () => { const t = f._tpls?.find((x) => x._id === f.templateId.value); if (t) applyTemplate(t); });
  f.projectId.addEventListener('change', () => {
    const p = projects.find((x) => x._id === f.projectId.value); if (!p) return;
    if (!f.iconUrl.value) f.iconUrl.value = p.defaultIconUrl || ''; if (!f.badgeUrl.value) f.badgeUrl.value = p.defaultBadgeUrl || '';
    if (!f.targetUrl.value) f.targetUrl.value = p.websiteUrl || p.allowedOrigins[0] || ''; preview();
  });
  f.querySelectorAll('input[name=audienceType]').forEach((r) => r.addEventListener('change', syncAudience));
  f.addEventListener('input', preview); wireUploads(f, preview); counter(f, 'title', 100); counter(f, 'body', 300);

  if (editId) {
    try {
      const c = (await api.get(`/campaigns/${editId}`)).data;
      if (!['DRAFT', 'SCHEDULED'].includes(c.status)) { showError(new Error('Only draft or scheduled campaigns can be edited.'), err); err.hidden = false; f.querySelectorAll('button,input,select,textarea').forEach((x) => { x.disabled = true; }); return; }
      fillForm(f, c); f.querySelector(`input[name=audienceType][value=${c.audienceType}]`).checked = true; if (c.projectId) f.projectId.value = c.projectId;
      if (c.status === 'SCHEDULED') { const d = new Date(c.scheduledAt); f.timezone.value = c.timezone; f.schedDate.value = d.toISOString().slice(0, 10); f.schedTime.value = d.toISOString().slice(11, 16); $('#sched-note').textContent = `Currently scheduled for ${fmtDateTime(c.scheduledAt)}. Set a new date/time below to reschedule (entered in the selected timezone).`; }
      $('#page-h').textContent = 'Edit campaign';
    } catch (e) { showError(e, err); err.hidden = false; }
  } else {
    if (q.get('projectId')) { f.querySelector('input[name=audienceType][value=PROJECT]').checked = true; f.projectId.value = q.get('projectId'); f.projectId.dispatchEvent(new Event('change')); }
    if (q.get('subscriberId')) { f.querySelector('input[name=audienceType][value=SUBSCRIBER]').checked = true; f.selectedSubscriberId.value = q.get('subscriberId'); }
    if (q.get('template')) { f.templateId.value = q.get('template'); f.templateId.dispatchEvent(new Event('change')); }
  }
  syncAudience(); preview();

  function body() {
    const d = formData(f); const b = { campaignName: d.campaignName.trim(), type: d.type, title: d.title.trim(), body: d.body.trim(), targetUrl: d.targetUrl.trim(), iconUrl: d.iconUrl.trim(), badgeUrl: d.badgeUrl.trim(), imageUrl: d.imageUrl.trim(), notificationTag: d.notificationTag.trim(), requireInteraction: !!d.requireInteraction, audienceType: d.audienceType };
    if (d.audienceType === 'PROJECT') b.projectId = d.projectId;
    if (d.audienceType === 'SUBSCRIBER') b.selectedSubscriberId = d.selectedSubscriberId.trim();
    if (d.templateId) b.templateId = d.templateId;
    return b;
  }
  async function save() {
    if (!f.reportValidity()) throw new Error('Please complete the required fields.');
    const r = editId ? await api.put(`/campaigns/${editId}`, body()) : await api.post('/campaigns', body());
    editId = r.data._id; history.replaceState(null, '', `?id=${editId}`); return r.data;
  }
  const busy = (b) => f.querySelectorAll('button').forEach((x) => { x.disabled = b; });
  const wrap = (fn) => async () => { err.hidden = true; busy(true); try { await fn(); } catch (ex) { err.textContent = ex.message; err.hidden = false; err.scrollIntoView({ block: 'center' }); } finally { busy(false); } };

  async function summary(c) {
    const est = (await api.post('/campaigns/estimate', { audienceType: c.audienceType, projectId: c.projectId || undefined, selectedSubscriberId: c.selectedSubscriberId })).data.targetSubscriptions;
    const pname = c.audienceType === 'ALL_ACTIVE' ? 'All projects' : (projects.find((p) => p._id === c.projectId)?.name || c.selectedSubscriberId || '–');
    return { est, html: `<dl class="kv"><dt>Project</dt><dd>${esc(pname)}</dd><dt>Audience</dt><dd>${esc(AUD[c.audienceType])}</dd><dt>Estimated target subscriptions</dt><dd><strong>${fmtNum(est)}</strong></dd><dt>Title</dt><dd>${esc(c.title)}</dd><dt>Message</dt><dd>${esc(c.body)}</dd></dl>` };
  }
  $('#save-draft').onclick = wrap(async () => { await save(); toast('Draft saved', 'success'); location.href = `campaign-detail.html?id=${editId}`; });
  $('#send-now').onclick = wrap(async () => {
    const c = await save(); const s = await summary(c);
    if (!s.est) throw new Error('No active subscriptions match this audience, so there is nothing to send. The draft was saved.');
    if (!(await confirmDialog({ title: 'You are about to send this campaign', html: s.html + '<p class="muted small">This sends real push messages immediately and cannot be undone.</p>', confirmText: 'Confirm send' }))) return;
    await api.post(`/campaigns/${editId}/send`, { confirm: true }); toast('Campaign is sending', 'success'); location.href = `campaign-detail.html?id=${editId}`;
  });
  $('#schedule').onclick = wrap(async () => {
    if (!f.schedDate.value || !f.schedTime.value) throw new Error('Pick a date and time to schedule.');
    const iso = zonedToUtc(f.schedDate.value, f.schedTime.value, f.timezone.value);
    if (new Date(iso) < new Date(Date.now() + 60000)) throw new Error('The scheduled time must be in the future.');
    const c = await save(); const s = await summary(c);
    if (!(await confirmDialog({ title: 'Schedule this campaign?', html: s.html + `<p><strong>Sends at:</strong> ${esc(f.schedDate.value)} ${esc(f.schedTime.value)} (${esc(f.timezone.value)})<br><span class="muted small">= ${esc(fmtDateTime(iso))} in your browser's timezone</span></p>`, confirmText: 'Confirm schedule' }))) return;
    await api.post(`/campaigns/${editId}/schedule`, { scheduledAt: iso, timezone: f.timezone.value }); toast('Campaign scheduled', 'success'); location.href = `campaign-detail.html?id=${editId}`;
  });
}

export async function initDetail() {
  await boot('campaigns', 'Campaign');
  const id = params().get('id'); const root = $('#detail'); let timer;
  if (!id) { root.innerHTML = empty('No campaign selected'); return; }
  let attemptFilter = ''; let attemptPage = 1;
  async function load() {
    try {
      const c = (await api.get(`/campaigns/${id}`)).data; const s = c.stats || {};
      const edit = ['DRAFT', 'SCHEDULED'].includes(c.status); const w = can('campaigns.write');
      root.innerHTML = `<div class="page-head"><div><h2>${esc(c.campaignName)} ${badge(c.status)} ${badge(c.type)} ${c.isTest ? '<span class="badge">TEST</span>' : ''}</h2><p>${esc(c.project?.name || 'All projects')} · ${esc(AUD[c.audienceType])}${c.selectedSubscriberId ? ` (${esc(c.selectedSubscriberId)})` : ''}</p></div>
        <div class="actions">${w && edit ? `<a class="btn" href="campaign-create.html?id=${c._id}">Edit</a><button class="btn btn-primary" id="send">Send now</button>` : ''}${w && edit ? '<button class="btn btn-danger" id="cancel">Cancel</button>' : ''}${w ? '<button class="btn" id="dup">Duplicate</button>' : ''}${w && ['DRAFT', 'CANCELLED'].includes(c.status) ? '<button class="btn btn-danger" id="del">Delete</button>' : ''}</div></div>
        ${c.lastError ? `<div class="notice err">${esc(c.lastError)}</div>` : ''}${c.status === 'SCHEDULED' ? `<div class="notice">Scheduled for <strong>${fmtDateTime(c.scheduledAt)}</strong> (${esc(c.timezone)}). The backend sends it even if nobody is online.</div>` : ''}${c.status === 'PROCESSING' ? '<div class="notice warn" role="status">Sending… this page refreshes automatically.</div>' : ''}
        <div class="stat-grid" style="margin-bottom:16px">${[['Targeted', s.targeted], ['Attempted', s.attempted], ['Accepted by push service', s.accepted], ['Failed', s.failed], ['Stale (removed)', s.stale], ['Tracked clicks', s.clicks]].map(([l, v]) => `<div class="stat"><div class="label">${l}</div><div class="value">${fmtNum(v)}</div></div>`).join('')}<div class="stat"><div class="label">Click rate</div><div class="value">${pct(s.accepted ? s.clicks / s.accepted : 0)}</div><div class="hint">clicks ÷ accepted</div></div></div>
        <p class="muted small">“Accepted” means the browser vendor's push service accepted the message. It is not proof the notification reached or was shown on the device. Opens and impressions are not measurable.</p>
        <div class="split"><div class="card"><h3>Content</h3><dl class="kv"><dt>Title</dt><dd>${esc(c.title)}</dd><dt>Message</dt><dd>${esc(c.body)}</dd><dt>Target URL</dt><dd><a href="${esc(c.targetUrl)}" target="_blank" rel="noopener noreferrer">${esc(c.targetUrl)}</a></dd><dt>Tag</dt><dd>${esc(c.notificationTag || '–')}</dd><dt>Require interaction</dt><dd>${c.requireInteraction ? 'Yes' : 'No'}</dd><dt>Created by</dt><dd>${esc(c.createdBy?.name || '–')} · ${fmtDateTime(c.createdAt)}</dd><dt>Sent</dt><dd>${fmtDateTime(c.sentAt)}</dd><dt>Completed</dt><dd>${fmtDateTime(c.completedAt)}</dd></dl></div>
        <div id="preview"></div></div>
        <div class="card" style="margin-top:16px"><div class="card-head"><h3>Delivery attempts</h3><select id="af" aria-label="Filter attempts"><option value="">All results</option><option value="ACCEPTED_BY_PUSH_SERVICE">Accepted</option><option value="FAILED">Failed</option><option value="STALE_SUBSCRIPTION">Stale</option></select></div>
        ${c.errorBreakdown?.length ? `<p class="small">Error categories: ${c.errorBreakdown.map((e) => `<span class="badge err">${esc(e._id)} × ${e.n}</span>`).join(' ')}</p>` : ''}<div id="attempts"></div><div class="pager" id="apager"></div></div>`;
      renderPreview($('#preview'), c);
      $('#af').value = attemptFilter; $('#af').onchange = (e) => { attemptFilter = e.target.value; attemptPage = 1; loadAttempts(); };
      $('#send')?.addEventListener('click', async () => {
        const est = (await api.post('/campaigns/estimate', { audienceType: c.audienceType, projectId: c.projectId, selectedSubscriberId: c.selectedSubscriberId })).data.targetSubscriptions;
        if (!(await confirmDialog({ title: 'You are about to send this campaign', html: `<dl class="kv"><dt>Audience</dt><dd>${esc(AUD[c.audienceType])}</dd><dt>Estimated targets</dt><dd><strong>${fmtNum(est)}</strong></dd><dt>Title</dt><dd>${esc(c.title)}</dd></dl>`, confirmText: 'Confirm send' }))) return;
        try { await api.post(`/campaigns/${id}/send`, { confirm: true }); toast('Campaign is sending', 'success'); load(); } catch (e) { toast(e.message, 'error'); }
      });
      $('#cancel')?.addEventListener('click', async () => { if (await confirmDialog({ title: 'Cancel campaign?', message: 'It will not be sent.', confirmText: 'Cancel campaign', danger: true })) { try { await api.post(`/campaigns/${id}/cancel`); toast('Campaign cancelled', 'success'); load(); } catch (e) { toast(e.message, 'error'); } } });
      $('#dup')?.addEventListener('click', async () => { try { const r = await api.post(`/campaigns/${id}/duplicate`); location.href = `campaign-create.html?id=${r.data._id}`; } catch (e) { toast(e.message, 'error'); } });
      $('#del')?.addEventListener('click', async () => { if (await confirmDialog({ title: 'Delete campaign?', message: 'This cannot be undone.', confirmText: 'Delete', danger: true })) { try { await api.del(`/campaigns/${id}`); location.href = 'campaigns.html'; } catch (e) { toast(e.message, 'error'); } } });
      loadAttempts();
      clearTimeout(timer); if (c.status === 'PROCESSING') timer = setTimeout(load, 4000);
    } catch (e) { showError(e, root); }
  }
  async function loadAttempts() {
    const box = $('#attempts'); if (!box) return;
    try {
      const r = await api.get(`/campaigns/${id}/attempts`, { page: attemptPage, limit: 15, result: attemptFilter });
      box.innerHTML = r.data.length ? `<div class="table-wrap"><table><thead><tr><th>Attempted</th><th>Subscriber</th><th>Result</th><th>HTTP</th><th>Error</th><th>Clicked</th></tr></thead><tbody>${r.data.map((a) => `<tr><td class="small nowrap">${fmtDateTime(a.attemptedAt)}</td><td><a class="mono" href="subscriber-detail.html?id=${esc(a.subscriberId)}">${esc(a.subscriberId)}</a></td><td>${badge(a.result)}</td><td>${a.pushServiceStatus ?? '–'}</td><td class="small">${esc(a.errorCategory || '')}</td><td class="small">${a.clickedAt ? fmtDateTime(a.clickedAt) : '–'}</td></tr>`).join('')}</tbody></table></div>` : empty('No attempts recorded');
      const { pager } = await import('./utils.js'); pager($('#apager'), r.meta, (p) => { attemptPage = p; loadAttempts(); });
    } catch (e) { showError(e, box); }
  }
  load();
}
