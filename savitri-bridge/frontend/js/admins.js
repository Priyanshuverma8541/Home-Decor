import { boot, showError } from './layout.js';
import { $, esc, fmtDateTime, badge, empty, loading, toast, confirmDialog } from './utils.js';
import { api } from './api.js';
import { getAdmin } from './auth.js';

const me = await boot('admins');
const list = $('#list');
const ROLE_HELP = { SUPER_ADMIN: 'Full access incl. admin management', ADMIN: 'Projects, subscribers, campaigns, templates, analytics, logs', MARKETER: 'Campaigns, templates, media, analytics; no admin rights', VIEWER: 'Read-only' };

async function load() {
  loading(list);
  try {
    const r = await api.get('/admins');
    list.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last login</th><th>Created</th><th class="right">Actions</th></tr></thead><tbody>${r.data.map((a) => `<tr>
      <td><strong>${esc(a.name)}</strong>${a._id === me._id ? ' <span class="badge">you</span>' : ''}</td><td>${esc(a.email)}</td><td>${badge(a.role)}</td><td>${badge(a.active ? 'active' : 'disabled', a.active ? 'Active' : 'Deactivated')}</td>
      <td class="small">${fmtDateTime(a.lastLoginAt)}</td><td class="small">${fmtDateTime(a.createdAt)}</td>
      <td class="right nowrap"><button class="btn btn-sm" data-a="role" data-id="${a._id}" data-role="${a.role}" ${a._id === me._id ? 'disabled' : ''}>Change role</button> <button class="btn btn-sm" data-a="pw" data-id="${a._id}">Reset password</button> <button class="btn btn-sm ${a.active ? 'btn-danger' : ''}" data-a="act" data-id="${a._id}" data-active="${a.active}" ${a._id === me._id ? 'disabled' : ''}>${a.active ? 'Deactivate' : 'Activate'}</button></td></tr>`).join('')}</tbody></table></div>`;
  } catch (e) { showError(e, list); }
}
list.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-a]'); if (!b) return; const { a, id } = b.dataset;
  try {
    if (a === 'act') {
      const to = b.dataset.active !== 'true';
      if (!(await confirmDialog({ title: to ? 'Activate admin?' : 'Deactivate admin?', message: to ? 'They will be able to sign in again.' : 'They will be signed out immediately.', confirmText: to ? 'Activate' : 'Deactivate', danger: !to }))) return;
      await api.patch(`/admins/${id}`, { active: to }); toast('Updated', 'success'); load();
    }
    if (a === 'role') { $('#role-dlg').dataset.id = id; $('#role-select').value = b.dataset.role; $('#role-dlg').showModal(); }
    if (a === 'pw') { $('#pw-dlg').dataset.id = id; $('#pw-form').reset(); $('#pw-err').hidden = true; $('#pw-dlg').showModal(); }
  } catch (ex) { toast(ex.message, 'error'); }
});
$('#new-btn').onclick = () => { $('#admin-form').reset(); $('#admin-err').hidden = true; $('#admin-dlg').showModal(); };
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
$('#role-select').addEventListener('change', (e) => { $('#role-help').textContent = ROLE_HELP[e.target.value]; });
$('#admin-form').addEventListener('submit', async (e) => {
  e.preventDefault(); const f = e.target; const err = $('#admin-err'); err.hidden = true;
  try { await api.post('/admins', { name: f.name.value.trim(), email: f.email.value.trim(), role: f.role.value, password: f.password.value }); $('#admin-dlg').close(); toast('Admin created', 'success'); load(); }
  catch (ex) { err.textContent = ex.message; err.hidden = false; }
});
$('#role-save').onclick = async () => { try { await api.patch(`/admins/${$('#role-dlg').dataset.id}`, { role: $('#role-select').value }); $('#role-dlg').close(); toast('Role updated. The admin must sign in again.', 'success'); load(); } catch (ex) { toast(ex.message, 'error'); } };
$('#pw-form').addEventListener('submit', async (e) => {
  e.preventDefault(); const err = $('#pw-err'); err.hidden = true;
  try { await api.post(`/admins/${$('#pw-dlg').dataset.id}/reset-password`, { newPassword: e.target.newPassword.value }); $('#pw-dlg').close(); toast('Password reset', 'success'); } catch (ex) { err.textContent = ex.message; err.hidden = false; }
});
load();
