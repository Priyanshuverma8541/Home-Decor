// ── PARTNERS ─────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Phone, ToggleLeft, ToggleRight, Bike, Store } from "lucide-react";
import { userAPI, campaignAPI, orderAPI } from "../../services/api.js";
import { PageLoader, EmptyState, StatusBadge, Modal, Button, StatCard } from "../ui/index.jsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import toast from "react-hot-toast";

const CITIES = ["Buxar","Varanasi","Kolkata"];
const COLORS = ["#c96030","#1a8e72","#b89248","#6b5040"];

export function Partners() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [roleFilter, setRole]   = useState("delivery");
  const [showAdd,  setShowAdd]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ fullName:"", phone:"", city:"Buxar", role:"delivery", password:"", shopName:"", commissionRate:10 });

  const load = async () => {
    setLoading(true);
    try { const { data } = await userAPI.getAll({ role:roleFilter }); setUsers(data.users||[]); }
    catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [roleFilter]);

  const toggle = async (id) => {
    try { await userAPI.toggle(id); setUsers(p=>p.map(u=>u._id===id?{...u,isActive:!u.isActive}:u)); }
    catch { toast.error("Failed"); }
  };

  const createPartner = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await userAPI.createPartner(form); toast.success("Partner created"); setShowAdd(false); load(); }
    catch(err) { toast.error(err.response?.data?.message||"Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem", flexWrap:"wrap", gap:10 }}>
        <div><p className="section-tag">Partner Management</p><h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", color:"#2c1f14" }}>Partners</h1></div>
        <div style={{ display:"flex", gap:8 }}>
          <Button variant={roleFilter==="delivery"?"clay":"ghost"} onClick={()=>setRole("delivery")} style={{ height:38 }}><Bike style={{ width:14,height:14 }}/>Delivery</Button>
          <Button variant={roleFilter==="vendor"?"clay":"ghost"} onClick={()=>setRole("vendor")} style={{ height:38 }}><Store style={{ width:14,height:14 }}/>Vendors</Button>
          <Button variant="teal" onClick={()=>setShowAdd(true)} style={{ height:38 }}><Plus style={{ width:14,height:14 }}/>Add Partner</Button>
        </div>
      </div>

      {loading ? <PageLoader/> : users.length===0 ? (
        <EmptyState title={`No ${roleFilter} partners yet`} message="Add your first partner to enable local delivery."
          action={<Button onClick={()=>setShowAdd(true)}>Add Partner</Button>}/>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.875rem" }} className="partner-grid">
          {users.map(u=>(
            <motion.div key={u._id} className="card" style={{ padding:"1.25rem" }}>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#e38345,#c96030)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:16, fontWeight:600, flexShrink:0 }}>{u.fullName?.[0]}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:500, color:"#2c1f14" }}>{u.fullName}</p>
                  {u.shopName && <p style={{ fontSize:"0.8rem", color:"#8c7060" }}>{u.shopName}</p>}
                  <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                    <span className="badge badge-sand">{u.city}</span>
                    <span className={`badge ${u.isActive?"badge-green":"badge-gray"}`}>{u.isActive?"Active":"Inactive"}</span>
                    {u.role==="vendor" && <span className="badge badge-clay">Commission {u.commissionRate}%</span>}
                  </div>
                  {u.phone && (
                    <a href={`https://wa.me/91${u.phone}`} target="_blank" rel="noopener noreferrer"
                      style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:6, fontSize:"0.75rem", color:"#1a8e72", textDecoration:"none" }}>
                      <Phone style={{ width:11,height:11 }}/>{u.phone}
                    </a>
                  )}
                </div>
                <button onClick={()=>toggle(u._id)} style={{ width:32, height:32, borderRadius:8, border:"none", background:"#fdf8f2", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {u.isActive ? <ToggleRight style={{ width:16,height:16,color:"#1a8e72" }}/> : <ToggleLeft style={{ width:16,height:16,color:"#b09880" }}/>}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <Modal title="Add Partner" onClose={()=>setShowAdd(false)}>
            <form onSubmit={createPartner} style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div><label className="label">Full Name *</label><input required className="input" value={form.fullName} onChange={e=>setForm(f=>({...f,fullName:e.target.value}))}/></div>
                <div><label className="label">Phone *</label><input required className="input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
                <div><label className="label">City</label>
                  <select className="input" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}>
                    {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="label">Role</label>
                  <select className="input" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                    <option value="delivery">Delivery Partner</option>
                    <option value="vendor">Vendor Partner</option>
                  </select>
                </div>
                {form.role==="vendor" && <>
                  <div style={{ gridColumn:"span 2" }}><label className="label">Shop Name</label><input className="input" value={form.shopName||""} onChange={e=>setForm(f=>({...f,shopName:e.target.value}))}/></div>
                  <div><label className="label">Commission %</label><input type="number" className="input" value={form.commissionRate} onChange={e=>setForm(f=>({...f,commissionRate:e.target.value}))}/></div>
                </>}
                <div><label className="label">Password (default: Partner@123)</label><input className="input" value={form.password||""} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Partner@123"/></div>
              </div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <Button variant="ghost" onClick={()=>setShowAdd(false)} type="button">Cancel</Button>
                <Button variant="teal" type="submit" loading={saving}>Create Partner</Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
      <style>{`@media(min-width:768px){.partner-grid{grid-template-columns:repeat(3,1fr)!important}}`}</style>
    </div>
  );
}

// ── CAMPAIGNS ─────────────────────────────────────────────────────────────────
export function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [sending,   setSending]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({ name:"", type:"whatsapp", targetCity:"all", targetAudience:"all", message:"", status:"draft" });

  useEffect(() => {
    campaignAPI.getAll().then(({ data })=>setCampaigns(data.campaigns||[])).catch(()=>toast.error("Failed to load")).finally(()=>setLoading(false));
  }, []);

  const create = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v])=>fd.append(k,v));
      const { data } = await campaignAPI.create(fd);
      setCampaigns(p=>[data.campaign,...p]); setShowAdd(false);
      toast.success("Campaign created");
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  const send = async (id) => {
    setSending(id);
    try {
      const { data } = await campaignAPI.send(id);
      setCampaigns(p=>p.map(c=>c._id===id?data.campaign:c));
      toast.success(`Sent to ${data.recipientCount} recipients`);
      if (data.waLink) window.open(data.waLink,"_blank");
    } catch { toast.error("Send failed"); }
    finally { setSending(null); }
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem", flexWrap:"wrap", gap:10 }}>
        <div><p className="section-tag">Marketing</p><h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", color:"#2c1f14" }}>Campaigns</h1></div>
        <Button variant="clay" onClick={()=>setShowAdd(true)}><Plus style={{ width:14,height:14 }}/>New Campaign</Button>
      </div>

      {loading ? <PageLoader/> : campaigns.length===0 ? (
        <EmptyState title="No campaigns yet" message="Create a WhatsApp broadcast to reach your customers."/>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
          {campaigns.map(c=>(
            <div key={c._id} className="card" style={{ padding:"1.25rem" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                <div>
                  <p style={{ fontWeight:500, color:"#2c1f14", marginBottom:4 }}>{c.name}</p>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <span className="badge badge-sand" style={{ textTransform:"capitalize" }}>{c.type}</span>
                    <span className="badge badge-gray">{c.targetCity==="all"?"All cities":c.targetCity}</span>
                    <span className={`badge ${c.status==="sent"?"badge-teal":"badge-clay"}`} style={{ textTransform:"capitalize" }}>{c.status}</span>
                    {c.sentCount>0 && <span className="badge badge-gray">{c.sentCount} sent</span>}
                  </div>
                  <p style={{ fontSize:"0.8rem", color:"#6b5040", marginTop:6, maxWidth:400 }}>{c.message?.slice(0,100)}{c.message?.length>100?"…":""}</p>
                </div>
                {c.status==="draft" && (
                  <Button variant="teal" onClick={()=>send(c._id)} loading={sending===c._id} style={{ height:36, fontSize:"0.8rem" }}>
                    Send Now
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <Modal title="New Campaign" onClose={()=>setShowAdd(false)}>
            <form onSubmit={create} style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div><label className="label">Campaign Name *</label><input required className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                <div><label className="label">Type</label>
                  <select className="input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                    {["whatsapp","instagram","email"].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Target City</label>
                  <select className="input" value={form.targetCity} onChange={e=>setForm(f=>({...f,targetCity:e.target.value}))}>
                    <option value="all">All</option>{CITIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="label">Audience</label>
                  <select className="input" value={form.targetAudience} onChange={e=>setForm(f=>({...f,targetAudience:e.target.value}))}>
                    {["all","customers","leads","interested","repeat"].map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label">Message *</label>
                <textarea required className="input" rows={4} style={{ resize:"vertical" }} placeholder="Hi {name}! Check out our new seashell collection…" value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))}/>
              </div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <Button variant="ghost" onClick={()=>setShowAdd(false)} type="button">Cancel</Button>
                <Button variant="clay" type="submit" loading={saving}>Create Campaign</Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
