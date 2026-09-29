'use strict';
const config = require('../config/env');
const GeoCache = require('../models/GeoCache');

// Public Nominatim policy: identify the app (User-Agent), max 1 request/second, cache results.
// It suits low/moderate volume; swap this service for a paid/self-hosted geocoder at larger scale.
let lastCall = 0;
let chain = Promise.resolve();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function throttled(fn) {
  const run = chain.then(async () => {
    const gap = Date.now() - lastCall;
    if (gap < 1100) await wait(1100 - gap);
    lastCall = Date.now();
    return fn();
  });
  chain = run.catch(() => {});
  return run;
}

function validateCoordinates(lat, lon) {
  const la = Number(lat); const lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo) || la < -90 || la > 90 || lo < -180 || lo > 180) return null;
  return { lat: la, lon: lo };
}

function parse(json) {
  const a = json?.address || {};
  const out = {
    country: a.country || null,
    state: a.state || a.region || a.state_district || null,
    city: a.city || a.town || a.village || a.municipality || a.suburb || a.county || null,
    postalCode: a.postcode || null,
    displayName: json?.display_name ? String(json.display_name).slice(0, 300) : null
  };
  out.status = out.country && out.city ? 'OK' : (out.country || out.city || out.state ? 'PARTIAL' : 'FAILED');
  return out;
}

async function fetchNominatim(lat, lon, attempt = 1) {
  const url = `${config.nominatim.baseUrl}/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1&accept-language=en`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': config.nominatim.userAgent, Accept: 'application/json' }, signal: ctl.signal });
    if (res.status === 429) return { status: 'RATE_LIMITED' };
    if (res.status >= 500 && attempt < 2) { await wait(1500); return fetchNominatim(lat, lon, attempt + 1); } // retry only on server errors
    if (!res.ok) return { status: 'FAILED' };
    return parse(await res.json());
  } catch (e) {
    if (attempt < 2 && e.name !== 'AbortError') { await wait(1500); return fetchNominatim(lat, lon, attempt + 1); }
    return { status: 'FAILED' };
  } finally { clearTimeout(timer); }
}

/** Returns {country,state,city,postalCode,displayName,status}. Never throws; a failed lookup just yields status FAILED/RATE_LIMITED. */
async function reverseGeocode(latitude, longitude) {
  const c = validateCoordinates(latitude, longitude);
  if (!c) return { status: 'FAILED' };
  const key = `${c.lat.toFixed(3)},${c.lon.toFixed(3)}`; // ~110 m buckets
  const cached = await GeoCache.findOne({ key }).lean();
  if (cached) return cached.result;
  const result = await throttled(() => fetchNominatim(c.lat.toFixed(6), c.lon.toFixed(6)));
  if (result.status === 'OK' || result.status === 'PARTIAL') {
    await GeoCache.updateOne({ key }, { $set: { key, result, createdAt: new Date() } }, { upsert: true }).catch(() => {});
  }
  return result;
}
module.exports = { reverseGeocode, validateCoordinates };
