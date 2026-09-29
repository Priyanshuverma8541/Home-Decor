import { boot, showError, can } from './layout.js';
import { $, esc, fmtNum, pct, toast } from './utils.js';
import { api } from './api.js';
import { lineChart, hbars, donut } from './charts.js';

await boot('analytics');
const iso = (d) => d.toISOString().slice(0, 10);
$('#from').value = iso(new Date(Date.now() - 30 * 86400000)); $('#to').value = iso(new Date());
try { const ps = await api.get('/projects', { limit: 100 }); $('#project').innerHTML = '<option value="">All projects</option>' + ps.data.map((p) => `<option value="${p._id}">${esc(p.name)}</option>`).join(''); } catch {}
const card = (l, v, h = '') => `<div class="stat"><div class="label">${esc(l)}</div><div class="value">${v}</div>${h ? `<div class="hint">${esc(h)}</div>` : ''}</div>`;

async function load() {
  const err = $('#err'); err.hidden = true;
  try {
    const q = { from: $('#from').value, to: $('#to').value, interval: $('#interval').value, projectId: $('#project').value };
    const [ov, rp] = await Promise.all([api.get('/analytics/overview'), api.get('/analytics/report', q)]);
    const o = ov.data; const r = rp.data; const t = r.totals;
    $('#kpis').innerHTML = [card('Total projects', fmtNum(o.totalProjects)), card('Total subscribers', fmtNum(r.subscribersConsidered)), card('Active subscriptions', fmtNum(o.activeSubscriptions)), card('Inactive subscriptions', fmtNum(o.inactiveSubscriptions)),
      card('Total campaigns', fmtNum(o.totalCampaigns)), card('Completed', fmtNum(o.campaignsCompleted)), card('Scheduled', fmtNum(o.campaignsScheduled)),
      card('Push attempts', fmtNum(t.attempted), 'in selected period'), card('Push-service accepted', fmtNum(t.accepted)), card('Failures', fmtNum(t.failedTotal), `${fmtNum(t.stale)} stale`), card('Tracked clicks', fmtNum(t.clicked)), card('Click rate', pct(t.clickRate), 'clicks ÷ accepted')].join('');
    lineChart($('#c-growth'), [{ name: 'Total subscribers', color: '#4f46e5', values: r.subscriberGrowth.map((g) => g.cumulative) }, { name: 'New', color: '#22d3ee', values: r.subscriberGrowth.map((g) => g.count) }], { labels: r.subscriberGrowth.map((g) => g.date), area: true });
    const a = r.pushActivity;
    lineChart($('#c-push'), [{ name: 'Attempted', color: '#6366f1', values: a.map((x) => x.attempted) }, { name: 'Accepted', color: '#10b981', values: a.map((x) => x.accepted) }, { name: 'Failed', color: '#ef4444', values: a.map((x) => x.failed) }], { labels: a.map((x) => x.date) });
    donut($('#c-split'), [{ label: 'Accepted by push service', value: t.accepted, color: '#10b981' }, { label: 'Failed', value: t.failed, color: '#ef4444' }, { label: 'Stale subscription', value: t.stale, color: '#f59e0b' }]);
    lineChart($('#c-click'), [{ name: 'Tracked clicks', color: '#f59e0b', values: r.clickTrend.map((x) => x.clicks) }], { labels: r.clickTrend.map((x) => x.date) });
    const cp = r.campaignPerformance.slice().reverse();
    $('#c-camp').innerHTML = cp.length ? `<div class="table-wrap"><table><thead><tr><th>Campaign</th><th>Accepted</th><th>Failed</th><th>Clicks</th><th>Click rate</th></tr></thead><tbody>${cp.map((c) => `<tr><td>${esc(c.name)}</td><td>${fmtNum(c.accepted)}</td><td>${fmtNum(c.failed)}</td><td>${fmtNum(c.clicks)}</td><td>${pct(c.clickRate)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No campaigns sent in this period</div>';
    const pp = r.projectPerformance;
    $('#c-proj').innerHTML = pp.length ? `<div class="table-wrap"><table><thead><tr><th>Project</th><th>Attempted</th><th>Accepted</th><th>Failed</th><th>Clicks</th><th>Click rate</th></tr></thead><tbody>${pp.map((c) => `<tr><td>${esc(c.project)}</td><td>${fmtNum(c.attempted)}</td><td>${fmtNum(c.accepted)}</td><td>${fmtNum(c.failed)}</td><td>${fmtNum(c.clicks)}</td><td>${pct(c.clickRate)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No push activity in this period</div>';
    for (const [k, id] of [['deviceType', 'b-device'], ['browser', 'b-browser'], ['os', 'b-os'], ['country', 'b-country'], ['state', 'b-state'], ['city', 'b-city']]) hbars($(`#${id}`), r.breakdowns[k]);
    $('#defs').innerHTML = Object.entries(r.definitions).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
  } catch (e) { showError(e, err); err.hidden = false; }
}
['from', 'to', 'interval', 'project'].forEach((k) => $(`#${k}`).addEventListener('change', load));
if (can('exports')) {
  $('#exports').hidden = false;
  $('#exports').addEventListener('click', (e) => { const b = e.target.closest('[data-x]'); if (b) api.download(`/exports/${b.dataset.x}.csv`).catch((x) => toast(x.message, 'error')); });
}
load();
