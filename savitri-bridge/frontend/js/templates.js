import { boot, showError, can } from './layout.js';
import { $, esc, fmtDate, badge, empty, loading, pager, debounce, toast, confirmDialog, params, fillForm, formData } from './utils.js';
import { api } from './api.js';
import { renderPreview, wireUploads, counter } from './notifForm.js';

export async function initList() {
  await boot('templates');
  const list = $('#list'); const pg = $('#pager'); const st = { page: 1, q: '' }; const w = can('templates.write');
  if (w) $('#new-btn').hidden = false;
  async function load() {
    loading(list);
    try {
      const r = await api.get('/templates', { ...st, limit: 15 });
      list.innerHTML = r.data.length ? `<div class="table-wrap"><table><thead><tr><th>Template</th><th>Scope</th><th>Type</th><th>Status</th><th>Updated</th><th class="right">Actions</th></tr></thead><tbody>${r.data.map((t) => `<tr>
        <td><strong>${esc(t.templateName)}</strong><br><span class="muted small">${esc(t.title)}</span></td><td>${esc(t.project?.name || 'Global')}</td><td>${badge(t.type)}</td><td>${badge(t.active ? 'active' : 'disabled', t.active ? 'Enabled' : 'Disabled')}</td><td class="small">${fmtDate(t.updatedAt)}</td>
        <td class="right nowrap">${t.active && w ? `<a class="btn btn-sm btn-primary" href="campaign-create.html?template=${t._id}">Use</a> ` : ''}${w ? `<a class="btn btn-sm" href="template-create.html?id=${t._id}">Edit</a> <button class="btn btn-sm" data-a="dup" data-id="${t._id}">Duplicate</button> <button class="btn btn-sm" data-a="tog" data-id="${t._id}">${t.active ? 'Disable' : 'Enable'}</button> <button class="btn btn-sm btn-danger" data-a="del" data-id="${t._id}">Delete</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`
        : empty('No templates yet', 'Templates let you reuse notification content across campaigns.');
      pager(pg, r.meta, (p) => { st.page = p; load(); });
    } catch (e) { showError(e, list); }
  }
  list.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return; const { a, id } = b.dataset;
    try {
      if (a === 'dup') { await api.post(`/templates/${id}/duplicate`); toast('Template duplicated', 'success'); }
      if (a === 'tog') { await api.patch(`/templates/${id}/toggle`); }
      if (a === 'del') { if (!(await confirmDialog({ title: 'Delete template?', message: 'Campaigns already created from it keep their content.', confirmText: 'Delete', danger: true }))) return; await api.del(`/templates/${id}`); toast('Template deleted', 'success'); }
      load();
    } catch (ex) { toast(ex.message, 'error'); }
  });
  $('#q').addEventListener('input', debounce((e) => { st.q = e.target.value; st.page = 1; load(); }));
  load();
}

export async function initCreate() {
  await boot('templates', 'Template');
  const f = $('#template-form'); const err = $('#form-error'); const id = params().get('id');
  try { const ps = (await api.get('/projects', { limit: 100 })).data; f.projectId.innerHTML = '<option value="">Global (any project)</option>' + ps.map((p) => `<option value="${p._id}">${esc(p.name)}</option>`).join(''); } catch (e) { showError(e, err); err.hidden = false; }
  const preview = () => renderPreview($('#preview'), formData(f));
  f.addEventListener('input', preview); wireUploads(f, preview); counter(f, 'title', 100); counter(f, 'body', 300);
  if (id) { try { const t = (await api.get(`/templates/${id}`)).data; fillForm(f, { ...t, projectId: t.projectId || '' }); $('#page-h').textContent = 'Edit template'; } catch (e) { showError(e, err); err.hidden = false; } }
  preview();
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); err.hidden = true; const d = formData(f); const btn = f.querySelector('[type=submit]'); btn.disabled = true;
    const b = { templateName: d.templateName.trim(), projectId: d.projectId || null, type: d.type, title: d.title.trim(), body: d.body.trim(), targetUrl: d.targetUrl.trim(), iconUrl: d.iconUrl.trim(), badgeUrl: d.badgeUrl.trim(), imageUrl: d.imageUrl.trim(), notificationTag: d.notificationTag.trim(), requireInteraction: !!d.requireInteraction, active: !!d.active };
    try { if (id) await api.put(`/templates/${id}`, b); else await api.post('/templates', b); toast('Template saved', 'success'); location.href = 'templates.html'; }
    catch (ex) { err.textContent = ex.message; err.hidden = false; btn.disabled = false; }
  });
}
