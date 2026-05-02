import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star, Truck, Shield, RotateCcw, Leaf, Instagram, MessageCircle } from "lucide-react";
import { productAPI } from "../../services/api.js";
import { useCart } from "../../context/CartContext.jsx";
import { useCity } from "../../context/CityContext.jsx";
import { SkeletonCard } from "../ui/Shared.jsx";

const IG  = import.meta.env.VITE_INSTAGRAM || "livingcrafts__";
const WA  = import.meta.env.VITE_WHATSAPP  || "6207855397";
const up  = (d=0) => ({ initial:{opacity:0,y:24}, whileInView:{opacity:1,y:0}, viewport:{once:true,margin:"-60px"}, transition:{duration:.65,delay:d} });

const CATS = [
  { slug:"seashell", label:"Seashells",   emoji:"🐚", desc:"Coastal art & natural specimens" },
  { slug:"decor",    label:"Home Decor",  emoji:"🏠", desc:"Elevate every room"              },
  { slug:"gift",     label:"Gifts",       emoji:"🎁", desc:"Curated gifting collections"     },
  { slug:"seasonal", label:"Seasonal",    emoji:"🌸", desc:"Festival & event specials"       },
];

const FEATURES = [
  { Icon:Truck,    title:"Same-city delivery",  desc:"Order by 2pm, get it today in Buxar"   },
  { Icon:Shield,   title:"Handmade quality",    desc:"Each piece made with natural materials" },
  { Icon:RotateCcw,title:"Easy returns",        desc:"7-day return, no questions asked"      },
  { Icon:Leaf,     title:"Eco-friendly",        desc:"Sustainable sourcing, always"           },
];

const REVIEWS = [
  { name:"Neha Singh",    city:"Buxar",   r:5, text:"Got a beautiful seashell frame for my living room. Delivery was same-day and packaging was lovely!" },
  { name:"Divya Sharma",  city:"Buxar",   r:5, text:"Ordered a gift hamper for my mom's birthday. She absolutely loved it. Will order again for sure." },
  { name:"Ritu Agarwal",  city:"Varanasi",r:5, text:"The home decor pieces are so unique. Finally something different from what you find in regular shops." },
];

function ProductCard({ p }) {
  const { addToCart } = useCart();
  return (
    <div className="card" style={{ overflow:"hidden", display:"flex", flexDirection:"column" }}>
      <Link to={`/product/${p._id}`} className="img-zoom" style={{ display:"block", aspectRatio:"1", textDecoration:"none" }}>
        <img src={p.images?.[0]||"https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=400&q=80"} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>
        {p.isSeasonal && <span style={{ position:"absolute", top:8, left:8, background:"#c96030", color:"white", fontSize:"0.65rem", fontWeight:600, padding:"2px 8px", borderRadius:20 }}>Seasonal</span>}
        {p.comparePrice && p.comparePrice > p.price && <span style={{ position:"absolute", top:8, right:8, background:"#1a3c34", color:"white", fontSize:"0.65rem", fontWeight:600, padding:"2px 8px", borderRadius:20 }}>Sale</span>}
      </Link>
      <div style={{ padding:"0.875rem", flex:1, display:"flex", flexDirection:"column", position:"relative" }}>
        <p style={{ fontSize:"0.65rem", color:"#1a8e72", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:4 }}>{p.category}</p>
        <Link to={`/product/${p._id}`} style={{ textDecoration:"none" }}>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", color:"#1c1409", lineHeight:1.2, marginBottom:8, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{p.name}</h3>
        </Link>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"auto", paddingTop:8, borderTop:"1px solid #e8dfd0" }}>
          <div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.1rem", color:"#1c1409", fontWeight:600 }}>Rs.{p.price?.toLocaleString("en-IN")}</span>
            {p.comparePrice && <span style={{ fontSize:"0.75rem", color:"#b8a08a", textDecoration:"line-through", marginLeft:6 }}>Rs.{p.comparePrice?.toLocaleString("en-IN")}</span>}
          </div>
          <button onClick={() => addToCart(p)} disabled={p.stock===0}
            style={{ width:34, height:34, borderRadius:"50%", background: p.stock===0?"#e8dfd0":"#1a3c34", color:"white", border:"none", cursor: p.stock===0?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
            {p.stock===0?"✕":"+"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const { city } = useCity();

  useEffect(() => {
    productAPI.getAll({ featured:"true", city, limit:8 })
      .then(({ data }) => setFeatured(data.products||[]))
      .finally(() => setLoading(false));
  }, [city]);

  return (
    <div style={{ overflowX:"hidden" }}>

      {/* ── HERO ───────────────────────────────────────── */}
      <section style={{ position:"relative", minHeight:"100svh", background:"#0f2419", display:"flex", alignItems:"center", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"url('https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=1400&q=80') center/cover no-repeat", opacity:0.18 }}/>
        <div style={{ position:"absolute", top:"-5rem", right:"-5rem", width:"30rem", height:"30rem", background:"rgba(48,172,144,.08)", borderRadius:"50%", filter:"blur(80px)", pointerEvents:"none" }}/>
        <div style={{ position:"relative", maxWidth:1280, margin:"0 auto", padding:"6rem 1rem" }}>
          <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ duration:.7 }}
            style={{ display:"flex", alignItems:"center", gap:12, marginBottom:"1.5rem" }}>
            <div style={{ height:1, width:40, background:"#30ac90" }}/>
            <span style={{ color:"#30ac90", fontFamily:"'DM Sans',monospace", fontSize:"0.7rem", letterSpacing:"0.2em", textTransform:"uppercase" }}>Handcrafted · Natural · Delivered</span>
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:.8, delay:.1 }}
            style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(2.5rem,8vw,5.5rem)", color:"white", lineHeight:1.05, marginBottom:"1.25rem" }}>
            Bring the<br/><em style={{ color:"#30ac90", fontStyle:"italic" }}>ocean home</em>
          </motion.h1>

          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:.8, delay:.2 }}
            style={{ color:"rgba(255,255,255,.55)", fontSize:"1rem", lineHeight:1.8, maxWidth:420, marginBottom:"2rem" }}>
            Seashell home decor, handcrafted gifts and seasonal collections — now available with fast local delivery in {city}.
          </motion.p>

          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7, delay:.3 }}
            style={{ display:"flex", flexWrap:"wrap", gap:"0.75rem" }}>
            <Link to="/shop" className="btn-terra">Explore Collection <ArrowRight style={{ width:16, height:16 }}/></Link>
            <a href={`https://wa.me/91${WA}?text=Hi! I'd like to know more about Savitri Livings products.`} target="_blank" rel="noopener noreferrer"
              className="btn-wa" style={{ fontSize:"0.875rem" }}>
              <MessageCircle style={{ width:16, height:16 }}/>Order on WhatsApp
            </a>
          </motion.div>

          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:.8, delay:.45 }}
            style={{ display:"flex", alignItems:"center", gap:"2.5rem", marginTop:"3rem", paddingTop:"2rem", borderTop:"1px solid rgba(255,255,255,.08)" }}>
            {[["100%","Natural"],["Fast","Local Delivery"],["Unique","Handcrafted"]].map(([n,l]) => (
              <div key={l}><p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.5rem", color:"#30ac90" }}>{n}</p><p style={{ fontSize:"0.7rem", color:"rgba(255,255,255,.35)", marginTop:2 }}>{l}</p></div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES STRIP ─────────────────────────────── */}
      <div style={{ background:"linear-gradient(135deg,#2a5c4e,#1a3c34)", padding:"1.25rem 1rem" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"1rem" }} className="feats-grid">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon style={{ width:16, height:16, color:"#30ac90" }}/>
              </div>
              <div>
                <p style={{ fontSize:"0.8rem", fontWeight:500, color:"white" }}>{title}</p>
                <p style={{ fontSize:"0.7rem", color:"rgba(255,255,255,.5)", marginTop:1 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ─────────────────────────────────── */}
      <section style={{ padding:"3.5rem 1rem", background:var_cream }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"2rem" }}>
            <p className="section-tag">Collections</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.75rem,4vw,2.5rem)", color:"#1c1409" }}>Shop by Category</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.875rem" }} className="cats-grid">
            {CATS.map(({ slug, label, emoji, desc }, i) => (
              <motion.div key={slug} {...up(i*.1)}>
                <Link to={`/shop?category=${slug}`} style={{ display:"block", textDecoration:"none" }}>
                  <div style={{ borderRadius:"1rem", overflow:"hidden", background:"#1a3c34", padding:"1.5rem 1.25rem", minHeight:120, position:"relative", transition:"transform .3s, box-shadow .3s", cursor:"pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(26,60,52,.25)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
                    <div style={{ position:"absolute", inset:0, background:"url('https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=400&q=60') center/cover no-repeat", opacity:.1 }}/>
                    <div style={{ position:"relative" }}>
                      <span style={{ fontSize:28, display:"block", marginBottom:8 }}>{emoji}</span>
                      <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", color:"white", marginBottom:4 }}>{label}</h3>
                      <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,.5)" }}>{desc}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:12, color:"#30ac90", fontSize:"0.75rem", fontWeight:500 }}>
                        Shop now <ArrowRight style={{ width:12, height:12 }}/>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ──────────────────────────── */}
      <section style={{ padding:"3.5rem 1rem", background:"#f5ede0" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"2rem", flexWrap:"wrap", gap:"0.75rem" }}>
            <div>
              <p className="section-tag">Hand-picked</p>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.75rem,4vw,2.5rem)", color:"#1c1409" }}>Featured Products</h2>
            </div>
            <Link to="/shop" style={{ display:"flex", alignItems:"center", gap:6, color:"#1a3c34", fontSize:"0.875rem", fontWeight:500, textDecoration:"none" }}>
              View all <ArrowRight style={{ width:14, height:14 }}/>
            </Link>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.875rem" }} className="prod-grid">
            {loading
              ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i}/>)
              : featured.length
                ? featured.map(p => <ProductCard key={p._id} p={p}/>)
                : <p style={{ gridColumn:"span 2", textAlign:"center", color:"#8c7258", padding:"3rem" }}>No featured products yet. <Link to="/shop" style={{ color:"#1a3c34" }}>Browse all</Link></p>
            }
          </div>
        </div>
      </section>

      {/* ── INSTAGRAM STRIP ────────────────────────────── */}
      <section style={{ padding:"3rem 1rem", background:"#1a3c34" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", textAlign:"center" }}>
          <motion.div {...up(0)}>
            <Instagram style={{ width:28, height:28, color:"#30ac90", margin:"0 auto 0.75rem" }}/>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.75rem,4vw,2.25rem)", color:"white", marginBottom:"0.5rem" }}>Follow our journey</h2>
            <p style={{ color:"rgba(255,255,255,.5)", marginBottom:"1.5rem", fontSize:"0.9rem" }}>Behind the craft, seasonal drops, and new arrivals</p>
            <a href={`https://instagram.com/${IG}`} target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"0 1.75rem", minHeight:46, borderRadius:"9999px", border:"2px solid #30ac90", color:"#30ac90", fontSize:"0.875rem", fontWeight:500, textDecoration:"none", transition:"all .2s" }}
              onMouseEnter={e=>{e.target.style.background="#30ac90";e.target.style.color="white";}}
              onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color="#30ac90";}}>
              <Instagram style={{ width:16, height:16 }}/>@{IG}
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── REVIEWS ────────────────────────────────────── */}
      <section style={{ padding:"3.5rem 1rem", background:"#fdf6ee" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"2rem" }}>
            <p className="section-tag">Reviews</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.75rem,4vw,2.5rem)", color:"#1c1409" }}>What customers say</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"1rem" }} className="rev-grid">
            {REVIEWS.map(({ name, city, r, text }, i) => (
              <motion.div key={name} {...up(i*.1)} className="card" style={{ padding:"1.5rem" }}>
                <div style={{ display:"flex", gap:3, marginBottom:"0.75rem" }}>
                  {Array(r).fill(0).map((_,j) => <Star key={j} style={{ width:13, height:13, fill:"#c96030", color:"#c96030" }}/>)}
                </div>
                <p style={{ fontSize:"0.875rem", color:"#5c4a32", lineHeight:1.75, marginBottom:"1rem" }}>"{text}"</p>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#30ac90,#1a3c34)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:12, fontWeight:700, flexShrink:0 }}>{name[0]}</span>
                  <div>
                    <p style={{ fontSize:"0.875rem", fontWeight:500, color:"#1c1409" }}>{name}</p>
                    <p style={{ fontSize:"0.7rem", color:"#8c7258" }}>{city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────── */}
      <section style={{ background:"#0f2419", padding:"4rem 1rem", textAlign:"center" }}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <motion.p {...up(0)} className="section-tag" style={{ color:"#30ac90" }}>Start today</motion.p>
          <motion.h2 {...up(.1)} style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(2rem,6vw,3rem)", color:"white", marginBottom:"1rem" }}>Your home deserves something beautiful</motion.h2>
          <motion.p {...up(.2)} style={{ color:"rgba(255,255,255,.45)", marginBottom:"2rem", fontSize:"0.95rem" }}>Seashell decor, gift hampers and seasonal specials — all made by hand.</motion.p>
          <motion.div {...up(.3)} style={{ display:"flex", gap:"0.875rem", justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/shop" className="btn-terra">Shop the Collection</Link>
            <a href={`https://wa.me/91${WA}?text=Hi Savitri Livings! I want to place an order.`} target="_blank" rel="noopener noreferrer" className="btn-wa">
              <MessageCircle style={{ width:15, height:15 }}/>Chat on WhatsApp
            </a>
          </motion.div>
        </div>
      </section>

      <style>{`
        :root { --cream: #fdf6ee; }
        @media(min-width:640px){
          .feats-grid{grid-template-columns:repeat(4,1fr)!important}
          .cats-grid{grid-template-columns:repeat(4,1fr)!important}
          .prod-grid{grid-template-columns:repeat(3,1fr)!important;gap:1.25rem!important}
          .rev-grid{grid-template-columns:repeat(3,1fr)!important}
        }
        @media(min-width:1024px){.prod-grid{grid-template-columns:repeat(4,1fr)!important}}
      `}</style>
    </div>
  );
}

// Helper for inline CSS var
const var_cream = "#fdf6ee";
