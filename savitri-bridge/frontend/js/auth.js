import { ADMIN_API } from './config.js';
// Session lives in sessionStorage: cleared when the tab closes, never in URLs. Token expiry is enforced by the server.
const KEY = 'sb_session';
export const getSession = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } };
export const setSession = (s) => sessionStorage.setItem(KEY, JSON.stringify(s));
export const clearSession = () => sessionStorage.removeItem(KEY);
export const getToken = () => getSession()?.token || '';
export const getAdmin = () => getSession()?.admin || null;

// UI mirror of the backend RBAC matrix (the backend is the real enforcement).
const ROLES = { ALL: ['SUPER_ADMIN', 'ADMIN', 'MARKETER', 'VIEWER'], OPS: ['SUPER_ADMIN', 'ADMIN'], WRITE: ['SUPER_ADMIN', 'ADMIN', 'MARKETER'], LOGS: ['SUPER_ADMIN', 'ADMIN', 'VIEWER'], SUPER: ['SUPER_ADMIN'] };
export const PERMS = {
  'projects.write': ROLES.OPS, 'subscribers.manage': ROLES.OPS, 'push.test': ROLES.WRITE, 'campaigns.write': ROLES.WRITE, 'templates.write': ROLES.WRITE,
  'exports': ROLES.WRITE, 'logs': ROLES.LOGS, 'admins': ROLES.SUPER, 'settings': ROLES.OPS
};
export const can = (perm) => (PERMS[perm] || []).includes(getAdmin()?.role);

export function requireAuth() {
  if (!getToken()) { location.replace('login.html'); return false; }
  return true;
}
export function logout(reason) {
  clearSession();
  location.replace('login.html' + (reason ? `?${reason}=1` : ''));
}
export async function initLogin() {
  if (getToken()) { location.replace('index.html'); return; }
  const form = document.getElementById('login-form'); const err = document.getElementById('login-error'); const btn = form.querySelector('button[type=submit]');
  if (new URLSearchParams(location.search).get('expired')) { err.textContent = 'Your session expired. Please sign in again.'; err.hidden = false; }
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); err.hidden = true; btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      const res = await fetch(`${ADMIN_API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email.value.trim(), password: form.password.value }) });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || 'Sign-in failed');
      setSession({ token: json.data.token, admin: json.data.admin });
      location.replace('index.html');
    } catch (ex) {
      err.textContent = ex.message === 'Failed to fetch' ? 'Cannot reach the SavitriBridge API. Check js/config.js and that the backend is running.' : ex.message;
      err.hidden = false; btn.disabled = false; btn.textContent = 'Sign in';
    }
  });
}
