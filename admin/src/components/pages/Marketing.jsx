import { useEffect, useState } from "react";
import { Megaphone, Users, Images, Store, RefreshCw, CheckCircle2, CircleAlert } from "lucide-react";
import { marketingAPI } from "../../services/api.js";
import { PageLoader, StatCard } from "../ui/index.jsx";

export default function Marketing() {
  const [dashboard, setDashboard] = useState(null);
  const [audiences, setAudiences] = useState([]);
  const [integrations, setIntegrations] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const [stats, audienceData, integrationData] = await Promise.all([marketingAPI.dashboard(), marketingAPI.audiences(), marketingAPI.integrations()]);
      setDashboard(stats.data.dashboard); setAudiences(audienceData.data.audiences); setIntegrations(integrationData.data.integrations);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  if (loading && !dashboard) return <PageLoader />;
  return <div>
    <div style={{ display:"flex", justifyContent:"space-between", gap:16, alignItems:"start", marginBottom:24 }}>
      <div><p className="section-tag">Shared marketing control</p><h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", color:"#2c1f14" }}>Marketing Cloud</h1><p style={{ color:"#8c7060", marginTop:4 }}>Customers, Thikana listings and Savitri Livings campaigns all use one backend.</p></div>
      <button className="btn-outline" onClick={load}><RefreshCw size={15}/> Refresh</button>
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14, marginBottom:24 }} className="marketing-stats">
      <StatCard label="Reachable customers" value={dashboard?.customers || 0} color="#b7791f" icon={Users}/><StatCard label="Saved audiences" value={dashboard?.audiences || 0} color="#a85a32" icon={Megaphone}/><StatCard label="Content assets" value={(dashboard?.creatives || 0) + (dashboard?.captions || 0)} color="#806146" icon={Images}/><StatCard label="Live Thikana listings" value={dashboard?.marketplaceListings || 0} color="#16805c" icon={Store}/>
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1.2fr) minmax(280px,.8fr)", gap:20 }} className="marketing-grid">
      <section className="card" style={{ padding:"1.25rem" }}><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.15rem", marginBottom:8 }}>Saved audiences</h2><p style={{ color:"#8c7060", marginBottom:14 }}>Create and manage audiences from the standalone Marketing Cloud; they are stored here in the Savitri backend.</p>{audiences.length ? audiences.map(audience => <div key={audience._id} style={{ display:"flex", justifyContent:"space-between", gap:12, padding:".8rem 0", borderTop:"1px solid #f0e8e0" }}><div><b>{audience.name}</b><small style={{ display:"block", color:"#8c7060", marginTop:3 }}>{audience.customerIds?.length || 0} selected customers · {audience.kind}</small></div><small style={{ color:"#8c7060" }}>{new Date(audience.createdAt).toLocaleDateString()}</small></div>) : <p style={{ color:"#8c7060", padding:"1rem 0" }}>No audience saved yet.</p>}</section>
      <aside className="card" style={{ padding:"1.25rem" }}><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.15rem", marginBottom:12 }}>Channel settings</h2>{integrations && Object.entries(integrations).map(([name, setting]) => <div key={name} style={{ display:"flex", alignItems:"center", gap:9, padding:".7rem 0", borderTop:"1px solid #f0e8e0", textTransform:"capitalize" }}>{setting.configured ? <CheckCircle2 size={17} color="#16805c"/> : <CircleAlert size={17} color="#b7791f"/>}<span style={{ flex:1 }}>{name}</span><small style={{ color:setting.configured?"#16805c":"#8c7060" }}>{setting.configured ? "Connected" : "Not configured"}</small></div>)}<p style={{ color:"#8c7060", fontSize:".78rem", marginTop:12 }}>Sending is kept off until approved provider credentials are configured on the backend.</p></aside>
    </div><style>{`@media(min-width:900px){.marketing-stats{grid-template-columns:repeat(4,1fr)!important}} @media(max-width:720px){.marketing-grid{grid-template-columns:1fr!important}}`}</style>
  </div>;
}
