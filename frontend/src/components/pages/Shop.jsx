import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ShoppingCart } from "lucide-react";
import { productAPI } from "../../services/api.js";
import { useCart } from "../../context/CartContext.jsx";
import { useCity } from "../../context/CityContext.jsx";
import { SkeletonCard, EmptyState } from "../ui/Shared.jsx";

const CATS = ["All","seashell","decor","gift","seasonal","other"];

function ProductCard({ p }) {
  const { addToCart } = useCart();
  return (
    <motion.div layout initial={{ opacity:0, scale:.97 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} className="card" style={{ overflow:"hidden", display:"flex", flexDirection:"column" }}>
      <Link to={`/product/${p._id}`} className="img-zoom" style={{ display:"block", aspectRatio:"1", textDecoration:"none", position:"relative" }}>
        <img src={p.images?.[0]||"https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=400&q=80"} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>
        {p.isSeasonal && <span style={{ position:"absolute", top:8, left:8, background:"#c96030", color:"white", fontSize:"0.65rem", fontWeight:600, padding:"2px 8px", borderRadius:20 }}>Seasonal</span>}
      </Link>
      <div style={{ padding:"0.875rem", flex:1, display:"flex", flexDirection:"column" }}>
        <p style={{ fontSize:"0.65rem", color:"#1a8e72", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:4 }}>{p.category}</p>
        <Link to={`/product/${p._id}`} style={{ textDecoration:"none", flex:1 }}>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", color:"#1c1409", lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{p.name}</h3>
        </Link>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10, paddingTop:8, borderTop:"1px solid #e8dfd0" }}>
          <div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.1rem", color:"#1c1409", fontWeight:600 }}>Rs.{p.price?.toLocaleString("en-IN")}</span>
            {p.comparePrice && <span style={{ fontSize:"0.7rem", color:"#b8a08a", textDecoration:"line-through", marginLeft:5 }}>Rs.{p.comparePrice?.toLocaleString("en-IN")}</span>}
          </div>
          <button onClick={() => addToCart(p)} disabled={p.stock===0}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"0.3rem 0.875rem", height:34, borderRadius:"9999px", fontSize:"0.75rem", fontWeight:500, background: p.stock===0?"#e8dfd0":"#1a3c34", color: p.stock===0?"#b8a08a":"white", border:"none", cursor: p.stock===0?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            <ShoppingCart style={{ width:12, height:12 }}/>{p.stock===0?"Sold Out":"Add"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [sp, setSp] = useSearchParams();
  const cat  = sp.get("category") || "All";
  const { city } = useCity();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { city };
      if (cat !== "All") params.category = cat;
      if (search.trim()) params.search   = search.trim();
      const { data } = await productAPI.getAll(params);
      setProducts(data.products || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [cat, search, city]);

  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [load]);

  const setCat = (c) => {
    const n = new URLSearchParams(sp);
    c==="All" ? n.delete("category") : n.set("category", c);
    setSp(n);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#fdf6ee" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1a3c34,#0f2419)", padding:"2.5rem 1rem 3rem" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <p className="section-tag" style={{ color:"#30ac90", marginBottom:4 }}>Delivering in {city}</p>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.75rem,5vw,3rem)", color:"white", marginBottom:"1.25rem" }}>Our Collection</h1>
          <div style={{ position:"relative", maxWidth:500 }}>
            <Search style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"rgba(255,255,255,.4)", pointerEvents:"none" }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search seashells, decor, gifts…"
              style={{ width:"100%", height:46, paddingLeft:40, paddingRight: search?40:14, borderRadius:"1rem", background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.15)", color:"white", fontSize:"16px", fontFamily:"'DM Sans',sans-serif", outline:"none" }}/>
            {search && (
              <button onClick={() => setSearch("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", width:28, height:28, borderRadius:"50%", border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X style={{ width:14, height:14, color:"rgba(255,255,255,.5)" }}/>
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 1rem" }}>
        {/* Category pills */}
        <div className="no-scrollbar" style={{ display:"flex", gap:8, overflowX:"auto", padding:"1rem 0", margin:"0 -1rem", paddingLeft:"1rem", paddingRight:"1rem" }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ flexShrink:0, padding:"0 1.25rem", height:36, borderRadius:"9999px", fontSize:"0.8rem", fontWeight:500, cursor:"pointer", border: cat===c ? "none" : "1px solid #d8cfc0", background: cat===c ? "#1a3c34" : "white", color: cat===c ? "white" : "#5c4a32", fontFamily:"'DM Sans',sans-serif" }}>
              {c==="All" ? "All" : c[0].toUpperCase()+c.slice(1)}
            </button>
          ))}
        </div>

        <p style={{ fontSize:"0.75rem", color:"#8c7258", marginBottom:"0.875rem" }}>
          {loading ? "Loading…" : `${products.length} product${products.length!==1?"s":""} in ${city}`}
        </p>

        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.875rem", paddingBottom:"5rem" }} className="shop-grid">
            {Array(8).fill(0).map((_,i) => <SkeletonCard key={i}/>)}
          </div>
        ) : products.length===0 ? (
          <EmptyState title="No products found" message={`Nothing in ${city} for this filter yet. Try a different category.`}
            action={<button onClick={() => { setSearch(""); setCat("All"); }} className="btn-primary" style={{ fontSize:"0.875rem" }}>Clear filters</button>}/>
        ) : (
          <motion.div layout style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.875rem", paddingBottom:"5rem" }} className="shop-grid">
            <AnimatePresence>{products.map(p => <ProductCard key={p._id} p={p}/>)}</AnimatePresence>
          </motion.div>
        )}
      </div>
      <style>{`
        @media(min-width:640px){.shop-grid{grid-template-columns:repeat(3,1fr)!important;gap:1.25rem!important}}
        @media(min-width:1024px){.shop-grid{grid-template-columns:repeat(4,1fr)!important}}
      `}</style>
    </div>
  );
}
