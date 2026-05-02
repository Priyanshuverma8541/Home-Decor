import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Lock, Phone } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const [form, setForm] = useState({ identifier:"", password:"" });
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (isAuthenticated) navigate("/", { replace:true }); }, [isAuthenticated]);

  const submit = async (e) => {
    e.preventDefault();
    const r = await login(form.identifier, form.password);
    if (r.success) navigate("/", { replace:true });
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#2c1f14 0%,#4a3728 60%,#3a2820 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem 1rem" }}>
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:.55 }}
        style={{ width:"100%", maxWidth:380 }}>
        <div style={{ background:"#fdf8f2", borderRadius:"1.25rem", padding:"2rem 2.25rem", boxShadow:"0 24px 64px rgba(0,0,0,.4)" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, marginBottom:"2rem" }}>
            <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#e38345,#c96030)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(201,96,48,.35)" }}>
              <Leaf style={{ width:24, height:24, color:"white" }}/>
            </div>
            <div style={{ textAlign:"center" }}>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.6rem", color:"#2c1f14" }}>Savitri Livings</h1>
              <p style={{ fontSize:"0.8rem", color:"#8c7060", marginTop:2 }}>Admin panel — sign in to continue</p>
            </div>
          </div>

          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label className="label">Phone or Email</label>
              <div style={{ position:"relative" }}>
                <Phone style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"#b09880", pointerEvents:"none" }}/>
                <input type="text" required autoComplete="username" placeholder="6207855397"
                  className="input" style={{ paddingLeft:36 }}
                  value={form.identifier} onChange={e=>setForm(f=>({...f,identifier:e.target.value}))}/>
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{ position:"relative" }}>
                <Lock style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"#b09880", pointerEvents:"none" }}/>
                <input type="password" required autoComplete="current-password" placeholder="••••••••"
                  className="input" style={{ paddingLeft:36 }}
                  value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-clay" style={{ width:"100%", justifyContent:"center", marginTop:4, minHeight:44 }}>
              {loading ? <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"white", borderRadius:"50%", display:"inline-block" }} className="spin"/> : "Sign In"}
            </button>
          </form>

          <p style={{ fontSize:"0.75rem", color:"#b09880", textAlign:"center", marginTop:"1.25rem", lineHeight:1.6 }}>
            Only admin accounts can access this panel.<br/>
            Contact Priyanshu to get access.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
