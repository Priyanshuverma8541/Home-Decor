import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import { Package, User, ArrowRight, MapPin, Phone } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { orderAPI } from "../../services/api.js";
import { PageLoader, EmptyState, StatusBadge } from "../ui/Shared.jsx";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
const STEPS   = ["pending","confirmed","packed","assigned","out_for_delivery","delivered"];

function ProtectedAccount({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from:location }} replace/>;
  return children;
}

function OrderProgress({ status }) {
  const idx = Math.max(0, STEPS.indexOf(status?.toLowerCase()||""));
  return (
    <div style={{ marginTop:"0.875rem" }}>
      <div style={{ display:"flex", alignItems:"center" }}>
        {STEPS.map((s,i) => (
          <div key={s} style={{ display:"flex", alignItems:"center", flex:1 }}>
            <div style={{ width:9, height:9, borderRadius:"50%", flexShrink:0, background: i<=idx?"#1a3c34":"#e8dfd0" }}/>
            {i<STEPS.length-1 && <div style={{ flex:1, height:2, background: i<idx?"#30ac90":"#e8dfd0" }}/>}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
        {STEPS.map((s,i) => (
          <span key={s} style={{ fontSize:"0.55rem", fontWeight:500, color: i<=idx?"#1a3c34":"#c8b89a", textAlign:"center", textTransform:"capitalize", flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {s.replace(/_/g," ")}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MyOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const { user }              = useAuth();

  useEffect(() => {
    orderAPI.myOrders().then(({ data }) => setOrders(data.orders||[])).catch(() => toast.error("Could not load orders")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    const socket = io(API_URL, { transports:["websocket"] });
    socket.on("connect", () => socket.emit("joinRoom", user._id));
    socket.on("orderUpdated", (updated) => {
      setOrders(p => p.map(o => o._id===updated._id ? updated : o));
      toast.success("Order status updated!");
    });
    return () => socket.disconnect();
  }, [user]);

  if (loading) return <PageLoader/>;

  return (
    <ProtectedAccount>
      <div style={{ minHeight:"100vh", background:"#fdf6ee", padding:"1.5rem 1rem" }}>
        <div style={{ maxWidth:800, margin:"0 auto" }}>
          <p className="section-tag">Account</p>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.75rem", color:"#1c1409", marginBottom:"1.5rem" }}>My Orders</h1>

          {orders.length===0 ? (
            <EmptyState title="No orders yet" message="Place your first order from our collection."
              action={<Link to="/shop" className="btn-primary">Shop Now <ArrowRight style={{ width:15,height:15 }}/></Link>}/>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
              {orders.map((order, i) => {
                const img = order.items?.[0]?.image;
                return (
                  <motion.div key={order._id} initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*.04 }}
                    className="card" style={{ padding:"1rem 1.25rem" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:"0.875rem" }}>
                      <div style={{ width:56, height:56, borderRadius:10, overflow:"hidden", background:"#f0e6d0", flexShrink:0 }}>
                        <img src={img||"https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=150"} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:6, marginBottom:4 }}>
                          <span style={{ fontSize:"0.7rem", fontFamily:"'DM Sans',monospace", color:"#8c7258" }}>#{order._id?.slice(-8).toUpperCase()}</span>
                          <StatusBadge status={order.status}/>
                          <StatusBadge status={order.paymentStatus}/>
                          <span style={{ fontSize:"0.7rem", color:"#b8a08a", marginLeft:"auto" }}>
                            {new Date(order.createdAt).toLocaleDateString("en-IN",{ day:"numeric", month:"short", year:"2-digit" })}
                          </span>
                        </div>
                        <p style={{ fontSize:"0.8rem", color:"#5c4a32", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {order.items?.map(it => it.name).join(", ")}
                        </p>
                        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", color:"#1c1409", marginTop:2 }}>
                          Rs.{order.grandTotal?.toLocaleString("en-IN")}
                        </p>
                        <div style={{ display:"flex", gap:8, marginTop:4, fontSize:"0.7rem", color:"#8c7258", flexWrap:"wrap" }}>
                          <span style={{ display:"flex", alignItems:"center", gap:3 }}><MapPin style={{ width:10,height:10 }}/>{order.city}</span>
                          <span style={{ textTransform:"capitalize" }}>{order.orderSource}</span>
                        </div>
                      </div>
                    </div>
                    {order.status!=="delivered" && order.status!=="cancelled" && <OrderProgress status={order.status}/>}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedAccount>
  );
}

export function MyAccount() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    orderAPI.myOrders().then(({ data }) => setOrders(data.orders||[])).catch(() => {});
  }, []);

  return (
    <ProtectedAccount>
      <div style={{ minHeight:"100vh", background:"#fdf6ee", padding:"1.5rem 1rem" }}>
        <div style={{ maxWidth:700, margin:"0 auto" }}>
          <p className="section-tag">My Account</p>
          <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#30ac90,#1a3c34)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontFamily:"'Cormorant Garamond',serif", fontSize:"1.75rem", fontWeight:600 }}>
              {user?.fullName?.[0]}
            </div>
            <div>
              <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.75rem", color:"#1c1409" }}>{user?.fullName}</h1>
              <p style={{ fontSize:"0.8rem", color:"#8c7258", marginTop:2 }}>{user?.city} customer</p>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1.5rem" }} className="acc-grid">
            {[{ Icon:Phone, l:"Phone",  v:user?.phone },
              { Icon:User,  l:"Email",  v:user?.email||"Not set" },
              { Icon:MapPin,l:"City",   v:user?.city  },
              { Icon:Package,l:"Orders",v:orders.length }].map(({ Icon,l,v }) => (
              <div key={l} className="card" style={{ padding:"1rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <Icon style={{ width:14, height:14, color:"#1a3c34" }}/>
                  <p className="label" style={{ margin:0 }}>{l}</p>
                </div>
                <p style={{ fontSize:"0.9rem", fontWeight:500, color:"#1c1409" }}>{v}</p>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <Link to="/account/orders" className="btn-primary" style={{ flex:1, justifyContent:"center" }}>
              <Package style={{ width:15,height:15 }}/>My Orders
            </Link>
            <button onClick={logout} className="btn-outline" style={{ flex:1, justifyContent:"center" }}>Sign Out</button>
          </div>
        </div>
      </div>
    </ProtectedAccount>
  );
}
