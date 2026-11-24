import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bus, MapPin, MessageCircle, Train, Ship, ExternalLink, Info } from "lucide-react";

const PLANNER_BASE = import.meta.env.VITE_TRANSPORT_APP_URL || "https://kolkata-bus.vercel.app/";
const popularPlaces = ["Dum Dum", "Newtown", "Rajarhat", "Barasat", "Howrah Station", "Esplanade", "Kalyani"];
const journeys = [
  { from: "Howrah Station", to: "Newtown", label: "Howrah ↔ New Town" },
  { from: "Dum Dum", to: "Newtown", label: "Dum Dum ↔ New Town" },
  { from: "Kalyani", to: "Howrah Station", label: "Kalyani ↔ Kolkata" },
];

function makePlannerUrl(from, to) {
  const url = new URL(PLANNER_BASE);
  if (from.trim()) url.searchParams.set("from", from.trim());
  if (to.trim()) url.searchParams.set("to", to.trim());
  return url.toString();
}

export default function Transport() {
  const [from, setFrom] = useState("Howrah Station");
  const [to, setTo] = useState("Newtown");
  const [showPlanner, setShowPlanner] = useState(false);
  const plannerUrl = useMemo(() => makePlannerUrl(from, to), [from, to]);

  const pickJourney = (journey) => {
    setFrom(journey.from);
    setTo(journey.to);
    setShowPlanner(true);
  };

  return <main style={{ minHeight: "80vh", padding: "34px 18px 54px", background: "#f7f5f0", color: "#2d372f" }}>
    <div style={{ maxWidth: 1160, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", alignItems: "end", marginBottom: 23 }}>
        <div><p style={{ margin: "0 0 7px", color: "#a47a3d", fontSize: 11, fontWeight: 800, letterSpacing: ".14em" }}>SAVITRI LIVINGS · CITY SERVICES</p>
          <h1 style={{ margin: 0, color: "#2c4034", font: "600 clamp(2rem,5vw,3.1rem) Georgia,serif" }}>Kolkata Transport</h1>
          <p style={{ maxWidth: 690, color: "#746f64", lineHeight: 1.65 }}>Plan everyday journeys by bus, metro, local train and ferry across Kolkata and nearby places.</p>
        </div>
        <Link to="/livings-ai?topic=transport" state={{ from: "/transport" }} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12, background: "#315443", color: "white", textDecoration: "none", fontWeight: 700 }}><MessageCircle size={17}/> Ask LivingsAI</Link>
      </div>

      <section className="transport-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(280px,.8fr)", gap: 16, marginBottom: 16 }}>
        <div style={{ padding: 22, border: "1px solid #e8dfd3", borderRadius: 18, background: "#fffdfa" }}>
          <h2 style={{ margin: "0 0 14px", font: "600 20px Georgia,serif", color: "#354638" }}>Plan a journey</h2>
          <form onSubmit={(event) => { event.preventDefault(); setShowPlanner(true); }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 9 }}>
            <label style={{ display: "grid", gap: 5, color: "#827967", fontSize: 11, fontWeight: 700 }}>FROM<input required list="transport-places" value={from} onChange={(event) => setFrom(event.target.value)} placeholder="Starting point" style={inputStyle}/></label>
            <label style={{ display: "grid", gap: 5, color: "#827967", fontSize: 11, fontWeight: 700 }}>TO<input required list="transport-places" value={to} onChange={(event) => setTo(event.target.value)} placeholder="Destination" style={inputStyle}/></label>
            <datalist id="transport-places">{popularPlaces.map((place) => <option key={place} value={place}/>)}</datalist>
            <button type="submit" style={{ alignSelf: "end", minHeight: 44, padding: "0 15px", border: 0, borderRadius: 10, background: "#315443", color: "white", fontWeight: 700, cursor: "pointer" }}>Find route <ArrowRight size={15}/></button>
          </form>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 15 }}>{journeys.map((journey) => <button key={journey.label} onClick={() => pickJourney(journey)} style={{ border: "1px solid #e9e1d4", borderRadius: 99, padding: "7px 10px", background: "#fff", color: "#6c5d45", fontSize: 11, cursor: "pointer" }}>{journey.label}</button>)}</div>
        </div>
        <div style={{ padding: 22, border: "1px solid #e8dfd3", borderRadius: 18, background: "linear-gradient(145deg,#315443,#19392d)", color: "white" }}>
          <h2 style={{ margin: "0 0 12px", font: "600 20px Georgia,serif", color: "#f4ce7c" }}>Explore nearby routes</h2>
          <p style={{ margin: "0 0 16px", color: "#e1e8df", fontSize: 13, lineHeight: 1.6 }}>Use familiar stops and neighbourhood names to start. If a place name is not listed as a stop, try a nearby station or main road.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{[Bus, Train, Ship].map((Icon, i) => <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 10px", border: "1px solid #ffffff30", borderRadius: 10, color: "#fff" }}><Icon size={15}/>{["Bus", "Metro & train", "Ferry"][i]}</span>)}</div>
          <div style={{ marginTop: 15, fontSize: 12, color: "#d4dfd3" }}><MapPin size={14} style={{ verticalAlign: "-2px", color: "#f4ce7c" }}/> Kolkata · New Town · Dum Dum · Kalyani · Barasat</div>
        </div>
      </section>

      <p style={{ margin: "0 0 16px", padding: "12px 14px", border: "1px solid #eadfc9", borderRadius: 12, background: "#fffaf0", color: "#756444", fontSize: 12, lineHeight: 1.55 }}><strong>Hatisala:</strong> the supplied route data does not identify an exact Hatisala stop yet. Ask LivingsAI for help or choose a nearby stop you can confirm locally.</p>

      <section style={{ overflow: "hidden", border: "1px solid #e8dfd3", borderRadius: 18, background: "white" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "14px 18px", borderBottom: "1px solid #eee8dd" }}>
          <div><strong style={{ color: "#354638" }}>Route planner</strong><div style={{ marginTop: 3, color: "#8a8273", fontSize: 11 }}>Planner data is separate from Savitri Livings account data.</div></div>
          <a href={plannerUrl} target="_blank" rel="noreferrer" style={{ color: "#41634c", fontWeight: 700, fontSize: 12 }}>Open full planner <ExternalLink size={13}/></a>
        </div>
        {showPlanner ? <iframe title="Kolkata public transport route planner" src={plannerUrl} loading="lazy" style={{ display: "block", width: "100%", height: "min(78vh, 820px)", minHeight: 620, border: 0 }} /> : <div style={{ display: "grid", placeItems: "center", minHeight: 250, padding: 24, textAlign: "center", color: "#7c786d" }}><div><MapPin size={26} color="#a47a3d"/><p style={{ margin: "10px 0 4px", fontWeight: 700 }}>Choose a journey to load the planner</p><small>Route results open here, with a full-screen option above.</small></div></div>}
      </section>

      <p style={{ display: "flex", gap: 8, alignItems: "start", maxWidth: 850, margin: "15px 2px 0", color: "#888173", fontSize: 11, lineHeight: 1.55 }}><Info size={14} style={{ flex: "0 0 auto", marginTop: 1 }}/>Route listings are informational and may not reflect live service, delays, fares or every boarding point. Confirm current operation and direction before travel. If the planner does not load embedded, use “Open full planner”.</p>
    </div>
    <style>{`@media(max-width:760px){.transport-grid{grid-template-columns:1fr!important}}`}</style>
  </main>;
}

const inputStyle = { minWidth: 0, height: 44, padding: "0 11px", border: "1px solid #e5ddcf", borderRadius: 10, background: "white", color: "#354238", font: "13px 'DM Sans',sans-serif" };

