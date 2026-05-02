import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f7f0e8" }}>
      {/* Desktop sidebar */}
      <aside style={{ width:220, background:"#2c1f14", flexShrink:0, position:"sticky", top:0, height:"100vh", overflow:"hidden" }} className="hidden md:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div key="bd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setOpen(false)}
              style={{ position:"fixed", inset:0, zIndex:80, background:"rgba(0,0,0,.5)" }}/>
            <motion.div key="sb" initial={{ x:"-100%" }} animate={{ x:0 }} exit={{ x:"-100%" }}
              transition={{ type:"tween", duration:.25 }}
              style={{ position:"fixed", top:0, left:0, bottom:0, zIndex:90, width:220 }}>
              <Sidebar onClose={() => setOpen(false)}/>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        {/* Mobile topbar */}
        <div style={{ height:52, background:"#2c1f14", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1rem", flexShrink:0 }} className="md:hidden">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#e38345,#c96030)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:14 }}>🌿</span>
            </div>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"0.9rem", color:"white", fontWeight:600 }}>Savitri Livings</span>
          </div>
          <button onClick={() => setOpen(!open)} style={{ width:32, height:32, borderRadius:8, border:"none", background:"rgba(255,255,255,.1)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white" }}>
            {open ? <X style={{ width:16, height:16 }}/> : <Menu style={{ width:16, height:16 }}/>}
          </button>
        </div>
        <main style={{ flex:1, padding:"1.5rem", overflowY:"auto" }}>
          <Outlet />
        </main>
      </div>
      <style>{`@media(min-width:768px){.hidden.md\\:block{display:block!important}}.hidden{display:none}`}</style>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
