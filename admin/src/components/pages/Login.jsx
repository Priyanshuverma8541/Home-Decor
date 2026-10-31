import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Lock, Phone, Store } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { BUSINESS_OPTIONS, useBusinessAuth } from "../../context/BusinessAuthContext.jsx";

export default function Login() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "business" ? "business" : "super");
  const [form, setForm] = useState({ identifier:"", password:"", slug: BUSINESS_OPTIONS[0].slug, email:"" });
  const { login, loading, isAuthenticated, logout: logoutSuper } = useAuth();
  const businessAuth = useBusinessAuth();
  const navigate = useNavigate();
  useEffect(() => { if (isAuthenticated && mode === "super") navigate("/", { replace:true }); }, [isAuthenticated, mode, navigate]);
  useEffect(() => { setMode(params.get("mode") === "business" ? "business" : "super"); }, [params]);

  const submit = async (event) => {
    event.preventDefault();
    if (mode === "super") {
      await businessAuth.logout();
      const result = await login(form.identifier, form.password);
      if (result.success) navigate("/", { replace:true });
    } else {
      logoutSuper();
      const result = await businessAuth.login(form.slug, form.email, form.password);
      if (result.success) navigate("/business", { replace:true });
      else window.alert(result.message);
    }
  };
  const businessMode = mode === "business";
  return <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#2c1f14 0%,#4a3728 60%,#3a2820 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem 1rem" }}>
    <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:.55 }} style={{ width:"100%", maxWidth:410 }}>
      <div style={{ background:"#fdf8f2", borderRadius:"1.25rem", padding:"2rem 2.25rem", boxShadow:"0 24px 64px rgba(0,0,0,.4)" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, marginBottom:"1.25rem" }}>
          <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#e38345,#c96030)", display:"flex", alignItems:"center", justifyContent:"center" }}><Leaf style={{ width:24, height:24, color:"white" }}/></div>
          <div style={{ textAlign:"center" }}><h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.6rem", color:"#2c1f14" }}>Savitri Livings</h1><p style={{ fontSize:"0.8rem", color:"#8c7060", marginTop:2 }}>{businessMode ? "Business client login" : "Super admin sign in"}</p></div>
        </div>
        <div role="tablist" aria-label="Login type" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",padding:4,background:"#f2e9dd",borderRadius:11,marginBottom:18 }}>
          {[ ["super","Super admin"], ["business","Business client"] ].map(([value,label])=><button key={value} type="button" role="tab" aria-selected={mode===value} onClick={()=>setMode(value)} style={{border:0,borderRadius:8,padding:"10px 6px",background:mode===value?"white":"transparent",color:"#563326",fontWeight:700,cursor:"pointer"}}>{label}</button>)}
        </div>
        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {businessMode ? <>
            <label className="label">Business<select className="input" value={form.slug} onChange={event=>setForm(current=>({...current,slug:event.target.value}))}>{BUSINESS_OPTIONS.map(item=><option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
            <label className="label">Business email<div style={{position:"relative"}}><Store style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",width:15,height:15,color:"#b09880"}}/><input type="email" required autoComplete="username" className="input" style={{paddingLeft:36}} placeholder="you@business.com" value={form.email} onChange={event=>setForm(current=>({...current,email:event.target.value}))}/></div></label>
          </> : <label className="label">Super admin phone or email<div style={{position:"relative"}}><Phone style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",width:15,height:15,color:"#b09880"}}/><input type="text" required autoComplete="username" placeholder="Phone or email" className="input" style={{paddingLeft:36}} value={form.identifier} onChange={event=>setForm(current=>({...current,identifier:event.target.value}))}/></div></label>}
          <label className="label">Password<div style={{position:"relative"}}><Lock style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",width:15,height:15,color:"#b09880"}}/><input type="password" required autoComplete="current-password" placeholder="••••••••" className="input" style={{paddingLeft:36}} value={form.password} onChange={event=>setForm(current=>({...current,password:event.target.value}))}/></div></label>
          <button type="submit" disabled={loading||businessAuth.loading} className="btn-clay" style={{width:"100%",justifyContent:"center",marginTop:4,minHeight:44}}>{loading||businessAuth.loading?"Signing in…":businessMode?"Sign in to business":"Sign in as super admin"}</button>
        </form>
        <p style={{fontSize:"0.75rem",color:"#b09880",textAlign:"center",marginTop:"1.1rem",lineHeight:1.6}}>{businessMode?"Business access is restricted to the selected business. Ask the Savitri super admin to set up your account.":"Only the Savitri super admin can access platform settings and manage client businesses."}</p>
      </div>
    </motion.div>
  </div>;
}
