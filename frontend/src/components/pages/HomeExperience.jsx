import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ExternalLink, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { productAPI } from "../../services/api.js";
import { useCart } from "../../context/CartContext.jsx";
import { getProductImage } from "../../utils/productImage.js";

const fallback = "/brand/savitri-jewellers-earrings.png";
const journey = [
  { label: "SHOP", to: "/shop" },
  { label: "THIKANA", to: "/marketplace" },
  { label: "BUILDHUB", href: "https://build-hub-lake.vercel.app/" },
  { label: "SL BUSINESS", to: "/ecosystem" },
  { label: "PV PLATFORM" },
];

function Heading({ title, to, label }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
    <h2 style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", color: "#283c32" }}>{title}</h2>
    {to && <Link to={to} style={{ display: "inline-flex", gap: 5, alignItems: "center", color: "#80602f", fontSize: ".85rem", fontWeight: 700 }}>{label}<ArrowRight size={16} /></Link>}
  </div>;
}

function Product({ product }) {
  const { addToCart } = useCart();
  const purchaseMode = product.purchaseMode || (product.meeshoEnabled ? "meesho" : "direct");
  const hasMeesho = !!product.meeshoEnabled && !!product.meeshoUrl && ["meesho", "both"].includes(purchaseMode);
  return <article style={{ background: "white", border: "1px solid #e8e2d4", borderRadius: 10, overflow: "hidden", minWidth: 0 }}>
    <Link to={`/product/${product._id}`} style={{ display: "block", aspectRatio: "1", background: "#f1eee5", padding: 8 }}><img src={getProductImage(product)} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} /></Link>
    <div style={{ padding: ".8rem" }}>
      <p style={{ fontSize: ".64rem", color: "#8a6b37", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>{product.category || "Savitri find"}</p>
      <Link to={`/product/${product._id}`}><h3 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: ".88rem", lineHeight: 1.4, minHeight: "2.45em", margin: ".3rem 0", color: "#283c32", overflow: "hidden" }}>{product.name}</h3></Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <b style={{ color: "#4e5f45" }}>₹{Number(product.price || 0).toLocaleString("en-IN")}</b>
        {purchaseMode !== "meesho" && <button onClick={() => addToCart(product)} disabled={product.stock === 0} aria-label="Add to cart" style={{ width: 34, height: 34, border: 0, borderRadius: 8, display: "grid", placeItems: "center", background: "#344b3d", color: "white", cursor: "pointer" }}><ShoppingBag size={15} /></button>}
      </div>
      {hasMeesho && <a href={product.meeshoUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, padding: ".55rem .7rem", borderRadius: 6, background: "#f0eee5", color: "#66532e", fontSize: ".75rem", fontWeight: 700 }}><ExternalLink size={14} />{product.meeshoButtonText || "Buy on Meesho"}</a>}
    </div>
  </article>;
}

export default function HomeExperience() {
  const reduceMotion = useReducedMotion();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();
  const photoY = useTransform(scrollYProgress, [0.15, 0.65], reduceMotion ? [0, 0] : [36, -36]);
  const photoRotateX = useTransform(scrollYProgress, [0.15, 0.65], reduceMotion ? [0, 0] : [7, -3]);

  useEffect(() => {
    let mounted = true;
    productAPI.getAll({ limit: 8 })
      .then((productResult) => {
        if (!mounted) return;
        setProducts(productResult.data.products || []);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const picks = useMemo(() => products.slice(0, 4), [products]);

  return <main className="home-page">
    <section className="home-hero-shell">
      <motion.div className="home-hero" initial={reduceMotion ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
        <p className="home-brandline">Savitri Living <span>— Lifestyle · Living · More</span></p>
        <h1>For the life you're living.<br /><em>For the life you're building.</em></h1>
        <Link to="/shop" className="home-primary">Shop the collection <ArrowRight size={16} /></Link>
      </motion.div>
    </section>

    <section className="home-products">
      <Heading title="The collection" to="/shop" label="View all" />
      {loading ? <p className="home-status">Loading the collection…</p> : picks.length ? <div className="home-product-grid">{picks.map(product => <Product key={product._id} product={product} />)}</div> : <p className="home-status">New pieces are on their way.</p>}
    </section>

    <section className="home-photo-section" aria-label="Savitri Living">
      <motion.div className="home-photo-frame" style={{ y: photoY, rotateX: photoRotateX, transformPerspective: 1400 }}>
        <img src="/brand/home.png" alt="A glimpse into the Savitri Living world" loading="lazy" />
      </motion.div>
    </section>

    <section className="home-journey" aria-label="Explore Savitri Living">
      <div className="home-journey-track">
        {journey.map((step, index) => <div className="home-journey-unit" key={step.label}>
          <motion.div className="home-journey-card" initial={reduceMotion ? false : { opacity: 0, y: 28, rotateY: -12 }} whileInView={{ opacity: 1, y: 0, rotateY: 0 }} viewport={{ once: true, amount: .45 }} transition={{ duration: .55, delay: index * .08 }} whileHover={reduceMotion ? {} : { y: -5, rotateX: -3 }}>
            {step.to ? <Link to={step.to}>{step.label}</Link> : step.href ? <a href={step.href} target="_blank" rel="noopener noreferrer">{step.label}<ExternalLink size={12} /></a> : <span>{step.label}</span>}
          </motion.div>
          {index < journey.length - 1 && <ArrowRight className="home-journey-arrow" size={18} aria-hidden="true" />}
        </div>)}
      </div>
    </section>

    <style>{`
      .home-page{background:#fbfaf5;overflow:hidden;color:#283c32}
      .home-hero-shell{padding:clamp(2.75rem,6vw,5rem) 1.25rem;background:#f0efe5}
      .home-hero{max-width:1200px;min-height:300px;margin:0 auto;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:1.15rem}
      .home-brandline{display:flex;flex-wrap:wrap;gap:10px;align-items:center;color:#394b3c;font-size:.78rem;font-weight:700;text-transform:uppercase}.home-brandline span{color:#84734f;font-size:.7rem;font-weight:500}
      .home-hero h1{max-width:1000px;color:#283c32;font-size:clamp(2.8rem,6vw,5.3rem);line-height:1.03}.home-hero h1 em{color:#8b7049;font-weight:500}
      .home-primary{min-height:46px;padding:0 18px;display:inline-flex;align-items:center;justify-content:center;gap:9px;border-radius:5px;background:#344b3d;color:#fff;font-size:.82rem;font-weight:600}
      .home-products{max-width:1200px;margin:0 auto;padding:2.6rem 1.25rem 4rem}.home-products h2{font-size:clamp(1.8rem,3.6vw,2.5rem)}.home-product-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.home-status{padding:1rem 0;color:#786c56}
      .home-photo-section{perspective:1400px;overflow:hidden;background:#d8d4c8}.home-photo-frame{width:min(100%,1440px);height:clamp(360px,60vw,720px);margin:0 auto;overflow:hidden;transform-style:preserve-3d;will-change:transform}.home-photo-frame img{width:100%;height:100%;display:block;object-fit:cover;object-position:center 48%;transform:translateZ(28px)}
      .home-journey{padding:clamp(3rem,7vw,5.5rem) 1.25rem;background:#f0efe5;perspective:1200px}.home-journey-track{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px}.home-journey-unit{display:flex;align-items:center;justify-content:center;gap:10px;min-width:0;flex:1}.home-journey-card{width:100%;min-height:76px;display:grid;place-items:center;padding:12px;background:#fbfaf5;border:1px solid #d9d5c8;box-shadow:0 10px 26px rgba(40,60,50,.07);transform-style:preserve-3d}.home-journey-card a,.home-journey-card span{display:inline-flex;align-items:center;gap:7px;color:#344b3d;font-size:.76rem;font-weight:700;letter-spacing:.08em;text-align:center}.home-journey-card a:hover{color:#977446}.home-journey-arrow{flex:0 0 auto;color:#a28b60}
      @media(max-width:900px){.home-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.home-journey-track{flex-wrap:wrap;justify-content:center;gap:12px}.home-journey-unit{flex:0 1 calc(33.333% - 12px)}}
      @media(max-width:560px){.home-hero{min-height:260px;gap:1rem}.home-hero h1{font-size:clamp(2.5rem,10vw,3.7rem)}.home-brandline{display:block;line-height:1.8}.home-brandline span{display:block}.home-products{padding:2.2rem 1rem 3rem}.home-photo-frame{height:66vw;min-height:340px;max-height:520px}.home-journey-track{display:grid;grid-template-columns:1fr 1fr;gap:12px}.home-journey-unit{width:100%;flex-direction:column}.home-journey-unit:last-child{grid-column:1/-1;width:calc(50% - 6px);justify-self:center}.home-journey-arrow{transform:rotate(90deg)}.home-journey-card{min-height:68px}}
      @media(prefers-reduced-motion:reduce){.home-photo-frame{will-change:auto}}
    `}</style>
  </main>;
}