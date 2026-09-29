import { boot, showError } from './layout.js';
import { $, esc, fmtDateTime, badge, empty, loading, pager, debounce, toast } from './utils.js';
import { api } from './api.js';
import { can } from './auth.js';

await boot('logs');
let tab = 'audit'; const st = { page: 1, q: '' };
const list = $('#list'); const pg = $('#pager');
async function load() {
  loading(list);
  try {
    if (tab === 'audit') {
      const r = await api.get('/logs/audit', { page: st.page, q: st.q, limit: 25 });
      list.innerHTML = r.data.length ? `<div class="table-wrap"><table><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Resource</th><th>Details</th></tr></thead><tbody>${r.data.map((a) => `<tr><td class="small nowrap">${fmtDateTime(a.createdAt)}</td><td class="small">${esc(a.actorEmail || 'system')}</td><td><span class="badge brand">${esc(a.action)}</span></td><td class="small mono">${esc(a.resourceType || '')} ${esc(a.resourceId || '')}</td><td class="small muted">${a.metadata ? esc(JSON.stringify(a.metadata)).slice(0, 140) : ''}</td></tr>`).join('')}</tbody></table></div>` : empty('No audit records');
      pager(pg, r.meta, (p) => { st.page = p; load(); });
    } else {
      const r = await api.get('/logs/failures', { page: st.page, limit: 25 });
      list.innerHTML = r.data.length ? `<div class="table-wrap"><table><thead><tr><th>Attempted</th><th>Campaign</th><th>Subscriber</th><th>Result</th><th>HTTP</th><th>Category</th><th>Message (sanitised)</th></tr></thead><tbody>${r.data.map((a) => `<tr><td class="small nowrap">${fmtDateTime(a.attemptedAt)}</td><td>${a.campaign ? `<a href="campaign-detail.html?id=${a.campaign._id}">${esc(a.campaign.campaignName)}</a>` : '–'}</td><td><a class="mono" href="subscriber-detail.html?id=${esc(a.subscriberId)}">${esc(a.subscriberId)}</a></td><td>${badge(a.result)}</td><td>${a.pushServiceStatus ?? '–'}</td><td class="small">${esc(a.errorCategory || '')}</td><td class="small muted">${esc(a.errorMessage || '')}</td></tr>`).join('')}</tbody></table></div>` : empty('No push failures recorded', 'Great news, or nothing has been sent yet.');
      pager(pg, r.meta, (p) => { st.page = p; load(); });
    }
  } catch (e) { showError(e, list); }
}
document.querySelectorAll('[role=tab]').forEach((t) => t.addEventListener('click', () => { tab = t.dataset.tab; st.page = 1; document.querySelectorAll('[role=tab]').forEach((x) => x.setAttribute('aria-selected', x === t)); $('#q-wrap').hidden = tab !== 'audit'; load(); }));
$('#q').addEventListener('input', debounce((e) => { st.q = e.target.value; st.page = 1; load(); }));
if (can('exports')) { $('#export-fail').hidden = false; $('#export-fail').onclick = () => api.download('/exports/push-failures.csv').catch((e) => toast(e.message, 'error')); }
load();
