import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Eye, Truck } from "lucide-react";
import { orderAPI, userAPI } from "../../services/api.js";
import { PageLoader, EmptyState, StatusBadge, Modal, Button } from "../ui/index.jsx";
import toast from "react-hot-toast";

const STATUSES = ["","pending","confirmed","packed","assigned","out_for_delivery","delivered","cancelled"];
const CITIES   = ["","Buxar","Varanasi","Kolkata"];
const SOURCES  = ["","website","whatsapp","instagram","admin"];

export default function Orders() {
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [partners,  setPartners]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating,  setUpdating]  = useState(false);
  const [form,      setForm]      = useState({ status:"", deliveryPartnerId:"", adminNotes:"", paymentStatus:"" });
  const [filters,   setFilters]   = useState({ status:"", city:"", source:"", search:"" });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.city)   params.city   = filters.city;
      if (filters.source) params.source = filters.source;
      const { data } = await orderAPI.getAll(params);
      let list = data.orders || [];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(o => o.orderNumber?.toLowerCase().includes(q) || o.customerId?.fullName?.toLowerCase().includes(q) || o.guestName?.toLowerCase().includes(q));
      }
      setOrders(list);
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters.status, filters.city, filters.source]);

  const openOrder = async (order) => {
    setSelected(order);
    setForm({ status: order.status, deliveryPartnerId: order.deliveryPartnerId?._id || "", adminNotes:"", paymentStatus: order.paymentStatus });
    setShowModal(true);
    if (!partners.length) {
      const { data } = await userAPI.getDelivery({ city: order.city });
      setPartners(data.partners || []);
    }
  };

  const saveUpdate = async () => {
    setUpdating(true);
    try {
      const { data } = await orderAPI.updateStatus(selected._id, form);
      setOrders(p => p.map(o => o._id===data.order._id ? data.order : o));
      setShowModal(false);
      toast.success("Order updated");
    } catch { toast.error("Update failed"); }
    finally { setUpdating(false); }
  };

  const filtered = orders.filter(o => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return o.orderNumber?.toLowerCase().includes(q) || o.customerId?.fullName?.toLowerCase().includes(q) || o.guestName?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ marginBottom:"1.5rem" }}>
        <p className="section-tag">Order Management</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", color:"#2c1f14" }}>Orders</h1>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:"1.25rem", alignItems:"center" }}>
        <div style={{ position:"relative", flex:"1 1 200px" }}>
          <Search style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"#b09880", pointerEvents:"none" }}/>
          <input className="input" style={{ paddingLeft:32, height:38 }} placeholder="Search order # or name…"
            value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))}/>
        </div>
        {[["status",STATUSES],["city",CITIES],["source",SOURCES]].map(([key,opts])=>(
          <select key={key} className="input" style={{ width:"auto", height:38, minWidth:110 }}
            value={filters[key]} onChange={e=>setFilters(f=>({...f,[key]:e.target.value}))}>
            {opts.map(o=><option key={o} value={o}>{o||`All ${key}s`}</option>)}
          </select>
        ))}
        <Button variant="ghost" onClick={load} style={{ height:38 }}>Refresh</Button>
      </div>

      {loading ? <PageLoader/> : filtered.length===0 ? (
        <EmptyState title="No orders found" message="Try adjusting your filters."/>
      ) : (
        <div className="card" style={{ overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.8rem" }}>
              <thead>
                <tr style={{ background:"#fdf8f2" }}>
                  {["Order #","Customer","City","Source","Items","Amount","Status","Payment","Partner","Action"].map(h=>(
                    <th key={h} style={{ padding:"0.75rem 1rem", textAlign:"left", color:"#8c7060", fontWeight:500, fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.08em", whiteSpace:"nowrap", borderBottom:"1px solid #f0e8e0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o=>(
                  <motion.tr key={o._id} initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ borderBottom:"1px solid #f0e8e0" }}>
                    <td style={{ padding:"0.75rem 1rem", color:"#c96030", fontWeight:600, whiteSpace:"nowrap" }}>{o.orderNumber}</td>
                    <td style={{ padding:"0.75rem 1rem", color:"#2c1f14", whiteSpace:"nowrap" }}>
                      <div>{o.customerId?.fullName || o.guestName || "Guest"}</div>
                      <div style={{ fontSize:"0.7rem", color:"#8c7060" }}>{o.customerId?.phone || o.guestPhone}</div>
                    </td>
                    <td style={{ padding:"0.75rem 1rem", color:"#6b5040", whiteSpace:"nowrap" }}>{o.city}</td>
                    <td style={{ padding:"0.75rem 1rem" }}><span className="badge badge-sand" style={{ textTransform:"capitalize" }}>{o.orderSource}</span></td>
                    <td style={{ padding:"0.75rem 1rem", color:"#6b5040" }}>{o.items?.length} item(s)</td>
                    <td style={{ padding:"0.75rem 1rem", fontWeight:500, color:"#2c1f14", whiteSpace:"nowrap" }}>Rs.{o.grandTotal?.toLocaleString("en-IN")}</td>
                    <td style={{ padding:"0.75rem 1rem" }}><StatusBadge status={o.status}/></td>
                    <td style={{ padding:"0.75rem 1rem" }}><span className={`badge ${o.paymentStatus==="paid"?"badge-teal":o.paymentStatus==="refunded"?"badge-sand":"badge-clay"}`} style={{ textTransform:"capitalize" }}>{o.paymentStatus}</span></td>
                    <td style={{ padding:"0.75rem 1rem", color:"#6b5040", whiteSpace:"nowrap", fontSize:"0.75rem" }}>
                      {o.deliveryPartnerId?.fullName || <span style={{ color:"#b09880" }}>Unassigned</span>}
                    </td>
                    <td style={{ padding:"0.75rem 1rem" }}>
                      <button onClick={()=>openOrder(o)} className="btn-ghost" style={{ minHeight:30, padding:"0 10px", fontSize:"0.75rem" }}>
                        <Eye style={{ width:13, height:13 }}/>Update
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Update modal */}
      <AnimatePresence>
        {showModal && selected && (
          <Modal title={`Order ${selected.orderNumber}`} onClose={()=>setShowModal(false)} width={520}>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Order summary */}
              <div style={{ background:"#fdf8f2", borderRadius:10, padding:"0.875rem 1rem" }}>
                <p style={{ fontWeight:500, color:"#2c1f14", marginBottom:6 }}>Items ordered</p>
                {selected.items?.map((it,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem", color:"#6b5040", marginBottom:3 }}>
                    <span>{it.name} × {it.quantity}</span><span>Rs.{(it.price*it.quantity).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="divider"/>
                <div style={{ display:"flex", justifyContent:"space-between", fontWeight:600, color:"#2c1f14" }}>
                  <span>Grand Total</span><span>Rs.{selected.grandTotal?.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label className="label">Update Status</label>
                  <select className="input" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    {STATUSES.filter(Boolean).map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Payment Status</label>
                  <select className="input" value={form.paymentStatus} onChange={e=>setForm(f=>({...f,paymentStatus:e.target.value}))}>
                    {["pending","paid","refunded"].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Assign Delivery Partner</label>
                <select className="input" value={form.deliveryPartnerId} onChange={e=>setForm(f=>({...f,deliveryPartnerId:e.target.value}))}>
                  <option value="">Not assigned</option>
                  {partners.map(p=><option key={p._id} value={p._id}>{p.fullName} — {p.city}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Admin Notes</label>
                <textarea className="input" rows={2} style={{ resize:"vertical" }} placeholder="Internal note about this order…"
                  value={form.adminNotes} onChange={e=>setForm(f=>({...f,adminNotes:e.target.value}))}/>
              </div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <Button variant="ghost" onClick={()=>setShowModal(false)}>Cancel</Button>
                <Button variant="clay" onClick={saveUpdate} loading={updating}>
                  <Truck style={{ width:14, height:14 }}/>Save Update
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
