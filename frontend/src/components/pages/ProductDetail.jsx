import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, MessageCircle, Minus, Plus, Share2, Truck, Leaf, RotateCcw } from "lucide-react";
import { productAPI } from "../../services/api.js";
import { useCart } from "../../context/CartContext.jsx";
import { useCity } from "../../context/CityContext.jsx";
import { PageLoader } from "../ui/Shared.jsx";
import toast from "react-hot-toast";

const WA = import.meta.env.VITE_WHATSAPP || "6207855397";

export default function ProductDetail() {
  const { id } = useParams();
  const [product,    setProduct]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [qty,        setQty]        = useState(1);
  const [activeImg,  setActiveImg]  = useState(0);
  const { addToCart } = useCart();
  const { city } = useCity();

  useEffect(() => {
    productAPI.getOne(id)
      .then(({ data }) => setProduct(data.product))
      .catch(() => toast.error("Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader/>;
  if (!product) return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
      <p style={{ color:"#8c7258", marginBottom:"1rem" }}>Product not found.</p>
      <Link to="/shop" className="btn-primary">Back to Shop</Link>
    </div>
  );

  const images = product.images?.length ? product.images : ["https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=800&q=80"];
  const waMsg  = product.whatsappOrderMsg?.replace("{productName}", product.name).replace("{qty}", qty)
    || `Hi! I want to order: ${product.name} x${qty}. My city: ${city}. Please confirm.`;

  const handleAddToCart = () => { for (let i=0; i<qty; i++) addToCart(product, i===0 ? qty : 0); };
  // above is wrong — fix:
  const handleAdd = () => { addToCart({ ...product, quantity: qty }, qty); };

  return (
    <div style={{ minHeight:"100vh", background:"#fdf6ee", padding:"1.5rem 1rem" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        {/* Breadcrumb */}
        <nav style={{ display:"flex", alignItems:"center", gap:8, fontSize:"0.8rem", color:"#8c7258", marginBottom:"1.25rem", flexWrap:"wrap" }}>
          <Link to="/shop" style={{ display:"flex", alignItems:"center", gap:4, color:"#8c7258", textDecoration:"none" }}>
            <ArrowLeft style={{ width:14, height:14 }}/>Shop
          </Link>
          <span>/</span>
          <span style={{ textTransform:"capitalize" }}>{product.category}</span>
          <span>/</span>
          <span style={{ color:"#1c1409", fontWeight:500 }}>{product.name}</span>
        </nav>

        <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"2rem" }} className="pd-grid">
          {/* Image gallery */}
          <div>
            <motion.div key={activeImg} initial={{ opacity:0 }} animate={{ opacity:1 }} className="img-zoom"
              style={{ borderRadius:"1.25rem", overflow:"hidden", aspectRatio:"1", boxShadow:"0 8px 32px rgba(26,20,9,.1)", marginBottom:"0.75rem" }}>
              <img src={images[activeImg]} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            </motion.div>
            {images.length > 1 && (
              <div className="no-scrollbar" style={{ display:"flex", gap:8, overflowX:"auto" }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    style={{ width:64, height:64, borderRadius:10, overflow:"hidden", border:`2px solid ${activeImg===i?"#1a3c34":"transparent"}`, cursor:"pointer", flexShrink:0, padding:0 }}>
                    <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="section-tag" style={{ textTransform:"capitalize" }}>{product.category}</p>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.75rem,4vw,2.25rem)", color:"#1c1409", marginBottom:"0.75rem" }}>{product.name}</h1>

            <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:"0.875rem" }}>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2rem", color:"#1c1409" }}>Rs.{product.price?.toLocaleString("en-IN")}</span>
              {product.comparePrice && <span style={{ fontSize:"1rem", color:"#b8a08a", textDecoration:"line-through" }}>Rs.{product.comparePrice?.toLocaleString("en-IN")}</span>}
            </div>

            {product.stock > 0
              ? <span className="badge badge-green" style={{ marginBottom:"1rem", display:"inline-flex", gap:5 }}><span style={{ width:6, height:6, borderRadius:"50%", background:"#059669", display:"inline-block" }}/>In Stock</span>
              : <span className="badge badge-red"   style={{ marginBottom:"1rem", display:"inline-flex" }}>Out of Stock</span>}

            <div className="divider"/>

            {product.description && (
              <p style={{ color:"#5c4a32", lineHeight:1.8, marginBottom:"1.25rem", fontSize:"0.9rem" }}>{product.description}</p>
            )}

            {/* Meta tags */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"1.25rem" }}>
              {product.material     && <span className="badge badge-teal">Material: {product.material}</span>}
              {product.dimensions   && <span className="badge badge-sand">Size: {product.dimensions}</span>}
              {product.availableCities?.map(c => <span key={c} className="badge badge-gray">{c}</span>)}
            </div>

            {/* Quantity */}
            <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.25rem" }}>
              <span style={{ fontSize:"0.875rem", fontWeight:500, color:"#3a2c1a" }}>Quantity</span>
              <div style={{ display:"flex", alignItems:"center", gap:12, border:"1px solid #d8cfc0", borderRadius:"9999px", padding:"0.375rem 1rem" }}>
                <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", border:"none", background:"transparent" }}>
                  <Minus style={{ width:14, height:14, color:"#5c4a32" }}/>
                </button>
                <span style={{ minWidth:24, textAlign:"center", fontWeight:500, fontSize:"0.875rem" }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q+1))} style={{ width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", border:"none", background:"transparent" }}>
                  <Plus style={{ width:14, height:14, color:"#5c4a32" }}/>
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:"1.25rem" }}>
              <button onClick={() => addToCart(product, qty)} disabled={product.stock===0}
                className="btn-outline" style={{ flex:1, minWidth:140, justifyContent:"center" }}>
                <ShoppingCart style={{ width:15, height:15 }}/>Add to Cart
              </button>
              <a href={`https://wa.me/91${WA}?text=${encodeURIComponent(waMsg)}`}
                target="_blank" rel="noopener noreferrer"
                className="btn-wa" style={{ flex:1, minWidth:140, justifyContent:"center" }}>
                <MessageCircle style={{ width:15, height:15 }}/>Order on WhatsApp
              </a>
            </div>

            {/* Trust badges */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.5rem" }}>
              {[{ Icon:Truck, l:"Local Delivery" }, { Icon:Leaf, l:"Natural Material" }, { Icon:RotateCcw, l:"7-Day Return" }].map(({ Icon, l }) => (
                <div key={l} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, padding:"0.75rem 0.5rem", background:"#f0e6d0", borderRadius:"0.75rem", textAlign:"center" }}>
                  <Icon style={{ width:17, height:17, color:"#1a3c34" }}/>
                  <span style={{ fontSize:"0.65rem", color:"#5c4a32", fontWeight:500, lineHeight:1.3 }}>{l}</span>
                </div>
              ))}
            </div>

            {product.instagramPostUrl && (
              <a href={product.instagramPostUrl} target="_blank" rel="noopener noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:"1rem", fontSize:"0.8rem", color:"#1a3c34", textDecoration:"none" }}>
                <Share2 style={{ width:13, height:13 }}/>View on Instagram
              </a>
            )}
          </div>
        </div>
      </div>
      <style>{`@media(min-width:768px){.pd-grid{grid-template-columns:1fr 1fr!important}}`}</style>
    </div>
  );
}
