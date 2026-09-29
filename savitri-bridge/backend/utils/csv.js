'use strict';
// CSV with formula-injection protection (cells starting with = + - @ are prefixed with an apostrophe).
function cell(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) v = v.toISOString();
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function toCsv(columns, rows) {
  const head = columns.map((c) => cell(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => cell(typeof c.value === 'function' ? c.value(r) : r[c.key])).join(','));
  return '\uFEFF' + [head, ...body].join('\r\n');
}
module.exports = { toCsv };
