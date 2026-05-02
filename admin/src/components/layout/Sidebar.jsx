import { NavLink, Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Users, Megaphone, Settings, LogOut, Leaf, UserCheck, BarChart2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const LINKS = [
  { to:"/",          Icon:LayoutDashboard, label:"Dashboard",   end:true },
  { to:"/orders",    Icon:ShoppingBag,     label:"Orders"              },
  { to:"/products",  Icon:Package,         label:"Products"            },
  { to:"/crm",       Icon:Users,           label:"CRM & Leads"         },
  { to:"/partners",  Icon:UserCheck,       label:"Partners"            },
  { to:"/campaigns", Icon:Megaphone,       label:"Campaigns"           },
  { to:"/analytics", Icon:BarChart2,       label:"Analytics"           },
  { to:"/settings",  Icon:Settings,        label:"Settings"            },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div style={{ width:"100%", height:"100%", background:"#2c1f14", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"1.25rem 1rem", borderBottom:"1px solid rgba(255,255,255,.08)", flexShrink:0 }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }} onClick={onClose}>
          <div style={{ width:34, height:34, borderRadius:"10px", background:"linear-gradient(135deg,#e38345,#c96030)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Leaf style={{ width:16, height:16, color:"white" }}/>
          </div>
          <div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"0.95rem", fontWeight:600, color:"white", lineHeight:1.2 }}>Savitri Livings</p>
            <p style={{ fontSize:"0.65rem", color:"rgba(255,255,255,.4)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Admin Panel</p>
          </div>
        </Link>
      </div>

      <div style={{ padding:"0.875rem 1rem", borderBottom:"1px solid rgba(255,255,255,.08)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#e38345,#c96030)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:13, fontWeight:600, flexShrink:0 }}>
            {user?.fullName?.[0]}
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:"0.8rem", fontWeight:500, color:"white", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.fullName}</p>
            <p style={{ fontSize:"0.65rem", color:"rgba(255,255,255,.4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.phone || user?.email}</p>
          </div>
        </div>
      </div>

      <nav style={{ flex:1, padding:"0.75rem 0.625rem", overflowY:"auto" }}>
        {LINKS.map(({ to, Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onClose}
            style={({ isActive }) => ({
              display:"flex", alignItems:"center", gap:10,
              padding:"0.6rem 0.75rem", borderRadius:"0.625rem",
              fontSize:"0.875rem", fontWeight:500, textDecoration:"none", marginBottom:2,
              color: isActive ? "#2c1f14" : "rgba(255,255,255,.55)",
              background: isActive ? "linear-gradient(135deg,#e38345,#c96030)" : "transparent",
            })}>
            {({ isActive }) => (
              <><Icon style={{ width:15, height:15, flexShrink:0, color: isActive ? "#2c1f14" : "rgba(255,255,255,.55)" }}/>{label}</>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding:"0.75rem 0.625rem", borderTop:"1px solid rgba(255,255,255,.08)", flexShrink:0 }}>
        <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"0.6rem 0.75rem", borderRadius:"0.625rem", fontSize:"0.875rem", color:"#ef4444", background:"transparent", border:"none", cursor:"pointer" }}>
          <LogOut style={{ width:15, height:15, flexShrink:0 }}/>Sign Out
        </button>
      </div>
    </div>
  );
}
