import { motion, AnimatePresence } from "framer-motion";
import { PackageOpen, Loader2, Leaf, X } from "lucide-react";
import { Link } from "react-router-dom";

export function PageLoader() {
  return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14 }}>
      <div style={{ width:40, height:40, border:"2.5px solid #ede5d8", borderTopColor:"#1a3c34", borderRadius:"50%" }} className="spin"/>
      <p style={{ fontSize:11, fontFamily:"'DM Sans',sans-serif", color:"#8c7258", textTransform:"uppercase", letterSpacing:"0.15em" }}>Loading…</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ overflow:"hidden" }}>
      <div className="skeleton" style={{ aspectRatio:"1", width:"100%" }}/>
      <div style={{ padding:"0.875rem" }}>
        <div className="skeleton" style={{ height:13, width:"70%", marginBottom:8, borderRadius:6 }}/>
        <div className="skeleton" style={{ height:11, width:"45%", marginBottom:12, borderRadius:6 }}/>
        <div className="skeleton" style={{ height:38, width:"100%", borderRadius:9999 }}/>
      </div>
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"5rem 1rem", textAlign:"center" }}>
      <PackageOpen style={{ width:52, height:52, color:"#c8b89a", marginBottom:16 }}/>
      <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.5rem", color:"#5c4a32", marginBottom:8 }}>{title}</h3>
      {message && <p style={{ fontSize:"0.875rem", color:"#8c7258", marginBottom:24, maxWidth:280 }}>{message}</p>}
      {action}
    </motion.div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    pending:"badge-terra", confirmed:"badge-teal", packed:"badge-sand",
    assigned:"badge-sand", out_for_delivery:"badge-teal", delivered:"badge-green",
    cancelled:"badge-red", paid:"badge-green", refunded:"badge-sand",
  };
  return <span className={`badge ${map[status]||"badge-gray"}`} style={{ textTransform:"capitalize" }}>{status?.replace(/_/g," ")}</span>;
}

export function NotFound() {
  return (
    <div style={{ minHeight:"70vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"2rem 1rem" }}>
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:.6 }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"#f0e6d0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1.5rem" }}>
          <Leaf style={{ width:36, height:36, color:"#1a3c34" }}/>
        </div>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"5rem", color:"#c96030", marginBottom:4 }}>404</h1>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.75rem", color:"#1c1409", marginBottom:"0.75rem" }}>Page Not Found</h2>
        <p style={{ color:"#8c7258", marginBottom:"2rem" }}>The page you are looking for does not exist.</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </motion.div>
    </div>
  );
}

export function Modal({ onClose, children }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        style={{ position:"fixed", inset:0, background:"rgba(26,20,9,.65)", backdropFilter:"blur(5px)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
        <motion.div initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
          transition={{ type:"spring", damping:28, stiffness:300 }}
          onClick={e=>e.stopPropagation()}
          style={{ background:"white", width:"100%", maxWidth:480, borderRadius:"1.5rem 1.5rem 0 0", maxHeight:"92vh", overflow:"auto", paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.25rem", borderBottom:"1px solid #e8dfd0", position:"sticky", top:0, background:"white", zIndex:1 }}>
            <div style={{ width:36, height:4, background:"#d8cfc0", borderRadius:2, margin:"0 auto" }}/>
            <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", border:"none", background:"#f0e6d0", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <X style={{ width:13, height:13, color:"#8c7258" }}/>
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function QRPayModal({ amount, orderId, upiId, onClose }) {
  const deepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("Savitri Livings")}&am=${amount}&cu=INR`;
  const copy = () => { navigator.clipboard.writeText(upiId); };

  return (
    <Modal onClose={onClose}>
      <div style={{ padding:"1.25rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.5rem", color:"#1c1409", marginBottom:4 }}>Pay via UPI</p>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2.5rem", color:"#c96030" }}>
            Rs.{Number(amount).toLocaleString("en-IN")}
          </p>
        </div>
        <div style={{ display:"flex", justifyContent:"center" }}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(deepLink)}`}
            alt="UPI QR" style={{ width:180, height:180, borderRadius:12, border:"2px solid #f0e6d0" }}
          />
        </div>
        <p style={{ textAlign:"center", fontSize:12, color:"#8c7258" }}>Scan with PhonePe, GPay, Paytm or any UPI app</p>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#fdf6ee", borderRadius:10, padding:"0.75rem 1rem", border:"1px solid #e8dfd0" }}>
          <div>
            <p style={{ fontSize:9, color:"#8c7258", textTransform:"uppercase", letterSpacing:"0.1em" }}>UPI ID</p>
            <p style={{ fontSize:13, fontWeight:500, color:"#1c1409" }}>{upiId}</p>
          </div>
          <button onClick={copy} className="btn-ghost" style={{ minHeight:32, padding:"0 10px", fontSize:12 }}>Copy</button>
        </div>
        <div style={{ background:"#fdf6ee", borderRadius:10, padding:"0.875rem 1rem", fontSize:12, color:"#5c4a32", lineHeight:1.8 }}>
          <p style={{ fontWeight:500, marginBottom:4 }}>Steps:</p>
          <p>1. Open any UPI app and scan the QR code</p>
          <p>2. Pay exactly <strong>Rs.{Number(amount).toLocaleString("en-IN")}</strong></p>
          <p>3. Take a screenshot and send it on WhatsApp</p>
        </div>
        <a href={`https://wa.me/91${import.meta.env.VITE_WHATSAPP}?text=${encodeURIComponent(`Payment done for order #${orderId}. Amount: Rs.${amount}`)}`}
          target="_blank" rel="noopener noreferrer" className="btn-wa" style={{ justifyContent:"center" }}>
          Confirm Payment on WhatsApp
        </a>
        <button onClick={onClose} className="btn-ghost" style={{ justifyContent:"center", fontSize:13 }}>Close</button>
      </div>
    </Modal>
  );
}
