import { $, esc, toast } from './utils.js';
import { api } from './api.js';

/** Live approximate notification preview. Real rendering differs per browser/OS. */
export function renderPreview(el, d, origin = '') {
  el.innerHTML = `<div class="np"><div class="np-top">${d.iconUrl ? `<img class="np-icon" src="${esc(d.iconUrl)}" alt="" onerror="this.style.visibility='hidden'">` : '<div class="np-icon"></div>'}
    <div><div class="np-origin">${esc(origin || (d.targetUrl ? safeHost(d.targetUrl) : 'your-site.com'))}</div><div class="np-title">${esc(d.title || 'Notification title')}</div><div class="np-body">${esc(d.body || 'Notification message appears here.')}</div></div></div>
    ${d.imageUrl ? `<img class="np-image" src="${esc(d.imageUrl)}" alt="" onerror="this.style.display='none'">` : ''}</div>
    <p class="muted small" style="margin-top:8px">Approximate preview. Browsers and operating systems render notifications differently; unsupported options (large image, badge, buttons) may be ignored.</p>`;
}
const safeHost = (u) => { try { return new URL(u).host; } catch { return ''; } };

/** Enhances .media-row fields: paste a URL OR upload a file (stored on Cloudinary by the backend). */
export function wireUploads(form, onChange) {
  form.querySelectorAll('[data-upload]').forEach((btn) => {
    const input = form.elements[btn.dataset.upload];
    const file = document.createElement('input'); file.type = 'file'; file.accept = 'image/png,image/jpeg,image/webp'; file.hidden = true; btn.after(file);
    btn.addEventListener('click', () => file.click());
    file.addEventListener('change', async () => {
      if (!file.files[0]) return;
      if (file.files[0].size > 3 * 1024 * 1024) { toast('Image must be 3 MB or smaller', 'error'); return; }
      btn.disabled = true; btn.textContent = 'Uploading…';
      try {
        const kind = btn.dataset.upload === 'iconUrl' ? 'icons' : btn.dataset.upload === 'badgeUrl' ? 'badges' : 'images';
        const r = await api.upload('/uploads/image', file.files[0], { kind });
        input.value = r.data.url; onChange?.(); toast('Image uploaded', 'success');
      } catch (e) { toast(e.message, 'error'); }
      finally { btn.disabled = false; btn.textContent = 'Upload'; file.value = ''; }
    });
  });
}
export const counter = (form, name, max) => {
  const f = form.elements[name]; const c = $(`[data-counter="${name}"]`); if (!f || !c) return;
  const upd = () => { c.textContent = `${f.value.length}/${max}`; }; f.addEventListener('input', upd); upd();
};
