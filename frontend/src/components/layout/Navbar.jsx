import { useState, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Menu, X, Leaf, MapPin, ChevronDown, User, LogOut, Package } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useCity } from "../../context/CityContext.jsx";

const NAV = [
  { to:"/",         label:"Home",     end:true },
  { to:"/shop",     label:"Shop"             },
  { to:"/about",    label:"About"            },
  { to:"/contact",  label:"Contact"          },
];

export default function Navbar() {
  const [open,     setOpen]     = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [cityMenu, setCityMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();
  const { city, selectCity, cities } = useCity();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const userRef = useRef(null);
  const cityRef = useRef(null);

  useEffect(() => { setOpen(false); setUserMenu(false); setCityMenu(false); }, [pathname]);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => {
    const fn = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenu(false);
      if (cityRef.current && !cityRef.current.contains(e.target)) setCityMenu(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <>
      <header style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100, height:64,
        // background: scrolled || open ? "rgba(26,60,52,.97)" : "transparent",
        background: "#3E8F7F", 
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,.1)" : "none",
        transition:"all .3s",
      }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 1rem", height:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>

          {/* Logo */}
          <Link to="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none", flexShrink:0 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#30ac90,#1a3c34)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(26,60,52,.3)" }}>
              <Leaf style={{ width:16, height:16, color:"white" }}/>
            </div>
            <div style={{ lineHeight:1.1 }}>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.1rem", fontWeight:600, color:"white" }}>Savitri</p>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.1rem", fontWeight:600, color:"#30ac90", marginTop:-4 }}>Livings</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display:"none", alignItems:"stretch", height:"100%", gap:4 }} className="desk-nav">
            {NAV.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end}
                style={({ isActive }) => ({
                  display:"flex", alignItems:"center", padding:"0 0.875rem",
                  fontSize:"0.875rem", fontWeight:500, textDecoration:"none",
                  color: isActive ? "#30ac90" : "rgba(255,255,255,.7)",
                  borderBottom: isActive ? "2px solid #30ac90" : "2px solid transparent",
                  transition:"color .2s",
                })}>{label}</NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {/* City selector */}
            <div ref={cityRef} style={{ position:"relative" }} className="desk-nav">
              <button onClick={() => setCityMenu(!cityMenu)}
                style={{ display:"flex", alignItems:"center", gap:4, padding:"0 10px", height:34, borderRadius:20, border:"1px solid rgba(255,255,255,.2)", background:"rgba(255,255,255,.08)", cursor:"pointer", fontSize:"0.8rem", color:"rgba(255,255,255,.8)", fontFamily:"'DM Sans',sans-serif" }}>
                <MapPin style={{ width:12, height:12, color:"#30ac90" }}/>{city}<ChevronDown style={{ width:12, height:12 }}/>
              </button>
              <AnimatePresence>
                {cityMenu && (
                  <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:6 }} transition={{ duration:.15 }}
                    style={{ position:"absolute", right:0, top:"calc(100% + 6px)", width:180, background:"#1a3c34", borderRadius:12, border:"1px solid rgba(255,255,255,.12)", boxShadow:"0 12px 40px rgba(0,0,0,.3)", overflow:"hidden", zIndex:200 }}>
                    {cities.map(c => (
                      <button key={c.name} onClick={() => { selectCity(c.name); setCityMenu(false); }}
                        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"0.625rem 1rem", background: city===c.name ? "rgba(48,172,144,.15)" : "transparent", border:"none", cursor: c.active ? "pointer" : "default", color: c.active ? (city===c.name?"#30ac90":"rgba(255,255,255,.75)") : "rgba(255,255,255,.3)", fontSize:"0.85rem", fontFamily:"'DM Sans',sans-serif", textAlign:"left" }}>
                        {c.name}
                        {!c.active && <span style={{ fontSize:"0.6rem", background:"rgba(255,255,255,.1)", padding:"1px 6px", borderRadius:4 }}>Soon</span>}
                        {city===c.name && c.active && <span style={{ width:6, height:6, borderRadius:"50%", background:"#30ac90", display:"inline-block" }}/>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <Link to="/cart" style={{ position:"relative", width:40, height:40, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,.8)", textDecoration:"none" }}>
              <ShoppingCart style={{ width:20, height:20 }}/>
              {totalItems > 0 && (
                <span style={{ position:"absolute", top:2, right:2, minWidth:17, height:17, background:"#c96030", color:"white", fontSize:10, fontWeight:700, borderRadius:"9999px", display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" }}>
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>

            {/* User dropdown — desktop */}
            {isAuthenticated ? (
              <div ref={userRef} style={{ position:"relative" }} className="desk-nav">
                <button onClick={() => setUserMenu(!userMenu)}
                  style={{ display:"flex", alignItems:"center", gap:6, height:36, padding:"0 8px", borderRadius:"9999px", border:"none", background:"transparent", cursor:"pointer" }}>
                  <span style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#30ac90,#1a3c34)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:12, fontWeight:700 }}>
                    {user?.fullName?.[0]}
                  </span>
                  <ChevronDown style={{ width:13, height:13, color:"rgba(255,255,255,.6)", transform: userMenu ? "rotate(180deg)" : "none", transition:"transform .2s" }}/>
                </button>
                <AnimatePresence>
                  {userMenu && (
                    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
                      style={{ position:"absolute", right:0, top:"calc(100% + 6px)", width:200, background:"white", borderRadius:14, border:"1px solid #e8dfd0", boxShadow:"0 12px 40px rgba(26,20,9,.15)", overflow:"hidden", zIndex:200 }}>
                      <div style={{ padding:"0.75rem 1rem", borderBottom:"1px solid #e8dfd0", background:"#fdf6ee" }}>
                        <p style={{ fontSize:10, color:"#8c7258", textTransform:"uppercase", letterSpacing:"0.1em" }}>Signed in as</p>
                        <p style={{ fontSize:13, fontWeight:500, color:"#1c1409", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.fullName}</p>
                      </div>
                      {[
                        { to:"/account",        Icon:User,    label:"My Account" },
                        { to:"/account/orders", Icon:Package, label:"My Orders"  },
                      ].map(({ to, Icon, label }) => (
                        <Link key={to} to={to} style={{ display:"flex", alignItems:"center", gap:10, padding:"0.75rem 1rem", fontSize:13, color:"#3a2c1a", textDecoration:"none" }}>
                          <Icon style={{ width:14, height:14, color:"#1a3c34" }}/>{label}
                        </Link>
                      ))}
                      <div style={{ borderTop:"1px solid #e8dfd0" }}>
                        <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"0.75rem 1rem", fontSize:13, color:"#dc2626", background:"transparent", border:"none", cursor:"pointer" }}>
                          <LogOut style={{ width:14, height:14 }}/>Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="desk-nav" style={{ display:"flex", alignItems:"center", gap:8 }}>
                <Link to="/login"    style={{ fontSize:"0.875rem", color:"rgba(255,255,255,.7)", textDecoration:"none", padding:"0 8px" }}>Login</Link>
                <Link to="/register" className="btn-terra" style={{ fontSize:"0.8rem", minHeight:36, padding:"0 1.25rem" }}>Join</Link>
              </div>
            )}

            {/* Hamburger */}
            <button className="mob-only" onClick={() => setOpen(!open)}
              style={{ width:40, height:40, borderRadius:"50%", border:"none", background:"rgba(255,255,255,.1)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white" }}>
              {open ? <X style={{ width:18, height:18 }}/> : <Menu style={{ width:18, height:18 }}/>}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div key="bd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setOpen(false)}
              style={{ position:"fixed", inset:0, zIndex:90, background:"rgba(0,0,0,.5)", backdropFilter:"blur(4px)" }}/>
            <motion.div key="dr" initial={{ x:"100%" }} animate={{ x:0 }} exit={{ x:"100%" }}
              transition={{ type:"tween", duration:.26 }}
              style={{ position:"fixed", top:0, right:0, bottom:0, zIndex:110, width:"82vw", maxWidth:300, background:"#1a3c34", display:"flex", flexDirection:"column" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.25rem", height:64, borderBottom:"1px solid rgba(255,255,255,.1)", flexShrink:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Leaf style={{ width:16, height:16, color:"#30ac90" }}/>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.1rem", color:"white" }}>Savitri Livings</span>
                </div>
                <button onClick={() => setOpen(false)} style={{ width:30, height:30, borderRadius:"50%", border:"none", background:"rgba(255,255,255,.1)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <X style={{ width:14, height:14, color:"white" }}/>
                </button>
              </div>

              {/* City selector mobile */}
              <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid rgba(255,255,255,.1)" }}>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>Delivering to</p>
                <div style={{ display:"flex", gap:6 }}>
                  {cities.map(c => (
                    <button key={c.name} onClick={() => c.active && selectCity(c.name)}
                      style={{ padding:"0.35rem 0.75rem", borderRadius:20, fontSize:"0.75rem", fontWeight:500, cursor: c.active ? "pointer" : "default", border:"1px solid", borderColor: city===c.name ? "#30ac90" : "rgba(255,255,255,.2)", background: city===c.name ? "rgba(48,172,144,.2)" : "transparent", color: c.active ? (city===c.name?"#30ac90":"rgba(255,255,255,.6)") : "rgba(255,255,255,.25)" }}>
                      {c.name}{!c.active && " *"}
                    </button>
                  ))}
                </div>
              </div>

              <nav style={{ flex:1, overflowY:"auto", padding:"1rem 0.875rem" }}>
                {NAV.map(({ to, label, end }) => (
                  <NavLink key={to} to={to} end={end}
                    style={({ isActive }) => ({
                      display:"flex", alignItems:"center", padding:"0.875rem 1rem",
                      borderRadius:"0.75rem", fontSize:"0.9rem", fontWeight:500,
                      color: isActive ? "#30ac90" : "rgba(255,255,255,.7)",
                      background: isActive ? "rgba(48,172,144,.12)" : "transparent",
                      textDecoration:"none", marginBottom:2,
                    })}>{label}</NavLink>
                ))}
                <div style={{ height:1, background:"rgba(255,255,255,.1)", margin:"0.75rem 0.25rem" }}/>
                {isAuthenticated ? (
                  <>
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0.75rem 1rem", marginBottom:4 }}>
                      <span style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#30ac90,#1a3c34)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:15, fontWeight:700, flexShrink:0 }}>{user?.fullName?.[0]}</span>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:500, color:"white", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.fullName}</p>
                        <p style={{ fontSize:11, color:"rgba(255,255,255,.4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.phone}</p>
                      </div>
                    </div>
                    {[
                      { to:"/account",        Icon:User,    label:"My Account" },
                      { to:"/account/orders", Icon:Package, label:"My Orders"  },
                      { to:"/cart",           Icon:ShoppingCart, label:`Cart (${totalItems})` },
                    ].map(({ to, Icon, label }) => (
                      <Link key={to} to={to} style={{ display:"flex", alignItems:"center", gap:10, padding:"0.875rem 1rem", borderRadius:"0.75rem", fontSize:"0.875rem", color:"rgba(255,255,255,.7)", textDecoration:"none", marginBottom:2 }}>
                        <Icon style={{ width:15, height:15, color:"#30ac90", flexShrink:0 }}/>{label}
                      </Link>
                    ))}
                    <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"0.875rem 1rem", borderRadius:"0.75rem", fontSize:"0.875rem", color:"#ef4444", background:"transparent", border:"none", cursor:"pointer", marginTop:4 }}>
                      <LogOut style={{ width:15, height:15, flexShrink:0 }}/>Sign Out
                    </button>
                  </>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <Link to="/login"    style={{ display:"flex", alignItems:"center", justifyContent:"center", height:44, borderRadius:12, border:"2px solid rgba(255,255,255,.3)", color:"rgba(255,255,255,.8)", fontSize:"0.875rem", fontWeight:500, textDecoration:"none" }}>Log in</Link>
                    <Link to="/register" className="btn-terra" style={{ justifyContent:"center" }}>Create Account</Link>
                  </div>
                )}
              </nav>
              <div style={{ height:"env(safe-area-inset-bottom,0px)", flexShrink:0 }}/>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media(min-width:768px){.desk-nav{display:flex!important}.mob-only{display:none!important}}
        @media(max-width:767px){.desk-nav{display:none!important}}
      `}</style>
    </>
  );
}
