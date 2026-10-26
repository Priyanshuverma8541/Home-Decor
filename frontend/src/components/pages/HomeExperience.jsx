import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Gift, Gem, Home, Search, Shirt, Store, Utensils } from "lucide-react";
import ExperienceSwitcher from "../layout/ExperienceSwitcher.jsx";
import { productAPI } from "../../services/api.js";
import { getProductImage } from "../../utils/productImage.js";

const collections = [
  { title: "Jewellery", Icon: Gem, match: /jewel|ring|necklace|earring|bridal/i, to: "/shop" },
  { title: "Savitri Kolkata", Icon: Store, match: /kolkata/i, href: "https://savitri-kolkata.vercel.app/" },
  { title: "Fashion", Icon: Shirt, match: /fashion|clothing|apparel/i, to: "/shop?search=fashion" },
  { title: "Home Décor", Icon: Home, match: /decor|home|living/i, to: "/shop?search=home%20decor" },
  { title: "Gifts", Icon: Gift, match: /gift|occasion/i, to: "/shop?category=gift" },
];

export default function HomeExperience() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const collectionCards = useMemo(() => collections.map((item) => ({ ...item, product: products.find((product) => item.match.test(`${product.name} ${product.category} ${product.description || ""}`)) })), [products]);

  useEffect(() => {
    let live = true;
    productAPI.getAll({ limit: 30 }).then(({ data }) => { if (live) setProducts(data.products || []); }).catch(() => {});
    return () => { live = false; };
  }, []);

  const search = (event) => {
    event.preventDefault();
    navigate(query.trim() ? `/shop?search=${encodeURIComponent(query.trim())}` : "/shop");
  };
  const openCollection = (item) => item.href ? window.open(item.href, "_blank", "noopener,noreferrer") : navigate(item.to);
  const featured = products.find((item) => getProductImage(item)) || null;

  return <main className="sl-homepage">
    <form className="sl-home-search" role="search" onSubmit={search}>
      <Search size={21} aria-hidden="true" />
      <input aria-label="Search jewellery, home and gift collections" placeholder="Search jewellery, home & gifts…" value={query} onChange={(event) => setQuery(event.target.value)} />
      <button type="submit" aria-label="Search Savitri Livings"><ArrowRight size={19} /></button>
    </form>

    <ExperienceSwitcher homepage />

    <section className="sl-mall-hero" aria-label="Discover the Savitri Livings mall">
      <img className="sl-mall-hero-image" src="/brand/mall-hero.webp" alt="A warm, elegant Savitri Livings shopping mall with jewellery and lifestyle boutiques" fetchPriority="high" />
      <div className="sl-mall-hero-shade" />
      <div className="sl-mall-hero-caption">
        <span className="sl-home-eyebrow">SAVITRI LIVINGS · LIFESTYLE · LIVING · MORE</span>
        <h1>Step into<br />Savitri Livings</h1>
        <p>A world of jewellery, fashion, home décor, gifts and more.</p>
        <button className="sl-explore-mall" type="button" onClick={() => navigate("/mall")}>Explore the Mall <ArrowRight size={17} /></button>
      </div>
      <button className="sl-skip-products" type="button" onClick={() => navigate("/shop")}><span className="sl-grid-icon" aria-hidden="true">⠿</span> Skip to Products <ArrowRight size={16} /></button>
      <div className="sl-hero-dots" aria-hidden="true"><i /><i /><i /><i /><i /></div>
    </section>

    <section className="sl-collections" id="sl-collections" aria-labelledby="sl-collections-title">
      <div className="sl-collections-heading"><h2 id="sl-collections-title">Explore Our Collections</h2><button type="button" onClick={() => navigate("/shop")}>View all <ArrowRight size={16} /></button></div>
      <div className="sl-collection-rail">
        {collectionCards.map((item) => {
          const Icon = item.Icon;
          const image = item.product ? getProductImage(item.product) : item.title === "Savitri Kolkata" ? "/brand/savitri-jewellers-mark.png" : "";
          return <button className={`sl-collection-card${image ? " has-image" : ""}`} type="button" key={item.title} onClick={() => openCollection(item)}>
            <span className="sl-collection-art">{image ? <img src={image} alt="" loading="lazy" /> : <Icon size={32} strokeWidth={1.5} aria-hidden="true" />}</span>
            <span className="sl-collection-title">{item.title}</span><span className="sl-collection-arrow" aria-hidden="true"><ArrowRight size={16} /></span>
          </button>;
        })}
      </div>
    </section>

    <section className="sl-feature-banner" aria-label="Featured collection">
      <img src={featured ? getProductImage(featured) : "/brand/home.png"} alt={featured?.name || "Savitri Livings lifestyle collection"} loading="lazy" />
      <div className="sl-feature-overlay"><span>THOUGHTFULLY CHOSEN</span><h2>Everyday elegance</h2><p>Find pieces and experiences that feel like you.</p><button type="button" onClick={() => featured ? navigate(`/product/${featured._id}`) : navigate("/shop")}>Discover more <ArrowRight size={16} /></button></div>
    </section>

    <section className="sl-home-discover" aria-label="More from Savitri Livings">
      <div><span>ONE CONNECTED WORLD</span><h2>More ways to live, explore and grow.</h2><p>From discovering your city to finding business resources and entertainment, Savitri Livings brings more of everyday life into one place.</p></div>
      <div className="sl-discover-links"><button type="button" onClick={() => navigate("/marketplace")}><Store size={19} /> Thikana <ArrowUpRight size={15} /></button><button type="button" onClick={() => navigate("/ecosystem")}><Gem size={19} /> SL Business <ArrowUpRight size={15} /></button><button type="button" onClick={() => navigate("/entertainment")}><Utensils size={19} /> Experiences <ArrowUpRight size={15} /></button></div>
    </section>

    <style>{`
      .sl-homepage{--sl-brown:#56391e;--sl-ink:#30241b;--sl-gold:#d2a75f;background:#fffdf9;color:var(--sl-ink);padding-bottom:22px}
      .sl-home-search{height:54px;max-width:1200px;margin:13px auto 0;padding:0 15px;display:flex;align-items:center;gap:13px;border:1px solid #eee5d9;border-radius:18px;background:white;color:#654d34;box-shadow:0 7px 24px rgba(59,41,25,.09)}.sl-home-search input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#34271d;font:400 .95rem 'DM Sans',sans-serif}.sl-home-search input::placeholder{color:#8a8178}.sl-home-search button{width:38px;height:38px;display:grid;place-items:center;border:0;border-radius:50%;background:#f5e6ca;color:#593d20;cursor:pointer}
      .sl-mall-hero{position:relative;isolation:isolate;height:clamp(480px,68svh,760px);overflow:hidden;background:#493328}.sl-mall-hero-image{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover;object-position:center 48%}.sl-mall-hero-shade{position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(28,18,10,.76),rgba(29,19,11,.25) 48%,rgba(29,19,11,.02) 76%),linear-gradient(0deg,rgba(24,16,10,.48),transparent 38%)}
      .sl-mall-hero-caption{position:absolute;left:clamp(24px,7vw,105px);bottom:clamp(35px,8vh,82px);width:min(430px,72vw);padding:22px 24px 24px;border:1px solid rgba(255,242,219,.18);border-radius:20px;background:rgba(39,27,18,.6);color:#fff9ef;backdrop-filter:blur(12px)}.sl-home-eyebrow{color:#efd19b;font:700 .61rem 'DM Sans',sans-serif;letter-spacing:.16em}.sl-mall-hero-caption h1{margin:8px 0 7px;color:#fff9ef;font:500 clamp(2.35rem,5vw,4rem)/.96 'Cormorant Garamond',serif}.sl-mall-hero-caption p{margin:0;color:rgba(255,249,239,.9);font-size:clamp(.88rem,1.5vw,1.05rem);line-height:1.55}.sl-explore-mall{display:inline-flex;align-items:center;gap:11px;margin-top:16px;padding:11px 18px;border:0;border-radius:999px;background:#f0d49f;color:#4d3219;font:700 .83rem 'DM Sans',sans-serif;cursor:pointer;transition:transform .2s,background .2s}.sl-explore-mall:hover{transform:translateY(-2px);background:#ffe5ae}
      .sl-skip-products{position:absolute;right:clamp(16px,3vw,38px);bottom:34px;display:flex;align-items:center;gap:8px;padding:11px 15px;border:1px solid rgba(255,249,239,.34);border-radius:999px;background:rgba(35,24,16,.6);color:#fff9ef;font:600 .72rem 'DM Sans',sans-serif;backdrop-filter:blur(10px);cursor:pointer}.sl-grid-icon{font-size:1.1rem}.sl-hero-dots{position:absolute;bottom:27px;left:50%;display:flex;gap:10px;transform:translateX(-50%)}.sl-hero-dots i{width:8px;height:8px;border:1px solid rgba(255,255,255,.8);border-radius:50%;background:rgba(255,255,255,.35)}.sl-hero-dots i:first-child{width:20px;border-radius:99px;background:#fff}
      .sl-collections{max-width:1320px;margin:0 auto;padding:25px clamp(18px,3vw,36px) 24px;scroll-margin-top:72px}.sl-collections-heading{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:13px}.sl-collections-heading h2{margin:0;color:#2f261f;font:600 clamp(1.5rem,3vw,2rem) 'Cormorant Garamond',serif}.sl-collections-heading button{display:flex;align-items:center;gap:6px;border:0;background:transparent;color:#855321;font:600 .78rem 'DM Sans',sans-serif;cursor:pointer}.sl-collection-rail{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:13px}.sl-collection-card{position:relative;min-width:0;padding:0 0 7px;border:0;background:transparent;color:#35271e;text-align:center;font:600 .79rem 'DM Sans',sans-serif;cursor:pointer}.sl-collection-art{position:relative;display:grid;place-items:center;width:100%;aspect-ratio:1.12;border-radius:15px;overflow:hidden;background:linear-gradient(140deg,#f2ddbd,#ead3af 52%,#cfab78);color:#76542d}.sl-collection-card:nth-child(2) .sl-collection-art{background:linear-gradient(145deg,#f3e7c9,#d6c39a)}.sl-collection-card:nth-child(3) .sl-collection-art{background:linear-gradient(145deg,#f2d9ce,#dca78f);color:#814d38}.sl-collection-card:nth-child(4) .sl-collection-art{background:linear-gradient(145deg,#e7e5d6,#c4c2a8);color:#5f6b48}.sl-collection-card:nth-child(5) .sl-collection-art{background:linear-gradient(145deg,#ead8c9,#cd9872);color:#734936}.sl-collection-art img{width:100%;height:100%;object-fit:cover;transition:transform .35s}.sl-collection-card:hover .sl-collection-art img{transform:scale(1.04)}.sl-collection-card:nth-child(2) .sl-collection-art img{width:56%;height:56%;object-fit:contain;mix-blend-mode:multiply}.sl-collection-title{display:block;margin-top:7px}.sl-collection-arrow{position:absolute;right:7px;bottom:27px;display:grid;width:31px;height:31px;place-items:center;border:1px solid rgba(255,255,255,.8);border-radius:50%;background:rgba(73,49,29,.8);color:white}
      .sl-feature-banner{position:relative;isolation:isolate;max-width:1250px;height:260px;margin:10px auto 35px;overflow:hidden;border-radius:17px;background:#e9d7bb}.sl-feature-banner>img{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover;object-position:center 57%}.sl-feature-banner:after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(243,225,196,.96),rgba(243,225,196,.82) 37%,rgba(243,225,196,.02) 80%)}.sl-feature-overlay{max-width:480px;padding:27px 32px;color:#4c2c17}.sl-feature-overlay>span,.sl-home-discover>div>span{font:700 .62rem 'DM Sans',sans-serif;letter-spacing:.15em;color:#9a6432}.sl-feature-overlay h2{margin:7px 0 2px;font:600 clamp(1.8rem,3.2vw,2.7rem) 'Cormorant Garamond',serif}.sl-feature-overlay p{margin:0;color:#6e4d34;font-size:.84rem}.sl-feature-overlay button{display:flex;align-items:center;gap:8px;margin-top:12px;padding:10px 15px;border:0;border-radius:999px;background:#71431b;color:#fff7e9;font:600 .76rem 'DM Sans',sans-serif;cursor:pointer}
      .sl-home-discover{max-width:1250px;margin:0 auto 45px;padding:27px 30px;display:flex;align-items:center;justify-content:space-between;gap:25px;border:1px solid #eee4d7;border-radius:18px;background:#faf5ec}.sl-home-discover>div:first-child{max-width:560px}.sl-home-discover h2{margin:6px 0;color:#352820;font:600 clamp(1.7rem,3vw,2.5rem) 'Cormorant Garamond',serif}.sl-home-discover p{margin:0;color:#7e6d58;line-height:1.65;font-size:.86rem}.sl-discover-links{display:flex;flex-wrap:wrap;gap:8px}.sl-discover-links button{display:flex;align-items:center;gap:8px;padding:11px 12px;border:1px solid #e4d4bd;border-radius:12px;background:white;color:#694a27;font:600 .75rem 'DM Sans',sans-serif;cursor:pointer}.sl-discover-links button svg:first-child{color:#9a7339}
      @media(max-width:760px){.sl-home-search{height:48px;margin:9px 12px 0;padding:0 12px;gap:10px;border-radius:15px}.sl-home-search input{font-size:.83rem}.sl-homepage>.experience-switcher-home{padding-top:10px;padding-bottom:11px}.sl-mall-hero{height:clamp(500px,68svh,690px)}.sl-mall-hero-image{object-position:center 50%}.sl-mall-hero-shade{background:linear-gradient(0deg,rgba(28,18,10,.74),rgba(29,19,11,.04) 74%),linear-gradient(90deg,rgba(29,19,11,.12),transparent)}.sl-mall-hero-caption{left:16px;bottom:60px;width:min(350px,calc(100% - 32px));padding:17px 18px 19px;border-radius:17px}.sl-mall-hero-caption h1{font-size:2.45rem}.sl-mall-hero-caption p{max-width:285px;font-size:.9rem}.sl-explore-mall{margin-top:12px}.sl-skip-products{right:12px;bottom:14px;padding:8px 10px;font-size:.63rem}.sl-hero-dots{bottom:21px;left:auto;right:180px;transform:none;gap:7px}.sl-hero-dots i{width:6px;height:6px}.sl-hero-dots i:first-child{width:15px}.sl-collections{padding:19px 15px 18px}.sl-collections-heading{margin-bottom:10px}.sl-collection-rail{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:0 0 7px;scrollbar-width:none}.sl-collection-rail::-webkit-scrollbar{display:none}.sl-collection-card{flex:0 0 31%;scroll-snap-align:start;font-size:.69rem}.sl-collection-art{aspect-ratio:.94;border-radius:12px}.sl-collection-arrow{width:27px;height:27px;right:5px;bottom:25px}.sl-feature-banner{height:220px;margin:6px 14px 24px;border-radius:14px}.sl-feature-banner>img{object-position:60% center}.sl-feature-banner:after{background:linear-gradient(90deg,rgba(243,225,196,.97),rgba(243,225,196,.88) 56%,rgba(243,225,196,.17))}.sl-feature-overlay{padding:23px 18px;width:80%}.sl-feature-overlay h2{font-size:2rem}.sl-feature-overlay p{max-width:230px;line-height:1.4}.sl-home-discover{margin:0 14px 30px;padding:20px 18px;display:block}.sl-discover-links{margin-top:15px}.sl-discover-links button{flex:1;justify-content:center;min-width:42%}}
      @media(max-width:380px){.sl-mall-hero{height:500px}.sl-mall-hero-caption{bottom:54px}.sl-mall-hero-caption h1{font-size:2.25rem}.sl-skip-products{font-size:0;width:40px;height:40px;justify-content:center;border-radius:50%;padding:0}.sl-grid-icon{display:none}.sl-skip-products svg{width:17px;height:17px}.sl-hero-dots{right:62px}.sl-collection-card{flex-basis:34%}.sl-feature-overlay{width:88%}}
      @media(prefers-reduced-motion:reduce){.sl-explore-mall,.sl-collection-art img{transition:none}}
    `}</style>
  </main>;
}
