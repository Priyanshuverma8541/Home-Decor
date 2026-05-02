import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Phone, Lock, Eye, EyeOff, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

function AuthShell({ children, title, sub }) {
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f2419 0%,#1a3c34 60%,#0f2419 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem 1rem" }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.55 }} style={{ width:"100%", maxWidth:380 }}>
        <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:"1.5rem", padding:"2rem 2.25rem", backdropFilter:"blur(20px)" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, marginBottom:"1.75rem" }}>
            <div style={{ width:50, height:50, borderRadius:14, background:"linear-gradient(135deg,#30ac90,#1a3c34)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(48,172,144,.3)" }}>
              <Leaf style={{ width:22, height:22, color:"white" }}/>
            </div>
            <div style={{ textAlign:"center" }}>
              <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.6rem", color:"white" }}>{title}</h1>
              <p style={{ fontSize:"0.8rem", color:"rgba(255,255,255,.5)", marginTop:2 }}>{sub}</p>
            </div>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export function Login() {
  const [form, setForm] = useState({ identifier:"", password:"" });
  const [show, setShow] = useState(false);
  const { login, loading, isAuthenticated } = useAuth();
  const navigate  = useNavigate();
  const { state } = useLocation();
  const from      = state?.from?.pathname || "/";

  useEffect(() => { if (isAuthenticated) navigate(from, { replace:true }); }, [isAuthenticated]);

  const submit = async (e) => {
    e.preventDefault();
    const r = await login(form.identifier, form.password);
    if (r.success) navigate(from, { replace:true });
  };

  const fi = (k) => (e) => setForm(f=>({...f,[k]:e.target.value}));

  return (
    <AuthShell title="Welcome back" sub="Sign in to your account">
      <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <label style={{ display:"block", fontSize:"0.7rem", fontWeight:500, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Phone or Email</label>
          <div style={{ position:"relative" }}>
            <Phone style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"rgba(255,255,255,.3)", pointerEvents:"none" }}/>
            <input type="text" required autoComplete="username" placeholder="6207855397"
              style={{ width:"100%", height:46, paddingLeft:38, paddingRight:14, borderRadius:"0.75rem", border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.08)", color:"white", fontSize:"16px", fontFamily:"'DM Sans',sans-serif", outline:"none" }}
              value={form.identifier} onChange={fi("identifier")}/>
          </div>
        </div>
        <div>
          <label style={{ display:"block", fontSize:"0.7rem", fontWeight:500, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Password</label>
          <div style={{ position:"relative" }}>
            <Lock style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"rgba(255,255,255,.3)", pointerEvents:"none" }}/>
            <input type={show?"text":"password"} required autoComplete="current-password" placeholder="••••••••"
              style={{ width:"100%", height:46, paddingLeft:38, paddingRight:42, borderRadius:"0.75rem", border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.08)", color:"white", fontSize:"16px", fontFamily:"'DM Sans',sans-serif", outline:"none" }}
              value={form.password} onChange={fi("password")}/>
            <button type="button" onClick={() => setShow(!show)}
              style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", width:28, height:28, borderRadius:"50%", border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,.4)" }}>
              {show ? <EyeOff style={{ width:14,height:14 }}/> : <Eye style={{ width:14,height:14 }}/>}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-terra" style={{ width:"100%", justifyContent:"center", minHeight:46, marginTop:4 }}>
          {loading ? <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"white", borderRadius:"50%", display:"inline-block" }} className="spin"/> : "Sign In"}
        </button>
      </form>
      <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,.4)", textAlign:"center", marginTop:"1.25rem" }}>
        No account? <Link to="/register" style={{ color:"#30ac90", fontWeight:500, textDecoration:"none" }}>Create one</Link>
      </p>
    </AuthShell>
  );
}

export function Register() {
  const [form, setForm] = useState({ fullName:"", phone:"", password:"", city:"Buxar" });
  const [show, setShow] = useState(false);
  const { register, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (isAuthenticated) navigate("/"); }, [isAuthenticated]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { return; }
    const r = await register(form);
    if (r.success) navigate("/");
  };

  const fi = (k) => (e) => setForm(f=>({...f,[k]:e.target.value}));

  return (
    <AuthShell title="Create account" sub="Join Savitri Livings">
      <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {[{ k:"fullName",l:"Full Name",Icon:User,t:"text",a:"name",ph:"Priya Sharma" },
          { k:"phone",   l:"Phone",    Icon:Phone,t:"tel", a:"tel",ph:"9876543210"  }].map(({ k,l,Icon,t,a,ph }) => (
          <div key={k}>
            <label style={{ display:"block", fontSize:"0.7rem", fontWeight:500, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>{l}</label>
            <div style={{ position:"relative" }}>
              <Icon style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"rgba(255,255,255,.3)", pointerEvents:"none" }}/>
              <input type={t} required autoComplete={a} placeholder={ph}
                style={{ width:"100%", height:46, paddingLeft:38, paddingRight:14, borderRadius:"0.75rem", border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.08)", color:"white", fontSize:"16px", fontFamily:"'DM Sans',sans-serif", outline:"none" }}
                value={form[k]} onChange={fi(k)}/>
            </div>
          </div>
        ))}
        <div>
          <label style={{ display:"block", fontSize:"0.7rem", fontWeight:500, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>City</label>
          <select required value={form.city} onChange={fi("city")}
            style={{ width:"100%", height:46, paddingLeft:12, borderRadius:"0.75rem", border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.08)", color:"white", fontSize:"16px", fontFamily:"'DM Sans',sans-serif", outline:"none" }}>
            {["Buxar","Varanasi","Kolkata"].map(c=><option key={c} value={c} style={{ background:"#1a3c34" }}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display:"block", fontSize:"0.7rem", fontWeight:500, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Password</label>
          <div style={{ position:"relative" }}>
            <Lock style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"rgba(255,255,255,.3)", pointerEvents:"none" }}/>
            <input type={show?"text":"password"} required autoComplete="new-password" placeholder="Min 6 characters"
              style={{ width:"100%", height:46, paddingLeft:38, paddingRight:42, borderRadius:"0.75rem", border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.08)", color:"white", fontSize:"16px", fontFamily:"'DM Sans',sans-serif", outline:"none" }}
              value={form.password} onChange={fi("password")}/>
            <button type="button" onClick={() => setShow(!show)}
              style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", width:28, height:28, borderRadius:"50%", border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,.4)" }}>
              {show ? <EyeOff style={{ width:14,height:14 }}/> : <Eye style={{ width:14,height:14 }}/>}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-terra" style={{ width:"100%", justifyContent:"center", minHeight:46, marginTop:4 }}>
          {loading ? <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"white", borderRadius:"50%", display:"inline-block" }} className="spin"/> : "Create Account"}
        </button>
      </form>
      <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,.4)", textAlign:"center", marginTop:"1.25rem" }}>
        Already have an account? <Link to="/login" style={{ color:"#30ac90", fontWeight:500, textDecoration:"none" }}>Sign in</Link>
      </p>
    </AuthShell>
  );
}
