import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const fallbackSlides = [
  { id: "chakki5", name: "GangaBhog Chakki Fresh Atta", size: "5 kg family pack", image: "/gangabhog/products/ganga-bhog-5kg.jpg", tone: "gold" },
  { id: "chakki10", name: "Chakki Fresh Atta", size: "10 kg pack", image: "/gangabhog/products/chakki-fresh-10kg.jpeg", tone: "green" },
  { id: "atta26", name: "GangaBhog Atta", size: "26 kg family pack", image: "/gangabhog/products/ganga-bhog-26kg.jpeg", tone: "red" },
  { id: "premium10", name: "Premium Chakki Fresh Atta", size: "10 kg pack", image: "/gangabhog/products/premium-chakki-10kg.jpeg", tone: "cream" },
];

function weightText(product) {
  return [product.size, product.name, ...(product.variants || []).map((variant) => variant.value)].filter(Boolean).join(" ").toLowerCase();
}

export default function HeroCarousel({ products = [] }) {
  const track = useRef(null);
  const [active, setActive] = useState(0);
  const slides = products.length ? products.map((product, index) => ({
    ...product,
    image: product.pack || product.images?.[0] || fallbackSlides[index % fallbackSlides.length].image,
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

  return <section className="gb-hero gb-carousel" aria-label="GangaBhog product advertisement">
    <div className="gb-carousel-track" ref={track} onScroll={onScroll}>
      {slides.map((product, index) => <article className={`gb-carousel-slide gb-carousel-${product.tone || "gold"}`} key={product._id || product.id || product.name} aria-label={`Product ${index + 1} of ${slides.length}`}>
        <div className="gb-carousel-scene" aria-hidden="true"><span className="gb-carousel-sun"/><span className="gb-carousel-horizon"/><span className="gb-carousel-field gb-carousel-field-one"/><span className="gb-carousel-field gb-carousel-field-two"/></div>
        <div className="gb-carousel-product"><span className="gb-product-orbit gb-product-orbit-one"/><span className="gb-product-orbit gb-product-orbit-two"/><img src={product.image} alt={`${product.name} ${product.size || "atta pack"}`} loading={index ? "lazy" : "eager"}/></div>
      </article>)}
    </div>
    <div className="gb-carousel-controls"><div className="gb-carousel-dots" role="tablist" aria-label="Choose a product image">{slides.map((product, index) => <button type="button" role="tab" key={product._id || product.id || index} aria-label={`Show product ${index + 1}`} aria-selected={active === index} className={active === index ? "is-active" : ""} onClick={() => move(index)}/>)}</div><div className="gb-carousel-arrows"><button type="button" onClick={() => move(active - 1)} aria-label="Previous product"><ChevronLeft/></button><button type="button" onClick={() => move(active + 1)} aria-label="Next product"><ChevronRight/></button></div></div>
  </section>;
}
