import { useEffect, useState } from "react";
import { ArrowRight, Blocks, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { moduleAPI } from "../../services/api.js";

const labels = { homepage: "Featured in Savitri Livings", tools: "More Savitri tools", games: "More to play", jobs: "Career tools", networking: "Networking tools" };

export default function PublishedModules({ placement = "tools", title }) {
  const [products, setProducts] = useState([]); const [state, setState] = useState("loading");
  useEffect(() => {
    let active = true;
    moduleAPI.discover(placement).then(({ data }) => { if (active) { setProducts(data.products || []); setState("ready"); } }).catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [placement]);
  if (state === "loading") return <section className="sl-published-modules" aria-live="polite"><p>Loading available products…</p></section>;
  if (state === "error") return <section className="sl-published-modules" role="status"><span>Products are temporarily unavailable.</span><button type="button" onClick={() => { setState("loading"); moduleAPI.discover(placement).then(({ data }) => { setProducts(data.products || []); setState("ready"); }).catch(() => setState("error")); }}><RefreshCw size={14}/> Retry</button></section>;
  if (!products.length) return null;
  return <section className="sl-published-modules" aria-label={title || labels[placement]}>
    <header><div><span className="sl-published-eyebrow">SAVITRI LIVINGS · MODULES</span><h2>{title || labels[placement]}</h2></div></header>
    <div className="sl-published-grid">{products.map((product) => {
      const direct = product.visibility?.directRoute;
      const href = direct ? product.frontendRoute : product.publishedRelease?.deploymentUrl;
      const external = !direct && Boolean(href);
      const content = <><div className="sl-published-image">{product.thumbnailUrl || product.logoUrl ? <img src={product.thumbnailUrl || product.logoUrl} alt="" loading="lazy" /> : <Blocks size={24}/>}</div><div className="sl-published-copy"><span>{product.category}</span><strong>{product.name}{product.visibility?.featured && <i>Featured</i>}</strong><small>{product.description}</small><b>{external ? "Open product" : "Explore"}<ArrowRight size={14}/></b></div></>;
      return href ? external ? <a className="sl-published-card" href={href} target="_blank" rel="noreferrer" key={product.productId}>{content}</a> : <Link className="sl-published-card" to={href} key={product.productId}>{content}</Link> : <article className="sl-published-card is-disabled" aria-disabled="true" key={product.productId}>{content}</article>;
    })}</div>
    <style>{`.sl-published-modules{max-width:1100px;margin:24px auto;padding:clamp(16px,3vw,24px);border:1px solid #eadfce;border-radius:18px;background:#fffdf9}.sl-published-modules>header{display:flex;justify-content:space-between;align-items:end;margin-bottom:14px}.sl-published-eyebrow{color:#99713b;font-size:.58rem;font-weight:800;letter-spacing:.13em}.sl-published-modules h2{margin:5px 0 0;color:#3e3028;font:500 clamp(1.45rem,3vw,2.15rem)/1.1 'Cormorant Garamond',Georgia,serif}.sl-published-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:10px}.sl-published-card{min-width:0;display:flex;gap:12px;align-items:center;padding:12px;border:1px solid #eee4da;border-radius:13px;background:linear-gradient(135deg,#fffefa,#fbf5e9);color:#3e3028;text-decoration:none;transition:transform .18s,border-color .18s}.sl-published-card:hover{transform:translateY(-2px);border-color:#c6a66c}.sl-published-card.is-disabled{opacity:.62}.sl-published-image{width:54px;height:54px;flex:0 0 54px;border-radius:11px;background:#f3ead9;color:#a27635;display:grid;place-items:center;overflow:hidden}.sl-published-image img{width:100%;height:100%;object-fit:cover}.sl-published-copy{min-width:0;display:grid;gap:4px}.sl-published-copy>span{text-transform:uppercase;color:#9b7846;font-size:.55rem;letter-spacing:.1em;font-weight:750}.sl-published-copy>strong{display:flex;align-items:center;gap:7px;font-size:.9rem}.sl-published-copy>strong i{padding:2px 5px;border-radius:20px;background:#f6ebd2;color:#91662b;font-size:.52rem;font-style:normal}.sl-published-copy>small{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;color:#80715e;font-size:.68rem;line-height:1.4}.sl-published-copy>b{display:flex;align-items:center;gap:5px;margin-top:2px;color:#92672f;font-size:.63rem}.sl-published-modules>p{margin:0;color:#806f59;font-size:.75rem}.sl-published-modules>button{display:inline-flex;gap:6px;align-items:center;margin-top:8px;border:0;background:none;color:#8f642e;cursor:pointer}`}</style>
  </section>;
}
