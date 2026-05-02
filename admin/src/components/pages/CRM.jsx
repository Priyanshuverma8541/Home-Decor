import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Phone, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { leadAPI } from "../../services/api.js";
import { PageLoader, EmptyState, StatusBadge, Modal, Button } from "../ui/index.jsx";
import toast from "react-hot-toast";

const STATUSES = ["new","contacted","interested","converted","lost"];
const SOURCES  = ["website","whatsapp","instagram","referral","event","admin"];
const CITIES   = ["Buxar","Varanasi","Kolkata","Other"];

export default function CRM() {
  const [leads,    setLeads]    = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [showModal,setShowModal]= useState(false);
  const [showAdd,  setShowAdd]  = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [filters,  setFilters]  = useState({ status:"", city:"", source:"", search:"" });
  const [newLead,  setNewLead]  = useState({ name:"", phone:"", email:"", city:"Buxar", source:"admin", status:"new" });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.city)   params.city   = filters.city;
      if (filters.source) params.source = filters.source;
      if (filters.search) params.search = filters.search;
      const [lRes, sRes] = await Promise.all([leadAPI.getAll(params), leadAPI.getStats()]);
      setLeads(lRes.data.leads||[]);
      setStats(sRes.data);
    } catch { toast.error("Failed to load leads"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters]);

  const updateStatus = async (id, status) => {
    try { const { data } = await leadAPI.update(id, { status }); setLeads(p=>p.map(l=>l._id===id?data.lead:l)); toast.success("Status updated"); }
    catch { toast.error("Failed"); }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const { data } = await leadAPI.update(selected._id, { note: noteText });
      setSelected(data.lead); setLeads(p=>p.map(l=>l._id===data.lead._id?data.lead:l));
      setNoteText(""); toast.success("Note added");
    } catch { toast.error("Failed to add note"); }
    finally { setSaving(false); }
  };

  const createLead = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await leadAPI.create(newLead); toast.success("Lead created"); setShowAdd(false); load(); }
    catch { toast.error("Failed to create lead"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ marginBottom:"1.5rem" }}>
        <p className="section-tag">CRM</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", color:"#2c1f14" }}>Leads & Contacts</h1>
      </div>

      {/* Stats pills */}
      {stats && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:"1.25rem" }}>
          {stats.byStatus?.map(({ _id, count }) => (
            <button key={_id} onClick={()=>setFilters(f=>({...f,status:f.status===_id?"":_id}))}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"0.4rem 0.875rem", borderRadius:20, border:"1px solid", borderColor: filters.status===_id?"#c96030":"#d4c4b0", background: filters.status===_id?"#fae8d8":"white", cursor:"pointer", fontSize:"0.8rem" }}>
              <StatusBadge status={_id}/><span style={{ color:"#6b5040", fontWeight:500 }}>{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filters + add */}
      <div style={{ display:"flex", gap:8, marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:"1 1 200px" }}>
          <Search style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"#b09880", pointerEvents:"none" }}/>
          <input className="input" style={{ paddingLeft:32, height:38 }} placeholder="Search name, phone…"
            value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))}/>
        </div>
        <select className="input" style={{ width:"auto", height:38 }} value={filters.city} onChange={e=>setFilters(f=>({...f,city:e.target.value}))}>
          <option value="">All cities</option>{CITIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input" style={{ width:"auto", height:38 }} value={filters.source} onChange={e=>setFilters(f=>({...f,source:e.target.value}))}>
          <option value="">All sources</option>{SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <Button variant="clay" onClick={()=>setShowAdd(true)}>
          <Plus style={{ width:14, height:14 }}/>Add Lead
        </Button>
      </div>

      {loading ? <PageLoader/> : leads.length===0 ? (
        <EmptyState title="No leads found" message="Leads auto-create when customers order or inquire."/>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {leads.map(lead=>(
            <motion.div key={lead._id} layout initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} className="card" style={{ padding:"1rem 1.25rem" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:"1rem", flexWrap:"wrap" }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#e38345,#c96030)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:14, fontWeight:600, flexShrink:0 }}>
                  {lead.name?.[0] || "?"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                    <p style={{ fontWeight:500, color:"#2c1f14" }}>{lead.name || "Unknown"}</p>
                    <StatusBadge status={lead.status}/>
                    <span className="badge badge-sand" style={{ textTransform:"capitalize" }}>{lead.source}</span>
                    {lead.city && <span className="badge badge-gray">{lead.city}</span>}
                  </div>
                  <div style={{ display:"flex", gap:"1rem", fontSize:"0.8rem", color:"#8c7060", flexWrap:"wrap" }}>
                    {lead.phone && <span style={{ display:"flex", alignItems:"center", gap:4 }}><Phone style={{ width:12, height:12 }}/>{lead.phone}</span>}
                    {lead.email && <span>{lead.email}</span>}
                    {lead.nextFollowUpAt && <span style={{ color:"#c96030" }}>Follow-up: {new Date(lead.nextFollowUpAt).toLocaleDateString("en-IN")}</span>}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0, flexWrap:"wrap" }}>
                  {lead.phone && (
                    <a href={`https://wa.me/91${lead.phone}`} target="_blank" rel="noopener noreferrer"
                      style={{ width:32, height:32, borderRadius:8, background:"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <MessageCircle style={{ width:14, height:14, color:"#166534" }}/>
                    </a>
                  )}
                  <select value={lead.status} onChange={e=>updateStatus(lead._id,e.target.value)}
                    className="input" style={{ height:32, padding:"0 0.5rem", fontSize:"0.75rem", width:"auto" }}>
                    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={()=>{setSelected(lead);setShowModal(true);}} className="btn-ghost" style={{ height:32, padding:"0 10px", fontSize:"0.75rem" }}>Notes</button>
                </div>
              </div>
              {lead.notes?.length>0 && (
                <div style={{ marginTop:"0.75rem", paddingTop:"0.75rem", borderTop:"1px solid #f0e8e0" }}>
                  {lead.notes.slice(-2).map((n,i)=>(
                    <p key={i} style={{ fontSize:"0.75rem", color:"#6b5040", marginBottom:3 }}>
                      <span style={{ color:"#b09880" }}>{new Date(n.addedAt).toLocaleDateString("en-IN")}:</span> {n.text}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Notes modal */}
      <AnimatePresence>
        {showModal && selected && (
          <Modal title={`Notes — ${selected.name}`} onClose={()=>setShowModal(false)}>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ maxHeight:200, overflowY:"auto", display:"flex", flexDirection:"column", gap:8 }}>
                {selected.notes?.length===0 && <p style={{ color:"#b09880", fontSize:"0.875rem" }}>No notes yet.</p>}
                {selected.notes?.map((n,i)=>(
                  <div key={i} style={{ background:"#fdf8f2", borderRadius:8, padding:"0.625rem 0.875rem" }}>
                    <p style={{ fontSize:"0.7rem", color:"#b09880", marginBottom:3 }}>{new Date(n.addedAt).toLocaleString("en-IN")}</p>
                    <p style={{ fontSize:"0.875rem", color:"#2c1f14" }}>{n.text}</p>
                  </div>
                ))}
              </div>
              <div>
                <label className="label">Add Note</label>
                <textarea className="input" rows={3} style={{ resize:"vertical" }} placeholder="Write a note about this lead…" value={noteText} onChange={e=>setNoteText(e.target.value)}/>
              </div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <Button variant="ghost" onClick={()=>setShowModal(false)}>Close</Button>
                <Button variant="clay" onClick={addNote} loading={saving}>Save Note</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Add lead modal */}
      <AnimatePresence>
        {showAdd && (
          <Modal title="Add New Lead" onClose={()=>setShowAdd(false)}>
            <form onSubmit={createLead} style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[["name","Name","text","Ravi Sharma"],["phone","Phone","tel","9876543210"],["email","Email","email","ravi@email.com"]].map(([k,l,t,p])=>(
                <div key={k}>
                  <label className="label">{l}</label>
                  <input type={t} className="input" placeholder={p} value={newLead[k]||""} onChange={e=>setNewLead(f=>({...f,[k]:e.target.value}))}/>
                </div>
              ))}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                <div>
                  <label className="label">City</label>
                  <select className="input" value={newLead.city} onChange={e=>setNewLead(f=>({...f,city:e.target.value}))}>
                    {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Source</label>
                  <select className="input" value={newLead.source} onChange={e=>setNewLead(f=>({...f,source:e.target.value}))}>
                    {SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={newLead.status} onChange={e=>setNewLead(f=>({...f,status:e.target.value}))}>
                    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <Button variant="ghost" onClick={()=>setShowAdd(false)} type="button">Cancel</Button>
                <Button variant="clay" type="submit" loading={saving}>Create Lead</Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
