import { esc, fmtNum } from './utils.js';
// Tiny dependency-free SVG charts.
const W = 640; const H = 220; const M = { t: 12, r: 12, b: 28, l: 40 };
const shortDate = (d) => { const x = new Date(d); return `${x.toLocaleString(undefined, { month: 'short' })} ${x.getUTCDate()}`; };

export function lineChart(el, series, { labels = [], area = false } = {}) {
  const n = labels.length;
  if (!n) { el.innerHTML = '<div class="empty">No data in this period</div>'; return; }
  const max = Math.max(1, ...series.flatMap((s) => s.values)); const nice = Math.ceil(max / 4) * 4 || 4;
  const x = (i) => M.l + (n === 1 ? (W - M.l - M.r) / 2 : (i * (W - M.l - M.r)) / (n - 1)); const y = (v) => M.t + (H - M.t - M.b) * (1 - v / nice);
  const grid = [0, 1, 2, 3, 4].map((k) => { const v = (nice * k) / 4; return `<line class="grid-line" x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${M.l - 6}" y="${y(v) + 4}" text-anchor="end">${fmtNum(Math.round(v))}</text>`; }).join('');
  const step = Math.ceil(n / 7);
  const xl = labels.map((l, i) => (i % step === 0 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(shortDate(l))}</text>` : '')).join('');
  const paths = series.map((s) => {
    const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    return `${area ? `<polygon points="${M.l},${y(0)} ${pts} ${x(n - 1)},${y(0)}" fill="${s.color}" opacity=".12"/>` : ''}<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round"/>
      ${s.values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${s.color}"><title>${esc(s.name)}: ${fmtNum(v)} (${esc(shortDate(labels[i]))})</title></circle>`).join('')}`;
  }).join('');
  el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(series.map((s) => s.name).join(', '))} over time">${grid}${xl}${paths}</svg>
    <div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
}

export function hbars(el, items, { max } = {}) {
  if (!items?.length) { el.innerHTML = '<div class="empty">No data yet</div>'; return; }
  const m = max || Math.max(...items.map((i) => i.count));
  el.innerHTML = `<div class="hbars">${items.map((i) => `<div class="hbar"><span class="lbl" title="${esc(i.label)}">${esc(i.label)}</span><span class="track"><span class="fill" style="width:${Math.max(2, (i.count / m) * 100)}%"></span></span><span class="val">${fmtNum(i.count)}</span></div>`).join('')}</div>`;
}

export function donut(el, parts) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  if (!total) { el.innerHTML = '<div class="empty">No push attempts yet</div>'; return; }
  const R = 60; const C = 2 * Math.PI * R; let off = 0;
  const arcs = parts.filter((p) => p.value).map((p) => { const len = (p.value / total) * C; const s = `<circle r="${R}" cx="80" cy="80" fill="none" stroke="${p.color}" stroke-width="26" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 80 80)"><title>${esc(p.label)}: ${fmtNum(p.value)}</title></circle>`; off += len; return s; }).join('');
  el.innerHTML = `<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Result split">${arcs}<text x="80" y="85" text-anchor="middle" style="font-size:18px;font-weight:700;fill:#0f172a">${fmtNum(total)}</text></svg>
    <div class="legend" style="flex-direction:column;gap:6px">${parts.map((p) => `<span><i style="background:${p.color}"></i>${esc(p.label)}: <strong>${fmtNum(p.value)}</strong></span>`).join('')}</div></div>`;
}
