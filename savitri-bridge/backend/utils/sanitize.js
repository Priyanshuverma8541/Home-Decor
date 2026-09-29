'use strict';
// Removes Mongo operator keys ("$..." or dotted keys) from request payloads (NoSQL-injection hardening).
function clean(obj, depth = 0) {
  if (depth > 8 || obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => clean(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$') || k.includes('.')) continue;
    out[k] = clean(v, depth + 1);
  }
  return out;
}
module.exports = (req, _res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.query) { const q = clean(req.query); for (const k of Object.keys(req.query)) delete req.query[k]; Object.assign(req.query, q); }
  next();
};
