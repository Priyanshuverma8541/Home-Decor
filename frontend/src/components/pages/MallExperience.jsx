import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUpRight, Gem, Search, ShoppingBag, X } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { productAPI } from "../../services/api.js";
import { useCart } from "../../context/CartContext.jsx";
import { getProductImage } from "../../utils/productImage.js";
const MallShowroom = lazy(() => import("../ui/MallShowroom.jsx"));

const journeyStops = ["Arrival", "The showroom", "Jewellery collections", "Explore the floor", "Continue shopping"];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function ProductCard({ product, onPick }) {
  return <button className="mall-product-card" type="button" onClick={() => onPick(product)}>
    <img src={getProductImage(product)} alt={product.name} loading="lazy" />
    <span className="mall-card-category">{product.category || "Savitri collection"}</span>
    <strong>{product.name}</strong>
    <span className="mall-card-price">₹{Number(product.price || 0).toLocaleString("en-IN")}</span>
  </button>;
}

export default function MallExperience() {
  const sectionRef = useRef(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const reduceMotion = useReducedMotion();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [progress, setProgress] = useState(0);
  const [manualProgress, setManualProgress] = useState(0);
  const [canUse3d, setCanUse3d] = useState(false);
  const [show3d, setShow3d] = useState(false);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  const loadProducts = useCallback(() => {
    setLoading(true); setLoadError("");
    productAPI.getAll({ limit: 16 })
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => setLoadError("We couldn’t load the live collection. You can retry or browse the Shop page."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => {
    if (!selected) return undefined;
    const previous = document.body.style.overflow;
    const onKeyDown = (event) => { if (event.key === "Escape") setSelected(null); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); };
  }, [selected]);
  useEffect(() => {
    let timer;
    let idleId;
    try {
      const canvas = document.createElement("canvas");
      const webgl = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
      const lowMemory = Number(navigator.deviceMemory || 4) <= 2 || Number(navigator.hardwareConcurrency || 4) <= 2 || navigator.connection?.saveData;
      setCanUse3d(webgl && !lowMemory);
      if (webgl && !lowMemory) {
        const load = () => setShow3d(true);
        if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(load, { timeout: 1400 });
        else timer = window.setTimeout(load, 500);
      }
    } catch { setCanUse3d(false); }
    return () => { if (timer) window.clearTimeout(timer); if (idleId) window.cancelIdleCallback?.(idleId); };
  }, []);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const section = sectionRef.current;
        if (!section || reduceMotion) return;
        const start = section.getBoundingClientRect().top + window.scrollY - 116;
        const travel = Math.max(1, section.offsetHeight - window.innerHeight);
        setProgress(clamp((window.scrollY - start) / travel, 0, 1));
      });
    };
    update(); window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [reduceMotion]);

  const currentProgress = reduceMotion ? manualProgress : progress;
  const activeStop = Math.min(journeyStops.length - 1, Math.round(currentProgress * (journeyStops.length - 1)));
  const categories = useMemo(() => [...new Set(products.map((item) => item.category).filter(Boolean))].slice(0, 8), [products]);
  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? products.filter((item) => `${item.name} ${item.category} ${item.description || ""}`.toLowerCase().includes(term)) : products;
  }, [products, query]);

  const moveToStop = (index) => {
    const value = index / (journeyStops.length - 1);
    if (reduceMotion) { setManualProgress(value); return; }
    const section = sectionRef.current;
    if (!section) return;
    const start = section.getBoundingClientRect().top + window.scrollY - 116;
    const travel = Math.max(1, section.offsetHeight - window.innerHeight);
    window.scrollTo({ top: start + travel * value, behavior: "smooth" });
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/shop?search=${encodeURIComponent(term)}` : "/shop");
  };

  return <main className="mall-home">
    <section className="mall-journey" ref={sectionRef} aria-label="Savitri Livings virtual showroom">
      <div className="mall-sticky-stage">
        <div className="mall-render">
          {!show3d || !canUse3d ? <StaticShowroom products={products.slice(0, 3)} onPick={setSelected} /> : <Suspense fallback={<StaticShowroom products={products.slice(0, 3)} onPick={setSelected} />}><MallShowroom products={products.slice(0, 4)} onPick={setSelected} progress={currentProgress} reducedMotion={reduceMotion} /></Suspense>}
        </div>
        <div className="mall-stage-shade" aria-hidden="true" />
        <div className="mall-scene-head">
          <div><span className="mall-eyebrow"><Gem size={14} /> SAVITRI LIVINGS · THE VIRTUAL SHOWROOM</span><div className="mall-scroll-hint"><ArrowDown size={14} /> Scroll to step inside</div></div>
          <form className="mall-search" onSubmit={submitSearch} role="search">
            <Search size={16} aria-hidden="true" /><input aria-label="Search the Savitri collection" placeholder="Search jewellery & gifts" value={query} onChange={(event) => setQuery(event.target.value)} /><button aria-label="Search products" type="submit"><ArrowRight size={16} /></button>
          </form>
        </div>
        <div className="mall-scene-copy" aria-live="polite">
          <span className="mall-step">0{activeStop + 1} / 0{journeyStops.length} · {journeyStops[activeStop]}</span>
          <h1>Enter a more<br /><em>beautiful kind of shopping.</em></h1>
          <p>Walk through the Savitri Livings showroom. Discover pieces from our live catalogue as you move through the space.</p>
          <button className="mall-browse-cta" onClick={() => navigate("/shop")} type="button">Browse all products <ArrowUpRight size={16} /></button>
        </div>
        <div className="mall-scene-controls" aria-label="Showroom departments">
          <div className="mall-stop-list">{journeyStops.slice(0, 4).map((label, index) => <button key={label} type="button" aria-current={activeStop === index ? "step" : undefined} className={activeStop === index ? "active" : ""} onClick={() => moveToStop(index)}><i />{label}</button>)}</div>
          <div className="mall-progress" role="progressbar" aria-label="Showroom walkthrough" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(currentProgress * 100)}><span style={{ transform: `scaleX(${currentProgress})` }} /></div>
        </div>
        {loading && <div className="mall-loading" role="status"><span className="mall-spinner" />Preparing the showroom…</div>}
      </div>
    </section>

    <section className="mall-floor" aria-labelledby="mall-floor-title">
      <div className="mall-section-heading"><div><span className="mall-eyebrow mall-eyebrow-dark">SELECTED FROM THE LIVE CATALOGUE</span><h2 id="mall-floor-title">Pieces to discover</h2><p>Real products, current prices and availability from Savitri Livings.</p></div><button className="mall-text-link" type="button" onClick={() => navigate("/shop")}>View complete collection <ArrowRight size={16} /></button></div>
      {loadError && <div className="mall-error" role="alert"><span>{loadError}</span><button type="button" onClick={loadProducts}>Try again</button><button type="button" onClick={() => navigate("/shop")}>Open Shop</button></div>}
      {loading ? <div className="mall-card-grid">{[0, 1, 2, 3].map((i) => <div className="mall-skeleton" key={i} />)}</div> : products.length ? <div className="mall-card-grid">{filteredProducts.slice(0, 8).map((product) => <ProductCard key={product._id} product={product} onPick={setSelected} />)}</div> : !loadError && <div className="mall-empty"><Gem size={24} /><p>There are no products available right now.</p><button type="button" onClick={() => navigate("/shop")}>Visit the Shop</button></div>}
      {categories.length > 0 && <div className="mall-departments"><span>Browse departments</span>{categories.map((category) => <button key={category} type="button" onClick={() => navigate(`/shop?category=${encodeURIComponent(category)}`)}>{category}</button>)}</div>}
    </section>

    <section className="mall-editorial" aria-label="Explore Savitri Livings">
      <div className="mall-editorial-photo"><img src="/brand/home.png" alt="A warm, thoughtfully designed living space" loading="lazy" /></div>
      <div className="mall-editorial-copy"><span className="mall-eyebrow mall-eyebrow-dark">LIFESTYLE · LIVING · MORE</span><h2>One home for the things that make life yours.</h2><p>Shop Savitri Livings, discover local marketplace listings on Thikana, and find the Savitri Livings business network.</p><div className="mall-editorial-links"><button type="button" onClick={() => navigate("/marketplace")}>Explore Thikana <ArrowRight size={15} /></button><button type="button" onClick={() => navigate("/ecosystem")}>Explore SL Business <ArrowRight size={15} /></button></div></div>
    </section>

    {selected && <div className="mall-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
      <section className="mall-product-drawer" role="dialog" aria-modal="true" aria-labelledby="mall-product-title">
        <button className="mall-drawer-close" type="button" aria-label="Close product details" onClick={() => setSelected(null)}><X size={19} /></button>
        <img className="mall-drawer-image" src={getProductImage(selected)} alt={selected.name} />
        <div className="mall-drawer-body"><span className="mall-eyebrow mall-eyebrow-dark">{selected.category || "Savitri collection"}</span><h2 id="mall-product-title">{selected.name}</h2><strong className="mall-drawer-price">₹{Number(selected.price || 0).toLocaleString("en-IN")}</strong><p>{selected.description || "A considered piece from the Savitri Livings collection."}</p><p className="mall-stock">{selected.stock > 0 ? `${selected.stock} available` : "Currently unavailable"}</p>{(selected.purchaseMode || (selected.meeshoEnabled ? "meesho" : "direct")) !== "meesho" && <><button className="mall-add-button" disabled={selected.stock <= 0} type="button" onClick={() => addToCart(selected)}><ShoppingBag size={17} />{selected.stock > 0 ? "Add to bag" : "Sold out"}</button><button className="mall-view-button" disabled={selected.stock <= 0} type="button" onClick={() => { addToCart(selected); navigate("/cart"); }}>Buy now <ArrowRight size={15} /></button></>}{selected.meeshoEnabled && selected.meeshoUrl && <a className="mall-view-button" href={selected.meeshoUrl} target="_blank" rel="noopener noreferrer">Buy through Meesho <ArrowUpRight size={15} /></a>}<button className="mall-view-button" type="button" onClick={() => navigate(`/product/${selected._id}`)}>View product details <ArrowRight size={15} /></button></div>
      </section>
    </div>}

    <style>{`
      .mall-home{--mall-espresso:#30251d;--mall-walnut:#493328;--mall-gold:#c5a16d;--mall-cream:#faf7f0;--mall-muted:#756757;background:var(--mall-cream);color:var(--mall-espresso);overflow:clip;padding-bottom:20px}
      .mall-journey{height:390svh;min-height:2400px;position:relative;background:#211812}.mall-sticky-stage{height:calc(100svh - 116px);min-height:500px;position:sticky;top:116px;overflow:hidden;background:#1d1712}.mall-render{position:absolute;inset:0}.mall-render canvas{display:block;width:100%;height:100%}.mall-stage-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(22,16,12,.84) 0%,rgba(22,16,12,.46) 38%,rgba(22,16,12,.02) 76%),linear-gradient(0deg,rgba(20,14,10,.7),transparent 35%)}
      .mall-scene-head{position:absolute;top:22px;left:clamp(16px,4vw,56px);right:clamp(16px,4vw,56px);display:flex;align-items:flex-start;justify-content:space-between;gap:20px;color:#fff9ef}.mall-eyebrow{display:inline-flex;align-items:center;gap:8px;color:#e4c58f;font:600 .65rem 'DM Sans',sans-serif;letter-spacing:.15em}.mall-eyebrow-dark{color:#9a7644}.mall-scroll-hint{display:flex;align-items:center;gap:6px;margin-top:9px;color:rgba(255,249,239,.68);font-size:.72rem}.mall-search{display:flex;align-items:center;gap:9px;width:min(320px,48vw);height:42px;padding:0 6px 0 13px;border:1px solid rgba(255,255,255,.26);border-radius:999px;background:rgba(34,25,19,.55);backdrop-filter:blur(12px)}.mall-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:white;font:400 .78rem 'DM Sans',sans-serif}.mall-search input::placeholder{color:rgba(255,255,255,.62)}.mall-search button{flex:0 0 auto;width:31px;height:31px;border:0;border-radius:50%;background:#ead0a3;color:#403022;display:grid;place-items:center;cursor:pointer}
      .mall-sign{display:grid;gap:3px;min-width:180px;padding:7px 12px;color:#efd6a7;text-align:center;text-shadow:0 1px 8px rgba(239,214,167,.24)}.mall-sign span{font:700 12px 'DM Sans',sans-serif;letter-spacing:.24em}.mall-sign small{color:#d0ad73;font:600 8px 'DM Sans',sans-serif;letter-spacing:.34em}
      .mall-scene-copy{position:absolute;left:clamp(18px,7vw,100px);top:37%;transform:translateY(-30%);width:min(510px,64vw);color:#fffaf2}.mall-step{color:#e6c58e;font-size:.66rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase}.mall-scene-copy h1{margin:14px 0 12px;color:#fffaf2;font-size:clamp(2.7rem,6.1vw,5.6rem);line-height:.94;font-weight:500}.mall-scene-copy h1 em{font-weight:400;color:#e9c992}.mall-scene-copy p{max-width:420px;color:rgba(255,250,242,.79);font-size:clamp(.83rem,1.2vw,.98rem);line-height:1.75}.mall-browse-cta{display:inline-flex;align-items:center;gap:10px;margin-top:12px;padding:12px 17px;border:1px solid rgba(255,244,221,.5);border-radius:999px;background:#f4e7d0;color:#3f2e20;font:600 .78rem 'DM Sans',sans-serif;cursor:pointer}.mall-scene-controls{position:absolute;left:auto;right:clamp(18px,4vw,56px);bottom:calc(94px + env(safe-area-inset-bottom,0px));display:flex;align-items:flex-end;justify-content:flex-end;gap:20px}.mall-stop-list{display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap}.mall-stop-list button{display:flex;align-items:center;gap:7px;padding:8px 10px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(25,18,13,.45);color:rgba(255,249,239,.69);font:500 .68rem 'DM Sans',sans-serif;cursor:pointer;backdrop-filter:blur(10px)}.mall-stop-list button i{width:6px;height:6px;border-radius:50%;background:#8e795f}.mall-stop-list button.active{color:#fff4dd;border-color:rgba(230,197,142,.65)}.mall-stop-list button.active i{background:#edcc91;box-shadow:0 0 10px #edcc91}.mall-progress{width:min(190px,22vw);height:3px;overflow:hidden;border-radius:3px;background:rgba(255,255,255,.3)}.mall-progress span{display:block;width:100%;height:100%;transform-origin:left center;background:#e7c792}.mall-loading{position:absolute;right:25px;top:50%;display:flex;align-items:center;gap:8px;padding:10px 13px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(25,18,13,.72);color:white;font-size:.72rem}.mall-spinner{width:13px;height:13px;border:2px solid rgba(255,255,255,.4);border-top-color:#edcc91;border-radius:50%;animation:mall-spin .8s linear infinite}@keyframes mall-spin{to{transform:rotate(360deg)}}
      .mall-hotspot-label{display:flex;flex-direction:column;gap:3px;min-width:116px;padding:8px 10px;border:1px solid rgba(228,199,146,.58);border-radius:8px;background:rgba(43,31,22,.88);color:#fffaf2;text-align:left;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.24)}.mall-hotspot-label span{max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px}.mall-hotspot-label b{color:#ebcb91;font-size:11px}
      .mall-floor{max-width:1320px;margin:0 auto;padding:clamp(42px,7vw,90px) clamp(18px,4vw,56px) 62px}.mall-section-heading{display:flex;align-items:end;justify-content:space-between;gap:22px;margin-bottom:26px}.mall-section-heading h2,.mall-editorial-copy h2{margin:10px 0 5px;color:#3d3025;font-size:clamp(2.2rem,4.4vw,3.5rem);font-weight:500}.mall-section-heading p,.mall-editorial-copy p{margin:0;color:#7b6c5c;font-size:.9rem;line-height:1.7}.mall-text-link{display:inline-flex;align-items:center;gap:8px;padding:10px 0;border:0;background:none;color:#7a592e;font:600 .8rem 'DM Sans',sans-serif;cursor:pointer}.mall-card-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.mall-product-card{display:flex;flex-direction:column;gap:8px;padding:0 0 13px;overflow:hidden;border:1px solid #e9dfd0;border-radius:10px;background:#fffdf9;text-align:left;color:#3e3028;cursor:pointer;transition:transform .24s,box-shadow .24s}.mall-product-card:hover{transform:translateY(-4px);box-shadow:0 15px 35px rgba(61,44,28,.1)}.mall-product-card img{width:100%;aspect-ratio:1/1;object-fit:cover;background:#eee8de}.mall-product-card strong,.mall-card-category,.mall-card-price{margin-inline:13px}.mall-card-category{color:#9a7644;font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}.mall-product-card strong{min-height:2.5em;font-size:.85rem;line-height:1.35}.mall-card-price{color:#67502f;font-weight:700;font-size:.82rem}.mall-departments{display:flex;align-items:center;gap:8px;overflow:auto;margin-top:25px;padding:3px 0 7px}.mall-departments span{flex:0 0 auto;margin-right:3px;color:#806d57;font-size:.72rem}.mall-departments button{flex:0 0 auto;padding:8px 12px;border:1px solid #d8cbb8;border-radius:999px;background:#fffdf9;color:#66533c;font-size:.72rem;cursor:pointer}.mall-error,.mall-empty{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;padding:25px;border:1px solid #eadbc6;border-radius:12px;background:#fffdf9;color:#725a3d}.mall-error button,.mall-empty button{border:0;background:none;color:#825c2d;text-decoration:underline;cursor:pointer}.mall-skeleton{aspect-ratio:1;border-radius:10px;background:linear-gradient(100deg,#eee7dc 30%,#faf6ee 48%,#eee7dc 66%);background-size:200% 100%;animation:mall-shimmer 1.4s infinite}@keyframes mall-shimmer{to{background-position-x:-200%}}
      .mall-editorial{display:grid;grid-template-columns:1.1fr .9fr;max-width:1320px;min-height:380px;margin:0 auto 50px;padding:0 clamp(18px,4vw,56px);gap:clamp(26px,6vw,80px);align-items:center}.mall-editorial-photo{height:360px;overflow:hidden;border-radius:8px;background:#e5ded2}.mall-editorial-photo img{width:100%;height:100%;object-fit:cover}.mall-editorial-copy h2{font-size:clamp(2rem,3.7vw,3.2rem);line-height:1.06}.mall-editorial-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:23px}.mall-editorial-links button{display:inline-flex;align-items:center;gap:7px;padding:10px 14px;border:1px solid #d8c8ad;border-radius:999px;background:transparent;color:#654c2d;font:600 .74rem 'DM Sans',sans-serif;cursor:pointer}
      .mall-drawer-backdrop{position:fixed;inset:0;z-index:160;display:flex;justify-content:flex-end;background:rgba(17,12,9,.54);backdrop-filter:blur(3px)}.mall-product-drawer{position:relative;display:grid;grid-template-columns:1fr 1fr;align-content:start;width:min(760px,100%);height:100%;overflow-y:auto;background:#fffdf9;box-shadow:-20px 0 60px rgba(0,0,0,.22)}.mall-drawer-close{position:absolute;z-index:2;top:16px;right:16px;width:40px;height:40px;display:grid;place-items:center;border:1px solid rgba(70,50,31,.16);border-radius:50%;background:#fffdf9;color:#473526;cursor:pointer}.mall-drawer-image{position:sticky;top:0;width:100%;height:100svh;max-height:760px;object-fit:cover;background:#eee8de}.mall-drawer-body{align-self:center;padding:clamp(22px,4vw,46px)}.mall-drawer-body h2{margin:10px 0;color:#38291d;font-size:clamp(1.9rem,3vw,2.7rem)}.mall-drawer-body p{color:#746755;font-size:.84rem;line-height:1.65}.mall-drawer-price{display:block;color:#77562f;font-size:1.25rem}.mall-stock{font-weight:600}.mall-add-button,.mall-view-button{width:100%;min-height:46px;display:flex;align-items:center;justify-content:center;gap:9px;margin-top:10px;border:0;border-radius:999px;background:#443227;color:#fffaf2;font:600 .82rem 'DM Sans',sans-serif;cursor:pointer}.mall-add-button:disabled{opacity:.52;cursor:not-allowed}.mall-view-button{border:1px solid #d9c9ae;background:transparent;color:#61492b}.mall-2d-fallback{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:radial-gradient(ellipse at 50% 32%,#8b6746,#37271c 64%,#1c1510);color:#fff6e6;text-align:center}.fallback-arch{position:relative;width:min(70vw,440px);height:min(40vh,250px);border:9px solid #c8a268;box-shadow:inset 0 0 0 4px #4b3525,0 0 70px rgba(220,180,107,.22)}.fallback-shelf{position:absolute;inset:15% 7%;border-top:3px solid #c8a268;border-bottom:3px solid #c8a268;background:linear-gradient(90deg,transparent 24%,#543b29 24.5%,#543b29 25%,transparent 25.5%,transparent 74%,#543b29 74.5%,#543b29 75%,transparent 75.5%),linear-gradient(0deg,transparent 49%,rgba(215,184,132,.3) 50%,transparent 51%);box-shadow:inset 0 0 45px rgba(255,220,153,.2)}.fallback-counter{position:absolute;left:20%;right:20%;bottom:-35px;height:38px;border:3px solid #c8a268;background:#39251a}.mall-2d-fallback>p{margin:48px 0 13px;color:#f5dfbc;font:500 1.35rem 'Cormorant Garamond',serif}.fallback-products{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.fallback-products button{display:flex;flex-direction:column;gap:4px;padding:9px 12px;border:1px solid rgba(255,255,255,.28);border-radius:8px;background:rgba(30,20,12,.5);color:#fff6e6;font-size:.7rem;cursor:pointer}.fallback-products span{color:#ebcb91}
      @media(max-width:760px){.mall-journey{height:360svh;min-height:2100px}.mall-sticky-stage{min-height:480px}.mall-scene-head{top:15px;align-items:flex-start}.mall-eyebrow{font-size:.56rem;letter-spacing:.1em}.mall-scroll-hint{font-size:.66rem}.mall-search{width:43vw;height:38px;padding-left:10px}.mall-search input{font-size:16px}.mall-search input::placeholder{font-size:.67rem}.mall-scene-copy{left:20px;top:43%;width:min(400px,87vw);transform:translateY(-25%)}.mall-scene-copy h1{font-size:clamp(2.55rem,10vw,4.1rem)}.mall-scene-copy p{max-width:330px;font-size:.83rem}.mall-scene-controls{left:14px;right:14px;bottom:calc(91px + env(safe-area-inset-bottom,0px));display:block}.mall-stop-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.mall-stop-list button{justify-content:flex-start;min-height:34px;padding:7px 9px;font-size:.63rem}.mall-progress{display:block;width:100%;margin-top:10px}.mall-loading{top:auto;right:14px;bottom:90px;font-size:.65rem}.mall-section-heading{display:block}.mall-section-heading h2{font-size:2.4rem}.mall-text-link{margin-top:13px}.mall-card-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.mall-product-card strong{font-size:.78rem}.mall-product-card strong,.mall-card-category,.mall-card-price{margin-inline:10px}.mall-editorial{grid-template-columns:1fr;margin-bottom:35px}.mall-editorial-photo{height:260px}.mall-product-drawer{display:block}.mall-drawer-image{position:relative;height:38svh;max-height:none;object-fit:cover}.mall-drawer-body{padding:20px 20px calc(108px + env(safe-area-inset-bottom))}.mall-drawer-body h2{font-size:2rem}.mall-hotspot-label{min-width:100px;padding:6px 8px}.mall-hotspot-label span{font-size:9px}.mall-hotspot-label b{font-size:10px}}
      @media(prefers-reduced-motion:reduce){.mall-skeleton,.mall-spinner{animation:none}.mall-product-card{transition:none}}
    `}</style>
  </main>;
}

function StaticShowroom({ products, onPick }) {
  return <div className="mall-2d-fallback" aria-label="Savitri Livings showroom preview">
    <div className="fallback-arch"><div className="fallback-shelf" /><div className="fallback-counter" /></div>
    <p>Welcome to the Savitri Livings showroom</p>
    <div className="fallback-products">{products.map((product) => <button key={product._id} onClick={() => onPick(product)} type="button"><span>{product.name}</span><b>₹{Number(product.price || 0).toLocaleString("en-IN")}</b></button>)}</div>
  </div>;
}



