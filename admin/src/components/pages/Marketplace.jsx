import { useEffect, useState } from "react";
import { Check, Store, Star, X, Plus, RefreshCw } from "lucide-react";
import { marketplaceAPI } from "../../services/api.js";
import { PageLoader, StatCard } from "../ui/index.jsx";

const statusColor = { pending: "#b7791f", active: "#16805c", rejected: "#c53030", sold: "#506070" };

export default function Marketplace() {
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [summary, listingData, categoryData] = await Promise.all([marketplaceAPI.summary(), marketplaceAPI.listings(filter), marketplaceAPI.categories()]);
      setStats(summary.data.stats); setListings(listingData.data.listings); setCategories(categoryData.data.categories);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);
  const moderate = async (id, patch) => { await marketplaceAPI.moderate(id, patch); await load(); };
  const addCategory = async (event) => { event.preventDefault(); if (!name.trim()) return; await marketplaceAPI.addCategory({ name: name.trim() }); setName(""); await load(); };
  if (loading && !stats) return <PageLoader />;

  return <div>
    <div style={{ display:"flex", justifyContent:"space-between", gap:16, alignItems:"start", marginBottom:24 }}>
      <div><p className="section-tag">Marketplace control centre</p><h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", color:"#2c1f14" }}>Thikana Marketplace</h1><p style={{ color:"#8c7060", marginTop:4 }}>Approve sellers’ listings, feature inventory, and maintain marketplace categories.</p></div>
      <button className="btn-outline" onClick={load}><RefreshCw size={15}/> Refresh</button>
    </div>
    <div className="market-stats" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14, marginBottom:24 }}>
      <StatCard label="All listings" value={stats?.total || 0} color="#c96030" icon={Store}/><StatCard label="Awaiting approval" value={stats?.pending || 0} color="#b7791f" icon={RefreshCw}/><StatCard label="Live listings" value={stats?.active || 0} color="#16805c" icon={Check}/><StatCard label="Seller accounts" value={stats?.sellers || 0} color="#6b46c1" icon={Star}/>
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"minmax(0,2fr) minmax(260px,1fr)", gap:20 }} className="market-grid">
      <section className="card" style={{ overflow:"hidden" }}>
        <div style={{ padding:"1rem 1.25rem", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #f0e8e0" }}><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.15rem" }}>Listing moderation</h2><div style={{ display:"flex", gap:6 }}>{["pending","active","rejected","sold"].map(s => <button key={s} onClick={() => setFilter(s)} style={{ border:"none", borderRadius:16, padding:"5px 9px", cursor:"pointer", background:filter===s?"#2c1f14":"#f7efe6", color:filter===s?"white":"#6b5040", textTransform:"capitalize" }}>{s}</button>)}</div></div>
        {loading ? <div style={{ padding:32, textAlign:"center" }}>Loading…</div> : listings.length === 0 ? <div style={{ padding:32, color:"#8c7060", textAlign:"center" }}>No {filter} listings.</div> : <div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", fontSize:".82rem" }}><thead><tr style={{ background:"#fdf8f2" }}>{["Listing","Seller","Category","Price","Status","Actions"].map(h => <th key={h} style={{ padding:".7rem 1rem", textAlign:"left", color:"#8c7060", fontWeight:500 }}>{h}</th>)}</tr></thead><tbody>{listings.map(item => <tr key={item._id} style={{ borderTop:"1px solid #f0e8e0" }}><td style={{ padding:".9rem 1rem", minWidth:180 }}><b style={{ color:"#2c1f14" }}>{item.title}</b><small style={{ display:"block", color:"#8c7060", marginTop:3 }}>{item.location?.area || item.location?.city || "Location pending"}</small></td><td style={{ padding:".9rem 1rem" }}>{item.sellerId?.marketplaceStoreName || item.sellerId?.fullName || "Unknown"}</td><td style={{ padding:".9rem 1rem", textTransform:"capitalize" }}>{item.category}</td><td style={{ padding:".9rem 1rem" }}>{item.price == null ? "—" : `₹${Number(item.price).toLocaleString("en-IN")}`}</td><td style={{ padding:".9rem 1rem" }}><span style={{ color:statusColor[item.status], fontWeight:700, textTransform:"capitalize" }}>{item.status}</span></td><td style={{ padding:".9rem 1rem", whiteSpace:"nowrap" }}>{item.status !== "active" && <button title="Approve" onClick={() => moderate(item._id, { status:"active" })} style={{ color:"#16805c", border:"none", background:"transparent", cursor:"pointer" }}><Check size={18}/></button>}{item.status !== "rejected" && <button title="Reject" onClick={() => moderate(item._id, { status:"rejected" })} style={{ color:"#c53030", border:"none", background:"transparent", cursor:"pointer" }}><X size={18}/></button>}<button title="Toggle featured" onClick={() => moderate(item._id, { status:item.status, featured:!item.featured })} style={{ color:item.featured?"#b7791f":"#8c7060", border:"none", background:"transparent", cursor:"pointer" }}><Star size={18}/></button></td></tr>)}</tbody></table></div>}
      </section>
      <aside className="card" style={{ padding:"1.25rem", alignSelf:"start" }}><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.15rem", marginBottom:12 }}>Categories</h2><form onSubmit={addCategory} style={{ display:"flex", gap:6, marginBottom:14 }}><input value={name} onChange={e => setName(e.target.value)} placeholder="New category" style={{ minWidth:0, flex:1, border:"1px solid #ddcfbf", borderRadius:8, padding:".55rem" }}/><button type="submit" className="btn-terra" style={{ minHeight:36, padding:"0 .7rem" }}><Plus size={16}/></button></form>{categories.map(category => <div key={category._id} style={{ display:"flex", justifyContent:"space-between", gap:8, padding:".65rem 0", borderTop:"1px solid #f0e8e0" }}><span>{category.icon} {category.name}</span><button onClick={() => marketplaceAPI.updateCategory(category._id, { isActive:!category.isActive }).then(load)} style={{ border:"none", background:"transparent", color:category.isActive?"#16805c":"#8c7060", cursor:"pointer" }}>{category.isActive?"Live":"Hidden"}</button></div>)}</aside>
    </div><style>{`@media(min-width:900px){.market-stats{grid-template-columns:repeat(4,1fr)!important}} @media(max-width:720px){.market-grid{grid-template-columns:1fr!important}}`}</style>
  </div>;
}
