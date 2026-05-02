import { Link } from "react-router-dom";
import { Leaf, Phone, Mail, MapPin, Instagram } from "lucide-react";

const WA  = import.meta.env.VITE_WHATSAPP   || "6207855397";
const IG  = import.meta.env.VITE_INSTAGRAM  || "livingcrafts__";

const COLS = {
  "Shop":    [{ to:"/shop",              label:"All Products"   },
              { to:"/shop?category=seashell", label:"Seashells" },
              { to:"/shop?category=decor",    label:"Home Decor" },
              { to:"/shop?category=gift",     label:"Gifts"     },
              { to:"/shop?category=seasonal", label:"Seasonal"  }],
  "Company": [{ to:"/about",   label:"About Us"   },
              { to:"/contact", label:"Contact"     },
              { to:"/faqs",    label:"FAQs"        }],
  "Help":    [{ to:"/legal#returns",  label:"Returns"       },
              { to:"/legal#privacy",  label:"Privacy Policy" },
              { to:"/legal#terms",    label:"Terms"         }],
};

export default function Footer() {
  return (
    <footer style={{ background:"#0f2419" }}>
      {/* CTA strip */}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"1.75rem 1rem", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:"1rem" }}>
          <div>
            <p className="section-tag" style={{ color:"#30ac90" }}>Handcrafted with love</p>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.6rem", color:"white" }}>Delivered to your door in Buxar</h3>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <Link to="/shop" className="btn-terra" style={{ fontSize:"0.875rem" }}>Shop Now</Link>
            <a href={`https://wa.me/91${WA}`} target="_blank" rel="noopener noreferrer" className="btn-wa" style={{ fontSize:"0.875rem" }}>Order on WhatsApp</a>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"2.5rem 1rem" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"2rem" }} className="footer-grid">

          {/* Brand col */}
          <div style={{ gridColumn:"span 2" }} className="footer-brand">
            <Link to="/" style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:"0.875rem", textDecoration:"none" }}>
              <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#30ac90,#1a3c34)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Leaf style={{ width:14, height:14, color:"white" }}/>
              </div>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.15rem", color:"white" }}>Savitri Livings</span>
            </Link>
            <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,.45)", lineHeight:1.75, marginBottom:"1.25rem", maxWidth:260 }}>
              Handcrafted seashell home decor, gifts and seasonal collections. Made with care, delivered with love.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { Icon:Phone,   text: `+91 ${WA}`,           href:`tel:+91${WA}` },
                { Icon:Mail,    text:"priyanshuverma8541@gmail.com", href:"mailto:priyanshuverma8541@gmail.com" },
                { Icon:MapPin,  text:"Buxar, Bihar",          href:null },
                { Icon:Instagram, text:`@${IG}`,              href:`https://instagram.com/${IG}` },
              ].map(({ Icon, text, href }) => (
                <div key={text} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:"0.8rem", color:"rgba(255,255,255,.45)" }}>
                  <Icon style={{ width:13, height:13, color:"#30ac90", flexShrink:0, marginTop:2 }}/>
                  {href ? <a href={href} target={href.startsWith("http")?"_blank":undefined} rel="noopener noreferrer" style={{ color:"rgba(255,255,255,.45)", textDecoration:"none" }}>{text}</a> : <span>{text}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(COLS).map(([heading, links]) => (
            <div key={heading}>
              <h4 style={{ color:"rgba(255,255,255,.7)", fontWeight:500, fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"1rem" }}>{heading}</h4>
              <ul style={{ listStyle:"none", padding:0, display:"flex", flexDirection:"column", gap:10 }}>
                {links.map(({ to, label }) => (
                  <li key={to}><Link to={to} style={{ fontSize:"0.85rem", color:"rgba(255,255,255,.4)", textDecoration:"none" }}>{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ height:1, background:"linear-gradient(to right,transparent,rgba(255,255,255,.1),transparent)", margin:"2rem 0" }}/>
        <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,.25)", textAlign:"center" }}>
          &copy; {new Date().getFullYear()} Savitri Livings. All rights reserved. Designed with 🌿
        </p>
      </div>
      <style>{`
        @media(min-width:768px){
          .footer-grid{grid-template-columns:2fr 1fr 1fr 1fr!important}
          .footer-brand{grid-column:span 1!important}
        }
      `}</style>
    </footer>
  );
}
