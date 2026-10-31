import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, Heart, Instagram,
  MapPin, Menu, Phone, ShieldCheck, Sparkles, Wheat, X,
} from "lucide-react";

const whatsappNumber = "919142666059";
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Namaste GangaBhog, please share atta availability and details.")}`;
const instagramUrl = "https://instagram.com/gangabhog";
const fieldImage = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=85";

const benefits = [
  { icon: Wheat, title: "Bihar wheat", copy: "Made with wheat from Bihar" },
  { icon: Sparkles, title: "Stone ground", copy: "Traditional milling, thoughtful food" },
  { icon: Heart, title: "Everyday goodness", copy: "For the meals that bring us together" },
  { icon: ShieldCheck, title: "Carefully packed", copy: "Quality packed for your home" },
];

function Brand({ light = false, website }) {
  return <Link to="/" className={`gb-brand${light ? " gb-brand-light" : ""}`} aria-label="GangaBhog home">
    <img src={website?.logoUrl || "/gangabhog/logo.png"} alt="" />
    <span><b>GangaBhog</b><small>{website?.tagline || "PURE TRADITION · SINCE 1980"}</small></span>
  </Link>;
}

function SectionHeading({ eyebrow, children, copy, align = "left" }) {
  return <div className={`gb-heading gb-heading-${align}`}><span className="gb-eyebrow">{eyebrow}</span><h2>{children}</h2>{copy && <p>{copy}</p>}</div>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [website, setWebsite] = useState(null);
  const [products, setProducts] = useState([]);
  const closeMenu = () => setMenuOpen(false);
  const api = (import.meta.env.VITE_API_URL || "https://home-decor-0rfj.onrender.com").replace(/\/+$/, "");
  useEffect(() => {
    let current = true;
    Promise.all([
      fetch(`${api}/api/tenants/public/gangabhog`).then((response) => response.ok ? response.json() : null),
      fetch(`${api}/api/tenants/public/gangabhog/products?limit=8`).then((response) => response.ok ? response.json() : null),
    ]).then(([storeResult, productResult]) => {
      if (!current) return;
      setWebsite(storeResult?.store?.website || null);
      setProducts(productResult?.products || []);
    }).catch(() => {});
    return () => { current = false; };
  }, [api]);
  const contactNumber = (website?.whatsappNumber || whatsappNumber).replace(/\D/g, "");
  const whatsappLink = `https://wa.me/${contactNumber}?text=${encodeURIComponent("Namaste GangaBhog, please share atta availability and details.")}`;
  const instagramLink = website?.instagramUrl || instagramUrl;

  return <div className="gb-site">
    <div className="gb-topline"><span>✦</span> From Bihar’s wheat fields <i /> Rooted in Buxar since 1980 <span>✦</span></div>
    <header className="gb-header">
      <Brand website={website} />
      <nav className="gb-desktop-nav" aria-label="Main navigation"><a href="#story">Our story</a><a href="#quality">Our promise</a><a href="#atta">Our atta</a><a href="#contact">Contact</a></nav>
      <a className="gb-header-cta" href={whatsappLink} target="_blank" rel="noreferrer">Enquire <ArrowUpRight size={15}/></a>
      <button className="gb-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
    </header>
    <nav className={`gb-mobile-nav${menuOpen ? " is-open" : ""}`} aria-label="Mobile navigation"><a href="#story" onClick={closeMenu}>Our story <ArrowRight size={15}/></a><a href="#quality" onClick={closeMenu}>Our promise <ArrowRight size={15}/></a><a href="#atta" onClick={closeMenu}>Our atta <ArrowRight size={15}/></a><a href="#contact" onClick={closeMenu}>Contact <ArrowRight size={15}/></a></nav>

    <main>
      <section className="gb-hero" aria-label="GangaBhog Atta"><img className="gb-hero-art" src={website?.heroImageUrl || "/gangabhog/hero-campaign.png"} alt={website?.heroTitle || "Ganga Bhog Atta made from Bihar wheat"}/><div className="gb-hero-shade"/><div className="gb-hero-tag"><span>{website?.heroEyebrow || "GANGA BHOG ATTA"}</span><i/> {website?.tagline || "A taste of home, since 1980"}</div><a href="#atta" className="gb-hero-button">Discover our atta <ArrowDown size={16}/></a><div className="gb-hero-index">BUXAR, BIHAR <span>01 / 03</span></div></section>
      <div className="gb-trust-strip"><span><Wheat/> Bihar wheat</span><i/><span><Heart/> Made for every home</span><i/><span><ShieldCheck/> Packed with care</span></div>

      <section className="gb-story gb-section" id="story"><div className="gb-story-photo"><img src={fieldImage} alt="Golden wheat fields in the evening light"/><span className="gb-photo-note"><Wheat size={15}/> FROM THE FIELDS OF BIHAR</span></div><div className="gb-story-copy"><span className="gb-eyebrow">A LEGACY OF GOODNESS</span><h1>{website?.heroTitle || <>Har ghar ki sehat.<br/><em>Har din ka saath.</em></>}</h1><p>{website?.heroDescription || "Since 1980, GangaBhog has brought the goodness of Bihar wheat to the everyday table. A familiar taste, made for warm rotis, shared meals and the people who make a house a home."}</p><a className="gb-text-link" href="#quality">Our promise <ArrowRight size={16}/></a><div className="gb-story-seal"><span>G</span><small>ROOTED IN<br/>BIHAR</small></div></div></section>

      <section className="gb-quality" id="quality"><div className="gb-section gb-quality-inner"><SectionHeading eyebrow="GOOD FOOD, ROOTED IN TRADITION" copy="Simple goodness for the everyday meals your family loves." align="center">A little more goodness<br/><em>in every meal.</em></SectionHeading><div className="gb-benefits">{benefits.map(({icon:Icon,title,copy},index)=><article className="gb-benefit" key={title}><span className="gb-benefit-number">0{index+1}</span><span className="gb-benefit-icon"><Icon size={20}/></span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

      <section className="gb-atta gb-section" id="atta"><div className="gb-atta-copy"><span className="gb-eyebrow">MEET YOUR EVERYDAY ATTA</span><h2>From our fields<br/>to <em>your phulka.</em></h2><p>Ganga Bhog Atta is made from Bihar wheat and stone ground for the flavour you know. Bring home a little tradition for your everyday table.</p><ul><li><Check size={15}/> Made from Bihar wheat</li><li><Check size={15}/> Stone ground</li><li><Check size={15}/> 26 kg pack</li></ul><a href={whatsappLink} target="_blank" rel="noreferrer" className="gb-button gb-button-red">Ask about availability <ArrowRight size={16}/></a><small className="gb-availability-note">Message us for pricing and local availability.</small></div><div className="gb-pack-shot"><span className="gb-pack-rays"/><img src="/gangabhog/atta-pack.png" alt="Ganga Bhog Atta 26 kg pack"/><div className="gb-pack-caption"><span>GANGA BHOG ATTA</span><b>Pure tradition.<br/>Premium nutrition.</b></div></div></section>

      <section className="gb-origin" style={{backgroundImage:`linear-gradient(90deg,rgba(23,39,27,.88),rgba(23,39,27,.38)),url(${fieldImage})`}}><div className="gb-origin-copy"><span className="gb-eyebrow gb-eyebrow-light">FROM BUXAR, WITH PRIDE</span><h2>Made of Bihar.<br/><em>Made for you.</em></h2><p>Good wheat. A little care. And the joy of sharing fresh rotis around the table. That’s the GangaBhog way.</p><a href="#contact" className="gb-button gb-button-light">Get in touch <ArrowRight size={16}/></a></div><span className="gb-origin-place"><MapPin size={14}/> BUXAR · BIHAR · INDIA</span></section>

      <section className="gb-faq gb-section"><SectionHeading eyebrow="A FEW QUICK ANSWERS" align="center">Good to <em>know.</em></SectionHeading><div className="gb-faq-list"><details><summary>Where is GangaBhog Atta from?<ChevronDown size={17}/></summary><p>GangaBhog is rooted in Buxar, Bihar, and made from Bihar wheat.</p></details><details><summary>What pack size is available?<ChevronDown size={17}/></summary><p>The pack shown here is 26 kg. Message us to check current availability and pricing.</p></details><details><summary>How can I order or enquire?<ChevronDown size={17}/></summary><p>Reach us directly on WhatsApp or call us at +91 91426 66059.</p></details></div></section>

      <section className="gb-contact" id="contact"><div className="gb-contact-inner"><div><span className="gb-eyebrow gb-eyebrow-light">WE’D LOVE TO HEAR FROM YOU</span><h2>Let’s bring a little<br/><em>goodness home.</em></h2><p>For atta availability, retail enquiries or just to say namaste.</p></div><div className="gb-contact-actions"><a href={whatsappLink} target="_blank" rel="noreferrer" className="gb-button gb-button-gold"><Phone size={17}/> WhatsApp us <ArrowRight size={16}/></a><a href={`tel:${website?.phone || "+919142666059"}`} className="gb-contact-phone">{website?.phone || "+91 91426 66059"} <ArrowUpRight size={15}/></a><a href={instagramLink} target="_blank" rel="noreferrer" className="gb-instagram"><Instagram size={16}/> Follow <b>@gangabhog</b></a></div></div></section>
      {products.length > 0 && <section className="gb-catalogue gb-section"><SectionHeading eyebrow="AVAILABLE FROM GANGABHOG" copy="Products managed by your business team.">Our <em>products.</em></SectionHeading><div className="gb-catalogue-grid">{products.map((product) => <article className="gb-catalogue-card" key={product._id}>{product.images?.[0] && <img src={product.images[0]} alt={product.name}/>}<h3>{product.name}</h3><p>{product.description}</p><b>₹{product.price}</b><a href={whatsappLink} target="_blank" rel="noreferrer" className="gb-button gb-button-red">Enquire on WhatsApp <ArrowRight size={15}/></a></article>)}</div></section>}    </main>
    <footer className="gb-footer"><div className="gb-footer-main"><div><Brand light website={website}/><p>Har ghar ki sehat. Har din ka saath.</p></div><div className="gb-footer-links"><span className="gb-eyebrow gb-eyebrow-light">FIND US</span><a href={`tel:${website?.phone || "+919142666059"}`}><Phone size={14}/> {website?.phone || "+91 91426 66059"}</a><a href={instagramLink} target="_blank" rel="noreferrer"><Instagram size={14}/> @gangabhog</a><span><MapPin size={14}/> Buxar, Bihar, India</span></div></div><div className="gb-footer-bottom"><span>© {new Date().getFullYear()} GangaBhog Atta</span><span>Rooted in tradition since 1980 <Heart size={12}/></span></div></footer>
    <a className="gb-whatsapp-float" href={whatsappLink} target="_blank" rel="noreferrer" aria-label="Message GangaBhog on WhatsApp"><Phone size={20}/><span>Chat with us</span></a>
  </div>;
}


