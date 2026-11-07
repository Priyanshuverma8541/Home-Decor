import { useEffect, useState } from "react";
import { ArrowRight, Check, ShoppingBag, X } from "lucide-react";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function ProductQuickView({ product, whatsappNumber, onClose }) {
  const variants = product?.variants?.length ? product.variants : [{ value: product?.size || "Available pack", priceAdjustment: 0, stock: product?.stock }];
  const [variant, setVariant] = useState(variants[0]);
  useEffect(() => { setVariant(variants[0]); }, [product?._id, product?.id]);
  useEffect(() => {
    if (!product) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", closeOnEscape); document.body.style.overflow = ""; };
  }, [product, onClose]);
  if (!product) return null;
  const price = Number(product.price || 0) + Number(variant?.priceAdjustment || 0);
  const chat = `https://wa.me/${String(whatsappNumber || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Namaste GangaBhog, please share availability for ${product.name} (${variant?.value || product.size}).`)}`;
  return <div className="gb-quickview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="gb-quickview" role="dialog" aria-modal="true" aria-labelledby="gb-quickview-title">
      <button className="gb-quickview-close" onClick={onClose} aria-label="Close product details"><X/></button>
      <div className="gb-quickview-photo"><span>{product.label || product.category || "GANGA BHOG"}</span><img src={product.pack || product.images?.[0]} alt={`${product.name} ${variant?.value || product.size || "atta pack"}`}/></div>
      <div className="gb-quickview-info"><span className="gb-quickview-eyebrow">PURE TRADITION · SINCE 1980</span><h2 id="gb-quickview-title">{product.name}</h2><p>{product.description || "Made for the everyday goodness of home-cooked meals."}</p><div className="gb-quickview-price">{product.price ? <><b>{money(price)}</b>{product.comparePrice > price&&<del>{money(product.comparePrice)}</del>}</> : <span>Price shared on enquiry</span>}</div>
        <div className="gb-quickview-options"><b>Choose your pack size</b><div>{variants.map((option)=><button type="button" key={option.value} onClick={()=>setVariant(option)} aria-pressed={variant?.value===option.value} className={variant?.value===option.value?"is-selected":""}>{option.value}{option.stock===0&&<small>Sold out</small>}</button>)}</div></div>
        <ul className="gb-quickview-details">{(product.details || product.tags || []).slice(0,4).map((detail,index)=><li key={`${detail}-${index}`}><Check size={15}/>{detail}</li>)}</ul>
        <a className="gb-quickview-cta" href={chat} target="_blank" rel="noreferrer"><ShoppingBag size={17}/>Ask about this pack <ArrowRight size={16}/></a><small className="gb-quickview-note">We’ll confirm local stock, delivery and current pricing with you.</small>
      </div>
    </section>
  </div>;
}
