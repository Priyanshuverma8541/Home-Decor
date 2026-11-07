import { useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Wheat } from "lucide-react";

const fallbackSlides = [
  { name: "GangaBhog Chakki Fresh Atta", size: "5 kg family pack", image: "/gangabhog/products/ganga-bhog-5kg.jpg", label: "A LITTLE TASTE OF HOME", tone: "gold" },
  { name: "Chakki Fresh Atta", size: "10 kg pack", image: "/gangabhog/products/chakki-fresh-10kg.jpeg", label: "FRESH FROM BIHAR", tone: "green" },
  { name: "GangaBhog Atta", size: "26 kg family pack", image: "/gangabhog/products/ganga-bhog-26kg.jpeg", label: "MADE FOR THE WHOLE FAMILY", tone: "red" },
  { name: "Premium Chakki Fresh Atta", size: "10 kg pack", image: "/gangabhog/products/premium-chakki-10kg.jpeg", label: "PURE TRADITION · SINCE 1980", tone: "cream" },
];

function weightText(product) {
  return [product.size, product.name, ...(product.variants || []).map((variant) => variant.value)].filter(Boolean).join(" ").toLowerCase();
}

export default function HeroCarousel({ products = [], website }) {
  const track = useRef(null);
  const [active, setActive] = useState(0);
  const slides = products.length ? products.map((product, index) => ({
    ...fallbackSlides.find((item) => weightText(product).includes(item.size.split(" ")[0])),
    ...product,
    image: product.pack || product.images?.[0] || fallbackSlides[index % fallbackSlides.length].image,
    size: product.size || product.variants?.map((variant) => variant.value).join(" / ") || fallbackSlides[index % fallbackSlides.length].size,
    label: product.isFeatured ? "FAMILY FAVOURITE" : (product.category || "GANGA BHOG ATTA").toUpperCase(),
    tone: fallbackSlides[index % fallbackSlides.length].tone,
  })) : fallbackSlides;
  if (products.length && !products.some((product) => /\b5\s?kg\b/.test(weightText(product)))) slides.unshift(fallbackSlides[0]);
  const move = (index) => {
    const next = (index + slides.length) % slides.length;
    setActive(next);
    track.current?.children[next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };
  const onScroll = () => {
    if (!track.current) return;
    const width = track.current.clientWidth;
    if (width) setActive(Math.min(slides.length - 1, Math.round(track.current.scrollLeft / width)));
  };
  return <section className="gb-hero gb-carousel" aria-label="GangaBhog product collection">
    <div className="gb-carousel-track" ref={track} onScroll={onScroll}>
      {slides.map((product, index) => <article className={`gb-carousel-slide gb-carousel-${product.tone || "gold"}`} key={product._id || product.id || `${product.name}-${index}`}>
        <div className="gb-carousel-scene" aria-hidden="true"><span className="gb-carousel-sun"/><span className="gb-carousel-horizon"/><span className="gb-carousel-field gb-carousel-field-one"/><span className="gb-carousel-field gb-carousel-field-two"/><span className="gb-carousel-wheat"><Wheat/></span></div>
        <div className="gb-carousel-copy"><span className="gb-carousel-kicker"><i/>{website?.heroEyebrow || product.label || "FROM BUXAR, WITH PRIDE"}</span><p className="gb-carousel-brand">GangaBhog</p><h1>{website?.heroTitle || <>Shuddh atta.<br/><em>Swasth parivaar.</em></>}</h1><p className="gb-carousel-description">{website?.heroDescription || "The goodness of Bihar wheat, made for the little rituals and big moments around your family table."}</p><span className="gb-carousel-size"><Wheat size={15}/>{product.size}</span><a href="#products" className="gb-carousel-cta">Explore the range <ArrowRight size={16}/></a><span className="gb-carousel-note">PURE TRADITION <i/> PREMIUM NUTRITION <i/> SINCE 1980</span></div>
        <div className="gb-carousel-product"><span className="gb-product-orbit gb-product-orbit-one"/><span className="gb-product-orbit gb-product-orbit-two"/><span className="gb-carousel-product-label">{product.label || "GANGA BHOG ATTA"}</span><img src={product.image} alt={`${product.name} ${product.size}`} loading={index ? "lazy" : "eager"}/><span className="gb-carousel-product-name">{product.name}</span></div>
        <span className="gb-carousel-counter">0{index + 1}<i/>0{slides.length}</span>
      </article>)}
    </div>
    <div className="gb-carousel-controls"><div className="gb-carousel-dots" role="tablist" aria-label="Choose a featured product">{slides.map((product,index)=><button type="button" key={product._id || product.id || index} aria-label={`Show ${product.name}`} aria-selected={active===index} className={active===index?"is-active":""} onClick={()=>move(index)}/>)}</div><div className="gb-carousel-arrows"><button type="button" onClick={()=>move(active-1)} aria-label="Previous product"><ChevronLeft/></button><button type="button" onClick={()=>move(active+1)} aria-label="Next product"><ChevronRight/></button></div><span className="gb-carousel-swipe">SWIPE TO EXPLORE <i/></span></div>
  </section>;
}
