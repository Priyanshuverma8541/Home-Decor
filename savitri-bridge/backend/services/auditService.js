'use strict';
const AuditLog = require('../models/AuditLog');

const SECRET_KEYS = /pass|secret|token|key|auth|endpoint|p256dh|jwt/i;
function sanitize(meta, depth = 0) {
  if (meta === null || typeof meta !== 'object' || depth > 3) return meta;
  if (Array.isArray(meta)) return meta.slice(0, 20).map((v) => sanitize(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(meta)) out[k] = SECRET_KEYS.test(k) ? '[redacted]' : sanitize(v, depth + 1);
  return out;
}

/** Fire-and-forget: audit failures must never break the request. */
async function audit(req, action, resourceType, resourceId, metadata) {
  try {
    await AuditLog.create({
      actor: req?.admin?._id, actorEmail: req?.admin?.email, action, resourceType,
      resourceId: resourceId ? String(resourceId) : undefined, metadata: sanitize(metadata), ip: req?.ip
    });
  } catch (e) { console.error('[audit] failed:', e.message); }
}
module.exports = { audit };
