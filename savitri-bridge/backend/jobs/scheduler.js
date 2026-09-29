'use strict';
const config = require('../config/env');
const Campaign = require('../models/Campaign');
const { claim, run } = require('../services/campaignService');

// MongoDB-backed scheduler. State lives in the database; claiming is atomic, so several instances can
// run this safely without double-sending. A queue (BullMQ/Redis) can later replace tick() while
// campaignService.claim()/run() stay unchanged.
let busy = false;
async function tick() {
  if (busy) return;
  busy = true;
  try {
    for (;;) {
      const c = await claim({ status: 'SCHEDULED', scheduledAt: { $lte: new Date() } });
      if (!c) break;
      console.log('[scheduler] sending scheduled campaign', c._id.toString());
      await run(c);
    }
  } catch (e) { console.error('[scheduler] tick error:', e.message); }
  finally { busy = false; }
}

// A campaign stuck in PROCESSING (server crashed mid-send) is marked FAILED rather than resent, to avoid duplicate notifications.
async function recoverStuck() {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const r = await Campaign.updateMany({ status: 'PROCESSING', lockedAt: { $lt: cutoff } },
    { $set: { status: 'FAILED', lastError: 'Interrupted (server restarted during send). Check delivery attempts before resending.', completedAt: new Date() } });
  if (r.modifiedCount) console.warn('[scheduler] marked', r.modifiedCount, 'interrupted campaign(s) as FAILED');
}

function start() {
  if (!config.scheduler.enabled) { console.log('[scheduler] disabled'); return; }
  recoverStuck().catch(() => {});
  setInterval(tick, config.scheduler.intervalSeconds * 1000).unref();
  console.log(`[scheduler] running every ${config.scheduler.intervalSeconds}s`);
}
module.exports = { start, tick };
