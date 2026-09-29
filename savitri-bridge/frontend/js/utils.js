export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmtNum = (n) => (n === undefined || n === null ? '–' : Number(n).toLocaleString());
export const pct = (x) => `${((x || 0) * 100).toFixed(1)}%`;
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '–');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–');
export function relTime(d) {
  if (!d) return '–';
  const s = Math.round((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s / 60)} min ago`; if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return fmtDate(d);
}
export const debounce = (fn, ms = 350) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
export const params = () => new URLSearchParams(location.search);

const BADGES = {
  active: 'ok', inactive: 'warn', disabled: 'err', deleted: 'err', unsubscribed: 'warn', expired: 'err', invalid: 'err',
  DRAFT: '', SCHEDULED: 'info', PROCESSING: 'warn', COMPLETED: 'ok', PARTIALLY_FAILED: 'warn', FAILED: 'err', CANCELLED: '',
  ACCEPTED_BY_PUSH_SERVICE: 'ok', STALE_SUBSCRIPTION: 'warn', ATTEMPTED: 'info',
  SUPER_ADMIN: 'brand', ADMIN: 'info', MARKETER: 'ok', VIEWER: '', MARKETING: 'info', TRANSACTIONAL: 'brand'
};
export const badge = (v, label) => `<span class="badge ${BADGES[v] || ''}">${esc(label || String(v).replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()))}</span>`;
export const empty = (title, msg = '') => `<div class="empty"><strong>${esc(title)}</strong>${esc(msg)}</div>`;
export const loading = (el, msg = 'Loading…') => { el.innerHTML = `<div class="loading" role="status">${esc(msg)}</div>`; };

export function toast(msg, type = 'info') {
  const box = $('#toasts') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'toasts', className: 'toasts', ariaLive: 'polite' }));
  const t = Object.assign(document.createElement('div'), { className: `toast ${type}`, textContent: msg });
  box.appendChild(t);
  setTimeout(() => t.remove(), type === 'error' ? 7000 : 4000);
}

/** Promise-based confirm dialog built on <dialog>. */
export function confirmDialog({ title, message = '', html = '', confirmText = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.setAttribute('aria-labelledby', 'cd-title');
    d.innerHTML = `<div class="dlg-head"><h3 id="cd-title">${esc(title)}</h3></div><div class="dlg-body">${html || `<p>${esc(message)}</p>`}</div>
      <div class="dlg-foot"><button class="btn" data-v="0" type="button">Cancel</button><button class="btn ${danger ? 'btn-solid-danger' : 'btn-primary'}" data-v="1" type="button">${esc(confirmText)}</button></div>`;
    document.body.appendChild(d);
    d.addEventListener('click', (e) => { const v = e.target.closest('[data-v]')?.dataset.v; if (v !== undefined) { d.close(); resolve(v === '1'); } });
    d.addEventListener('cancel', () => resolve(false));
    d.addEventListener('close', () => d.remove());
    d.showModal();
    d.querySelector('[data-v="0"]').focus();
  });
}

export function pager(el, meta, onPage) {
  if (!meta) { el.innerHTML = ''; return; }
  el.innerHTML = `<span class="muted small">${fmtNum(meta.total)} result${meta.total === 1 ? '' : 's'} · page ${meta.page} of ${meta.pages}</span>
    <span class="actions"><button class="btn btn-sm" data-p="${meta.page - 1}" ${meta.page <= 1 ? 'disabled' : ''}>Previous</button><button class="btn btn-sm" data-p="${meta.page + 1}" ${meta.page >= meta.pages ? 'disabled' : ''}>Next</button></span>`;
  el.onclick = (e) => { const b = e.target.closest('button[data-p]'); if (b && !b.disabled) onPage(Number(b.dataset.p)); };
}

/** Converts a wall-clock date+time in an IANA timezone to a UTC ISO string (DST-aware). */
export function zonedToUtc(dateStr, timeStr, tz) {
  const [y, m, d] = dateStr.split('-').map(Number); const [H, M] = timeStr.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, H, M);
  const offsetAt = (ts) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ts;
  };
  let guess = wall - offsetAt(wall);
  guess = wall - offsetAt(guess); // second pass handles DST boundaries
  return new Date(guess).toISOString();
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied to clipboard', 'success'); }
  catch { const t = Object.assign(document.createElement('textarea'), { value: text }); document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); toast('Copied', 'success'); }
}
export function bindCopy(root = document) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    const target = b.dataset.copy.startsWith('#') ? $(b.dataset.copy)?.textContent : b.dataset.copy;
    copyText(target || '');
  });
}
export const codeBlock = (code, id) => `<div class="codeblock"><button class="btn btn-sm copy" type="button" data-copy="#${id}">Copy</button><pre><code id="${id}">${esc(code)}</code></pre></div>`;
export const fillForm = (form, data) => { for (const [k, v] of Object.entries(data || {})) { const f = form.elements[k]; if (!f) continue; if (f.type === 'checkbox') f.checked = !!v; else f.value = v ?? ''; } };
export function formData(form) {
  const o = {};
  for (const f of form.elements) {
    if (!f.name || f.disabled || f.type === 'file' || f.type === 'radio' && !f.checked) continue;
    o[f.name] = f.type === 'checkbox' ? f.checked : f.value;
  }
  return o;
}
