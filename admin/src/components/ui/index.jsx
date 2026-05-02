import { motion } from "framer-motion";
import { PackageOpen, Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
      <div style={{ width:36, height:36, border:"2.5px solid #f0e8e0", borderTopColor:"#c96030", borderRadius:"50%" }} className="spin"/>
      <p style={{ fontSize:12, color:"#8c7060", textTransform:"uppercase", letterSpacing:"0.15em" }}>Loading…</p>
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"4rem 1rem", textAlign:"center" }}>
      <PackageOpen style={{ width:48, height:48, color:"#d4c4b0", marginBottom:16 }}/>
      <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.4rem", color:"#6b5040", marginBottom:8 }}>{title}</h3>
      {message && <p style={{ fontSize:"0.875rem", color:"#8c7060", marginBottom:20, maxWidth:280 }}>{message}</p>}
      {action}
    </motion.div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display:"flex", gap:12, padding:"0.875rem", borderBottom:"1px solid #f0e8e0" }}>
      {[140,80,100,80,60].map((w,i) => <div key={i} className="skeleton" style={{ height:16, width:w, borderRadius:6 }}/>)}
    </div>
  );
}

export function StatCard({ label, value, sub, color = "#c96030", icon: Icon }) {
  return (
    <div className="card" style={{ padding:"1.25rem 1.5rem" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontSize:"0.75rem", color:"#8c7060", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>{label}</p>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", color:"#2c1f14", lineHeight:1 }}>{value}</p>
          {sub && <p style={{ fontSize:"0.75rem", color:"#8c7060", marginTop:4 }}>{sub}</p>}
        </div>
        {Icon && (
          <div style={{ width:40, height:40, borderRadius:10, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon style={{ width:20, height:20, color }}/>
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge status-${status}`} style={{ textTransform:"capitalize" }}>{status?.replace(/_/g," ")}</span>;
}

export function Button({ children, variant="clay", loading=false, disabled, onClick, type="button", className="", style={} }) {
  const cls = { clay:"btn-clay", teal:"btn-teal", ghost:"btn-ghost", danger:"btn-danger" };
  return (
    <button type={type} disabled={disabled||loading} onClick={onClick} className={`${cls[variant]||"btn-clay"} ${className}`} style={style}>
      {loading && <Loader2 style={{ width:14, height:14, flexShrink:0 }} className="spin"/>}
      {children}
    </button>
  );
}

export function Modal({ title, onClose, children, width = 480 }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:"fixed", inset:0, background:"rgba(44,31,20,.6)", backdropFilter:"blur(4px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
      onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:.97, y:12 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.97 }}
        onClick={e => e.stopPropagation()}
        style={{ background:"white", borderRadius:"1rem", width:"100%", maxWidth:width, maxHeight:"90vh", overflow:"auto", boxShadow:"0 20px 60px rgba(44,31,20,.25)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.25rem", borderBottom:"1px solid #f0e8e0", position:"sticky", top:0, background:"white", zIndex:1 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", color:"#2c1f14" }}>{title}</h3>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", border:"none", background:"#f0e8e0", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#6b5040" }}>✕</button>
        </div>
        <div style={{ padding:"1.25rem" }}>{children}</div>
      </motion.div>
    </motion.div>
  );
}
