import { boot, showError } from './layout.js';
import { $, esc, fmtNum, pct, badge, relTime, empty, fmtDateTime } from './utils.js';
import { api } from './api.js';
import { lineChart } from './charts.js';

await boot('dashboard');
const stat = (label, value, hint = '') => `<div class="stat"><div class="label">${esc(label)}</div><div class="value">${value}</div>${hint ? `<div class="hint">${esc(hint)}</div>` : ''}</div>`;

try {
  const to = new Date(); const from = new Date(Date.now() - 30 * 86400000);
  const [o, r] = await Promise.all([api.get('/analytics/overview'), api.get('/analytics/report', { from: from.toISOString(), to: to.toISOString(), interval: 'day' })]);
  const d = o.data;
  $('#stats').innerHTML = [
    stat('Total projects', fmtNum(d.totalProjects)), stat('Active subscribers', fmtNum(d.activeSubscribers), `${fmtNum(d.activeSubscriptions)} active subscriptions`),
    stat('Scheduled campaigns', fmtNum(d.campaignsScheduled)), stat('Push attempts', fmtNum(d.pushAttempts), 'Backend tried to send'),
    stat('Accepted', fmtNum(d.accepted), 'By the push service (not device delivery)'), stat('Failures', fmtNum(d.failures), 'Failed or stale'),
    stat('Tracked clicks', fmtNum(d.trackedClicks), `Click rate ${pct(d.clickRate)} of accepted`)
  ].join('');

  $('#recent-campaigns').innerHTML = d.recentCampaigns.length
    ? `<div class="table-wrap"><table><thead><tr><th>Campaign</th><th>Project</th><th>Status</th><th>Accepted</th><th>Clicks</th></tr></thead><tbody>${d.recentCampaigns.map((c) => `<tr><td><a href="campaign-detail.html?id=${c._id}">${esc(c.campaignName)}</a></td><td>${esc(c.project?.name || 'All projects')}</td><td>${badge(c.status)}</td><td>${fmtNum(c.stats?.accepted)}</td><td>${fmtNum(c.stats?.clicks)}</td></tr>`).join('')}</tbody></table></div>`
    : empty('No campaigns yet', 'Create your first campaign to send a real Web Push.');

  $('#activity').innerHTML = d.recentActivity.length
    ? `<ul class="activity">${d.recentActivity.map((a) => `<li><span><strong>${esc(a.action.replace(/_/g, ' ').toLowerCase())}</strong><br><span class="muted small">${esc(a.actorEmail || 'system')}</span></span><span class="muted small nowrap" title="${esc(fmtDateTime(a.createdAt))}">${relTime(a.createdAt)}</span></li>`).join('')}</ul>`
    : '<p class="muted">Activity is visible to Admin and Viewer roles, or nothing has happened yet.</p>';

  lineChart($('#growth'), [{ name: 'Total subscribers', color: '#4f46e5', values: r.data.subscriberGrowth.map((g) => g.cumulative) }], { labels: r.data.subscriberGrowth.map((g) => g.date), area: true });
  const days = r.data.pushActivity;
  lineChart($('#activityChart'), [
    { name: 'Attempted', color: '#6366f1', values: days.map((x) => x.attempted) }, { name: 'Accepted', color: '#10b981', values: days.map((x) => x.accepted) }, { name: 'Failed', color: '#ef4444', values: days.map((x) => x.failed) }
  ], { labels: days.map((x) => x.date) });
} catch (e) { showError(e, $('#stats')); }
