import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Users, TrendingUp, Clock, ArrowRight, Package } from "lucide-react";
import { io } from "socket.io-client";
import { orderAPI, leadAPI } from "../../services/api.js";
import { StatCard, StatusBadge, PageLoader } from "../ui/index.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
const fd = (d=0) => ({ initial:{opacity:0,y:16}, animate:{opacity:1,y:0}, transition:{duration:.45,delay:d} });

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [leads,   setLeads]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [aRes, oRes, lRes] = await Promise.all([
        orderAPI.analytics(),
        orderAPI.getAll({ limit:8, page:1 }),
        leadAPI.getStats(),
      ]);
      setStats(aRes.data.stats);
      setOrders(oRes.data.orders);
      setLeads(lRes.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Live order updates
  useEffect(() => {
    const socket = io(API_URL, { transports:["websocket"] });
    socket.on("newOrder", (order) => {
      setOrders(p => [order, ...p.slice(0,7)]);
      setStats(p => p ? { ...p, totalOrders: p.totalOrders+1, pendingOrders: p.pendingOrders+1 } : p);
    });
    socket.on("orderStatusChanged", (updated) => {
      setOrders(p => p.map(o => o._id===updated._id ? updated : o));
    });
    return () => socket.disconnect();
  }, []);

  if (loading) return <PageLoader/>;

  return (
    <div>
      <motion.div {...fd(0)} style={{ marginBottom:"1.5rem" }}>
        <p className="section-tag">Dashboard</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", color:"#2c1f14" }}>
          Good day, <span style={{ color:"#c96030" }}>{user?.fullName?.split(" ")[0]}</span>
        </h1>
        <p style={{ fontSize:"0.875rem", color:"#8c7060", marginTop:4 }}>Here is what is happening with Savitri Livings today.</p>
      </motion.div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.875rem", marginBottom:"1.5rem" }} className="stats-grid">
        <motion.div {...fd(.05)}><StatCard label="Total Orders"   value={stats?.totalOrders   || 0} sub={`${stats?.todayOrders||0} today`} color="#c96030" icon={ShoppingBag}/></motion.div>
        <motion.div {...fd(.1)}> <StatCard label="Pending"        value={stats?.pendingOrders || 0} sub="Need action"                      color="#e38345" icon={Clock}/></motion.div>
        <motion.div {...fd(.15)}><StatCard label="Revenue (paid)" value={`Rs.${(stats?.totalRevenue||0).toLocaleString("en-IN")}`} sub="All time" color="#1a8e72" icon={TrendingUp}/></motion.div>
        <motion.div {...fd(.2)}> <StatCard label="Leads Total"    value={leads?.total||0}           sub={`${leads?.todayNew||0} new today`} color="#b89248" icon={Users}/></motion.div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"1.25rem" }} className="dash-grid">
        {/* Recent orders */}
        <motion.div {...fd(.25)}>
          <div className="card" style={{ overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.25rem", borderBottom:"1px solid #f0e8e0" }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", color:"#2c1f14" }}>Recent Orders</h2>
              <Link to="/orders" style={{ display:"flex", alignItems:"center", gap:4, fontSize:"0.8rem", color:"#c96030", textDecoration:"none" }}>View all <ArrowRight style={{ width:13, height:13 }}/></Link>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.8rem" }}>
                <thead>
                  <tr style={{ background:"#fdf8f2" }}>
                    {["Order","Customer","City","Source","Amount","Status"].map(h => (
                      <th key={h} style={{ padding:"0.6rem 1rem", textAlign:"left", color:"#8c7060", fontWeight:500, fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.08em", whiteSpace:"nowrap", borderBottom:"1px solid #f0e8e0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id} style={{ borderBottom:"1px solid #f0e8e0" }}>
                      <td style={{ padding:"0.75rem 1rem", color:"#c96030", fontWeight:500, whiteSpace:"nowrap" }}>{o.orderNumber}</td>
                      <td style={{ padding:"0.75rem 1rem", color:"#2c1f14", whiteSpace:"nowrap" }}>{o.customerId?.fullName || o.guestName || "Guest"}</td>
                      <td style={{ padding:"0.75rem 1rem", color:"#6b5040", whiteSpace:"nowrap" }}>{o.city}</td>
                      <td style={{ padding:"0.75rem 1rem" }}><span className={`badge badge-sand`} style={{ textTransform:"capitalize" }}>{o.orderSource}</span></td>
                      <td style={{ padding:"0.75rem 1rem", color:"#2c1f14", fontWeight:500, whiteSpace:"nowrap" }}>Rs.{o.grandTotal?.toLocaleString("en-IN")}</td>
                      <td style={{ padding:"0.75rem 1rem" }}><StatusBadge status={o.status}/></td>
                    </tr>
                  ))}
                  {orders.length===0 && <tr><td colSpan={6} style={{ padding:"2rem", textAlign:"center", color:"#b09880" }}>No orders yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Lead pipeline summary */}
        <motion.div {...fd(.3)}>
          <div className="card" style={{ padding:"1.25rem" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", color:"#2c1f14" }}>Lead Pipeline</h2>
              <Link to="/crm" style={{ fontSize:"0.8rem", color:"#c96030", textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>Manage <ArrowRight style={{ width:13, height:13 }}/></Link>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {(leads?.byStatus||[]).map(({ _id, count }) => (
                <div key={_id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <StatusBadge status={_id}/>
                  <div style={{ flex:1, height:8, background:"#f0e8e0", borderRadius:4, overflow:"hidden" }}>
                    <div style={{ height:"100%", background:_id==="converted"?"#1a8e72":_id==="new"?"#c96030":"#b89248", borderRadius:4, width:`${Math.min(100,(count/(leads?.total||1))*100)}%` }}/>
                  </div>
                  <span style={{ fontSize:"0.8rem", color:"#6b5040", fontWeight:500, minWidth:20, textAlign:"right" }}>{count}</span>
                </div>
              ))}
              {(!leads?.byStatus?.length) && <p style={{ color:"#b09880", fontSize:"0.875rem" }}>No leads yet</p>}
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`@media(min-width:768px){.stats-grid{grid-template-columns:repeat(4,1fr)!important}.dash-grid{grid-template-columns:2fr 1fr!important}}`}</style>
    </div>
  );
}
