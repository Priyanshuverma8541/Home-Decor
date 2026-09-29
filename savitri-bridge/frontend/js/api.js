import { ADMIN_API } from './config.js';
import { getToken, logout, getSession, setSession } from './auth.js';

export class ApiError extends Error { constructor(msg, code, status, details) { super(msg); this.code = code; this.status = status; this.details = details; } }

async function request(method, path, { params, body, raw, form } = {}) {
  const url = new URL(ADMIN_API + path);
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v); });
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try { res = await fetch(url, { method, headers, body: form || (body !== undefined ? JSON.stringify(body) : undefined) }); }
  catch { throw new ApiError('Cannot reach the SavitriBridge API. Check your connection and js/config.js.', 'NETWORK', 0); }
  if (raw) { if (!res.ok) throw new ApiError('Download failed', 'DOWNLOAD', res.status); return res; }
  const json = await res.json().catch(() => null);
  if (res.status === 401) { logout('expired'); throw new ApiError('Session expired', 'UNAUTHENTICATED', 401); }
  if (!res.ok || !json?.success) throw new ApiError(json?.error?.message || `Request failed (${res.status})`, json?.error?.code, res.status, json?.error?.details);
  return json;
}
export const api = {
  get: (p, params) => request('GET', p, { params }),
  post: (p, body) => request('POST', p, { body: body ?? {} }),
  put: (p, body) => request('PUT', p, { body }),
  patch: (p, body) => request('PATCH', p, { body: body ?? {} }),
  del: (p) => request('DELETE', p),
  upload: (p, file, params) => { const f = new FormData(); f.append('file', file); return request('POST', p, { form: f, params }); },
  async download(p, params) {
    const res = await request('GET', p, { params, raw: true });
    const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || 'export.csv';
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(await res.blob()), download: name });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
};
export function refreshSession(token, admin) { const s = getSession() || {}; setSession({ token: token || s.token, admin: admin || s.admin }); }
