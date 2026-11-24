const transitData = require("../data/kolkataTransitRoutes.json");

const busRoutes = (transitData.routes || []).filter((route) => !["metro", "train", "ferry"].includes(String(route.type).toLowerCase()));
const allStops = [...new Set(busRoutes.flatMap((route) => route.stops || []))].sort((a, b) => b.length - a.length);
const routesByStop = new Map();
for (const route of busRoutes) {
  for (const stop of new Set(route.stops || [])) {
    if (!routesByStop.has(stop)) routesByStop.set(stop, []);
    routesByStop.get(stop).push(route);
  }
}

const normalise = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

function parseJourney(message) {
  const text = String(message || "").replace(/[?!.;,]+$/g, "").trim();
  const match = text.match(/\b(?:from|between)\s+(.+?)\s+\b(?:to|and)\s+(.+?)(?=\s+(?:by|via|using|on)\s+|$)/i);
  if (!match) return null;
  const find = (phrase) => {
    const key = normalise(phrase);
    return allStops.find((stop) => normalise(stop) === key)
      || allStops.find((stop) => key.includes(normalise(stop)))
      || allStops.find((stop) => normalise(stop).startsWith(key) && key.length >= 4)
      || null;
  };
  return { fromText: match[1].trim(), toText: match[2].trim(), from: find(match[1]), to: find(match[2]) };
}

function segmentStops(route, from, to) {
  const a = route.stops.indexOf(from);
  const b = route.stops.indexOf(to);
  if (a < 0 || b < 0 || a === b) return null;
  const direction = a < b ? 1 : -1;
  const names = [];
  for (let i = a; direction > 0 ? i <= b : i >= b; i += direction) names.push(route.stops[i]);
  return names;
}

function routeLabel(route, from, to) {
  const path = segmentStops(route, from, to);
  if (!path) return null;
  const vias = path.slice(1, -1);
  const shown = vias.slice(0, 5);
  const remaining = vias.length - shown.length;
  return `${route.busNumber} (${route.type}): ${from} → ${to}${shown.length ? ` via ${shown.join(" → ")}` : ""}${remaining > 0 ? ` → and ${remaining} more stop${remaining === 1 ? "" : "s"}` : ""}`;
}

function findTransitContext(message) {
  const journey = parseJourney(message);
  if (!journey || !/\b(bus|buses|route|travel|go|get|reach|transport|journey)\b/i.test(message)) return null;
  const source = "The following route candidates come from the user-provided Kolkata_Bus dataset and are not a live operations feed. It has no verified live vehicles, service status, timetables or dependable fares. Confirm the route direction and that it is operating before boarding.";
  if (!journey.from || !journey.to) {
    const missing = [!journey.from && `starting place “${journey.fromText}”`, !journey.to && `destination “${journey.toText}”`].filter(Boolean).join(" and ");
    return { title: "Kolkata route lookup limits", content: `I could not match ${missing} to a named stop in the supplied bus dataset. Ask the traveller for a nearby named stop or station; do not guess a substitute. ${source}` };
  }
  if (journey.from === journey.to) return null;

  const direct = [];
  for (const route of routesByStop.get(journey.from) || []) {
    const label = routeLabel(route, journey.from, journey.to);
    if (label) direct.push(label);
  }
  const transfer = [];
  if (direct.length < 3) {
    for (const first of routesByStop.get(journey.from) || []) {
      for (const junction of first.stops || []) {
        for (const second of routesByStop.get(junction) || []) {
          if (first === second || !(second.stops || []).includes(journey.to)) continue;
          const legA = routeLabel(first, journey.from, junction);
          const legB = routeLabel(second, junction, journey.to);
          if (legA && legB) transfer.push(`${legA}; change at ${junction}; ${legB}`);
          if (transfer.length >= 3) break;
        }
        if (transfer.length >= 3) break;
      }
      if (transfer.length >= 3) break;
    }
  }
  const options = [...new Set([...direct.slice(0, 3), ...transfer])];
  const content = options.length
    ? `Requested journey: ${journey.from} to ${journey.to}. Candidate routes present in the supplied static dataset:\n${options.map((item) => `- ${item}`).join("\n")}\n${source}`
    : `Requested journey: ${journey.from} to ${journey.to}. No direct or one-change option was found in the supplied static bus dataset. Do not claim that no service exists; invite the traveller to open the Transport planner or try nearby stops. ${source}`;
  return { title: "Kolkata bus route lookup", content };
}

module.exports = { findTransitContext };

