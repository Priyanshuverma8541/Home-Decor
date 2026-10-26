import { Link } from "react-router-dom";
import { ArrowRight, Gem, Instagram, Mail, MapPin, Phone } from "lucide-react";

const WA = import.meta.env.VITE_WHATSAPP || "6207855397";
const IG = import.meta.env.VITE_INSTAGRAM || "livingcrafts__";
const EMAIL = import.meta.env.VITE_CONTACT_EMAIL || "savitrilivings@gmail.com";
const GROUPS = [
  { title: "Discover", links: [{ to: "/shop", label: "Shop Savitri" }, { href: "https://savitri-kolkata.vercel.app/", label: "Savitri Kolkata" }, { to: "/marketplace", label: "Thikana city explorer" }, { to: "/entertainment", label: "Entertainment" }] },
  { title: "Business & Community", links: [{ to: "/ecosystem", label: "SL Business" }, { href: "https://build-hub-lake.vercel.app/", label: "BuildHub" }, { to: "/partner-with-us", label: "Partner with us" }, { to: "/tools", label: "Everyday tools" }] },
  { title: "Help & Company", links: [{ to: "/about", label: "About Savitri Livings" }, { to: "/contact", label: "Contact" }, { to: "/faqs", label: "FAQs" }, { to: "/legal#returns", label: "Returns" }, { to: "/legal#privacy", label: "Privacy" }, { to: "/legal#terms", label: "Terms" }] },
];

function FooterLink({ link }) {
  const style = { color: "inherit", textDecoration: "none" };
  return link.href ? <a href={link.href} target="_blank" rel="noopener noreferrer" style={style}>{link.label}</a> : <Link to={link.to} style={style}>{link.label}</Link>;
}

export default function Footer({ onOpenPermissions }) {
  return <footer className="sl-footer">
    <section className="sl-footer-invitation">
      <div><span>ONE CONNECTED WORLD</span><h2>There’s more to Savitri Livings.</h2><p>Shop, discover your city, find business resources and explore what’s next.</p></div>
      <div className="sl-footer-actions"><Link to="/mall">Explore the Mall <ArrowRight size={16} /></Link><Link to="/ecosystem">Explore our ecosystem <ArrowRight size={16} /></Link></div>
    </section>
    <div className="sl-footer-main">
      <section className="sl-footer-brand">
        <Link to="/" className="sl-footer-logo"><span><Gem size={17} /></span><strong>Savitri Livings</strong></Link>
        <p>A growing home for shopping, local discovery, business resources and new ways to connect. Lifestyle · Living · More.</p>
        <a href={`tel:+91${WA}`}><Phone size={15} /> +91 {WA}</a>
        <a href={`mailto:${EMAIL}`}><Mail size={15} /> {EMAIL}</a>
        <span><MapPin size={15} /> Serving customers across India</span>
        <a href={`https://instagram.com/${IG}`} target="_blank" rel="noopener noreferrer"><Instagram size={15} /> @{IG}</a>
      </section>
      {GROUPS.map((group) => <nav className="sl-footer-group" key={group.title} aria-label={group.title}>
        <h3>{group.title}</h3><ul>{group.links.map((link) => <li key={link.label}><FooterLink link={link} /></li>)}{group.title === "Help & Company" && <li><button type="button" onClick={onOpenPermissions}>Privacy & Permissions</button></li>}</ul>
      </nav>)}
    </div>
    <div className="sl-footer-bottom"><span>© {new Date().getFullYear()} Savitri Livings. All rights reserved.</span><span>Made for a life with more in it.</span></div>
    <style>{`
      .sl-footer{position:relative;background:#2d2118;color:#fff5e6;padding:0 0 calc(83px + env(safe-area-inset-bottom,0px))}
      .sl-footer-invitation{max-width:1260px;margin:auto;padding:32px clamp(18px,4vw,44px);display:flex;align-items:center;justify-content:space-between;gap:25px;border-bottom:1px solid rgba(255,255,255,.12)}.sl-footer-invitation>div:first-child>span{color:#e1bd80;font:700 .61rem 'DM Sans',sans-serif;letter-spacing:.16em}.sl-footer-invitation h2{margin:5px 0;color:#fff8ee;font:500 clamp(1.75rem,3.5vw,2.7rem) 'Cormorant Garamond',serif}.sl-footer-invitation p{margin:0;color:rgba(255,245,230,.67);font-size:.84rem;line-height:1.5}.sl-footer-actions{display:flex;flex-wrap:wrap;gap:8px}.sl-footer-actions a{display:inline-flex;align-items:center;gap:8px;padding:11px 13px;border:1px solid rgba(255,245,230,.25);border-radius:999px;color:#f8e6c6;text-decoration:none;font:600 .72rem 'DM Sans',sans-serif}.sl-footer-actions a:first-child{border-color:#e7c489;background:#e7c489;color:#422c19}
      .sl-footer-main{display:grid;grid-template-columns:1.4fr repeat(3,minmax(0,1fr));gap:36px;max-width:1260px;margin:auto;padding:36px clamp(18px,4vw,44px) 28px}.sl-footer-logo{display:inline-flex;align-items:center;gap:10px;color:#fff7e9;text-decoration:none}.sl-footer-logo>span{display:grid;width:35px;height:35px;place-items:center;border-radius:50%;background:#e7c489;color:#56391e}.sl-footer-logo strong{font:600 1.4rem 'Cormorant Garamond',serif}.sl-footer-brand>p{max-width:300px;margin:13px 0 19px;color:rgba(255,245,230,.67);font:400 .83rem/1.7 'DM Sans',sans-serif}.sl-footer-brand>a,.sl-footer-brand>span{display:flex;align-items:center;gap:9px;margin-top:10px;color:rgba(255,245,230,.7);font:400 .75rem 'DM Sans',sans-serif;text-decoration:none}.sl-footer-brand svg{flex:0 0 auto;color:#dabb82}.sl-footer-group h3{margin:4px 0 16px;color:#e9cfaa;font:700 .66rem 'DM Sans',sans-serif;letter-spacing:.13em;text-transform:uppercase}.sl-footer-group ul{display:grid;gap:12px;padding:0;margin:0;list-style:none}.sl-footer-group li,.sl-footer-group button,.sl-footer-group a{color:rgba(255,245,230,.69);font:400 .78rem 'DM Sans',sans-serif}.sl-footer-group a:hover,.sl-footer-group button:hover,.sl-footer-brand>a:hover{color:#f4d79e}.sl-footer-group button{padding:0;border:0;background:none;text-align:left;cursor:pointer}.sl-footer-bottom{max-width:1260px;margin:auto;padding:15px clamp(18px,4vw,44px) 0;display:flex;justify-content:space-between;gap:15px;border-top:1px solid rgba(255,255,255,.1);color:rgba(255,245,230,.46);font:400 .67rem 'DM Sans',sans-serif}
      @media(max-width:760px){.sl-footer-invitation{display:block;padding-top:27px;padding-bottom:24px}.sl-footer-actions{margin-top:16px}.sl-footer-main{grid-template-columns:repeat(2,minmax(0,1fr));gap:26px 18px;padding-top:27px}.sl-footer-brand{grid-column:1/-1}.sl-footer-brand>p{max-width:460px}.sl-footer-group h3{margin-bottom:12px}.sl-footer-group ul{gap:10px}.sl-footer-bottom{flex-direction:column;text-align:center;gap:6px;padding-top:13px}}
    `}</style>
  </footer>;
}
