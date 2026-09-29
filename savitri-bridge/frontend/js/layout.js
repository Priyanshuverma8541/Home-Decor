import { $, esc, toast, bindCopy } from './utils.js';
import { requireAuth, getAdmin, setSession, getToken, logout, can } from './auth.js';
import { api } from './api.js';

const I = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const ICONS = {
  dashboard: I('<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>'),
  projects: I('<path d="M3 7h18M3 12h18M3 17h18"/>'),
  subscribers: I('<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M21 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
  campaigns: I('<path d="M4 4l16 8-16 8 3-8z"/>'),
  templates: I('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>'),
  analytics: I('<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>'),
  logs: I('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
  admins: I('<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>'),
  integration: I('<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>'),
  guide: I('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V22h16"/>'),
  settings: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  menu: I('<path d="M3 6h18M3 12h18M3 18h18"/>'),
  bell: I('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>')
};
const NAV = [
  ['dashboard', 'Dashboard', 'index.html', null], ['projects', 'Projects', 'projects.html', null], ['subscribers', 'Subscribers', 'subscribers.html', null],
  ['campaigns', 'Campaigns', 'campaigns.html', null], ['templates', 'Templates', 'templates.html', null], ['analytics', 'Analytics', 'analytics.html', null],
  ['logs', 'Logs', 'logs.html', 'logs'], ['admins', 'Admins', 'admins.html', 'admins'], ['integration', 'Integration', 'integration.html', null],
  ['guide', 'Guide', 'guide.html', null], ['settings', 'Settings', 'settings.html', 'settings']
];
const TITLES = { dashboard: 'Dashboard', projects: 'Projects', subscribers: 'Subscribers', campaigns: 'Campaigns', templates: 'Templates', analytics: 'Analytics', logs: 'Logs', admins: 'Admin users', integration: 'Integration', guide: 'Guide', settings: 'Settings' };

/** Call at the top of every dashboard page. Returns the signed-in admin. */
export async function boot(page, title) {
  if (!requireAuth()) return new Promise(() => {});
  bindCopy();
  try { const me = await api.get('/auth/me'); setSession({ token: getToken(), admin: me.data.admin }); } catch (e) { if (e.status === 401) return new Promise(() => {}); }
  const admin = getAdmin();
  const nav = NAV.filter(([, , , perm]) => !perm || can(perm));
  $('#sidebar').innerHTML = `<a class="brand" href="index.html"><span class="brand-mark">${ICONS.bell}</span>SavitriBridge</a>
    <nav aria-label="Main"><ul class="nav">${nav.map(([k, label, href]) => `<li><a href="${href}" ${k === page ? 'aria-current="page"' : ''}>${ICONS[k]}${label}</a></li>`).join('')}</ul></nav>
    <div class="sidebar-foot">Web Push platform · v1.0<br>Push ≠ delivery guarantee</div>`;
  $('#topbar').innerHTML = `<button class="btn btn-sm menu-btn" id="menu-btn" aria-label="Open navigation" aria-expanded="false">${ICONS.menu}</button>
    <h1>${esc(title || TITLES[page] || '')}</h1>
    <div class="user-chip"><span class="who small"><strong>${esc(admin.name)}</strong><br><span class="muted">${esc(admin.role.replace('_', ' ').toLowerCase())}</span></span><span class="avatar" aria-hidden="true">${esc(admin.name.slice(0, 1).toUpperCase())}</span><button class="btn btn-sm" id="logout-btn">Sign out</button></div>`;
  document.body.insertAdjacentHTML('beforeend', '<div class="scrim" id="scrim"></div>');
  const setNav = (open) => { document.body.classList.toggle('nav-open', open); $('#menu-btn').setAttribute('aria-expanded', open); };
  $('#menu-btn').onclick = () => setNav(!document.body.classList.contains('nav-open'));
  $('#scrim').onclick = () => setNav(false);
  $('#logout-btn').onclick = () => logout();
  document.title = `${title || TITLES[page] || 'SavitriBridge'} · SavitriBridge`;
  return admin;
}
export const showError = (e, el) => {
  const msg = e?.message || 'Something went wrong';
  if (el) el.innerHTML = `<div class="notice err" role="alert">${esc(msg)}</div>`; else toast(msg, 'error');
};
export { can };
