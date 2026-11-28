import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowRight, BriefcaseBusiness, Building2, Network, Sparkles } from "lucide-react";
import { growthLivingsAPI } from "../../services/growthLivings.js";

const defaults = {
  title: "Growth Livings",
  headline: "Build Your Professional Identity. Discover Opportunities. Grow Together.",
  description: "A connected ecosystem for professional portfolios, networking, recruitment and career opportunities.",
  products: {
    resume: { title: "Portfolio Studio", description: "Build a personal portfolio website with live templates, Gemini writing support and one-click publishing.", url: "/portfolio-builder", status: "active", previewImage: "" },
    trustThem: { title: "Trust Them", description: "Connect professionals, recruiters, HR teams, companies and candidates around career opportunities.", url: "https://trust-them.vercel.app/", status: "in-development", previewImage: "" },
  },
};
const statusLabel = { active: "Available now", "in-development": "In development", "coming-soon": "Coming soon", disabled: "Unavailable" };

function ProductAction({ product }) {
  const ready = product.url && product.status === "active";
  const label = product.status === "active" ? "Explore product" : statusLabel[product.status] || "In development";
  if (!ready) return <button className="growth-product-action" type="button" disabled>{label}<ArrowRight size={16} /></button>;
  const external = /^https?:/i.test(product.url);
  return <a className="growth-product-action" href={product.url} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{label}<ArrowRight size={16} /></a>;
}

function ResumePreview() {
  return <div className="growth-resume-preview" aria-label="Concept preview of an architectural portfolio">
    <div className="growth-resume-grid" />
    <div className="growth-build"><i /><i /><i /><b /><span /></div>
    <div className="growth-preview-label"><small>PORTFOLIO</small><strong>Architecture · Engineering · Project Delivery</strong></div>
  </div>;
}

function NetworkPreview() {
  return <div className="growth-network-preview" aria-label="Concept preview of professional opportunities">
    <div className="growth-network-sidebar"><b /><i /><i /><i /><i /></div>
    <div className="growth-network-content"><span>TRUST THEM</span><b /><b /><div><i /><i /><i /></div></div>
  </div>;
}

export default function GrowthLivings() {
  const [settings, setSettings] = useState(defaults);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    growthLivingsAPI.settings().then(({ data }) => { if (active && data.settings) { const products = { ...defaults.products, ...data.settings.products }; if (!products.resume.url) products.resume.url = "/portfolio-builder"; if (products.resume.status === "in-development") products.resume.status = "active"; setSettings((current) => ({ ...current, ...data.settings, products })); } }).catch(() => { if (active) setError("Live product settings could not be reached. Showing the published default overview."); });
    return () => { active = false; };
  }, []);
  useEffect(() => { document.title = `${settings.title || "Growth Livings"} | Savitri Livings`; }, [settings.title]);

  const products = [
    { key: "resume", Icon: Building2, preview: <ResumePreview />, eyebrow: "RESUME / PORTFOLIO", product: settings.products.resume },
    { key: "trustThem", Icon: Network, preview: <NetworkPreview />, eyebrow: "TRUST THEM", product: settings.products.trustThem },
  ];

  return <main className="growth-page">
    <header className="growth-hero"><span className="growth-kicker"><Sparkles size={15} /> SAVITRI LIVINGS · PROFESSIONAL GROWTH</span><h1>{settings.title || "Growth Livings"}</h1><p className="growth-tagline">{settings.headline}</p><p className="growth-description">{settings.description}</p><a className="growth-scroll" href="#growth-products">Discover the two products <ArrowDownRight size={16} /></a><div className="growth-orbit growth-orbit-one" /><div className="growth-orbit growth-orbit-two" /><div className="growth-glow" /></header>
    <section className="growth-section" id="growth-products" aria-labelledby="growth-products-heading">
      <div className="growth-section-heading"><div><span>PROFESSIONAL ECOSYSTEM</span><h2 id="growth-products-heading">Choose how you want to grow.</h2></div><p>Two focused products. One connected professional future.</p></div>
      {error && <p className="growth-error" role="status">{error}</p>}
      {settings.enabled === false && <p className="growth-unavailable" role="status">Growth Livings is temporarily unavailable. Please check back soon.</p>}
      <div className="growth-products">
        {products.map(({ key, Icon, preview, eyebrow, product }) => <article className={`growth-product growth-product-${key}`} key={key}>
          <div className="growth-product-top"><span><Icon size={16} /> {eyebrow}</span><small className={`growth-status growth-status-${product.status}`}>{statusLabel[product.status] || "Coming soon"}</small></div>
          <div className="growth-product-preview">{product.previewImage && <img src={product.previewImage} alt="" />}{!product.previewImage && preview}</div>
          <div className="growth-product-copy"><h3>{product.title}</h3><p>{product.description}</p><ProductAction product={product} />{!product.url && <small className="growth-deploy-note">Product link will be managed here after its deployment is configured.</small>}</div>
        </article>)}
      </div>
      <div className="growth-privacy-note"><BriefcaseBusiness size={18} /><p>Professional profiles are private by default. People control what they share and when their portfolio becomes public.</p></div>
    </section>
    <style>{`
      .growth-page{--growth-ink:#38250f;--growth-muted:#786044;--growth-gold:#9d6a27;--growth-cocoa:#593c20;min-height:100vh;background:linear-gradient(180deg,#fffdf9 0%,#faf4ea 58%,#f4ead9 100%);color:var(--growth-ink);padding-bottom:50px}
      .growth-hero{position:relative;isolation:isolate;min-height:490px;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:70px 22px 48px;text-align:center;background:radial-gradient(ellipse at 50% 92%,rgba(201,154,82,.22),transparent 46%),linear-gradient(145deg,#fffdf8,#f6eddf 68%);border-bottom:1px solid rgba(157,106,39,.12)}.growth-kicker{display:inline-flex;align-items:center;gap:8px;color:#98703e;font:700 .65rem 'DM Sans',sans-serif;letter-spacing:.18em}.growth-hero h1{position:relative;margin:17px 0 5px;font:600 clamp(3.3rem,9vw,6.5rem)/.96 'Cormorant Garamond',serif;letter-spacing:-.035em;color:#38250f}.growth-tagline{position:relative;max-width:850px;margin:11px auto 0;color:#50391f;font:500 clamp(1.05rem,2.3vw,1.45rem)/1.4 'DM Sans',sans-serif}.growth-description{position:relative;max-width:660px;margin:15px auto 0;color:var(--growth-muted);font:400 .93rem/1.75 'DM Sans',sans-serif}.growth-scroll{position:relative;display:inline-flex;align-items:center;gap:7px;margin-top:26px;color:#805826;font:600 .76rem 'DM Sans',sans-serif;text-decoration:none}.growth-scroll:hover{color:#593c20}.growth-orbit{position:absolute;z-index:-1;left:50%;top:50%;border:1px solid rgba(157,106,39,.12);border-radius:50%;transform:translate(-50%,-50%) rotate(-18deg)}.growth-orbit-one{width:min(900px,96vw);height:290px}.growth-orbit-two{width:min(1130px,112vw);height:410px;border-color:rgba(201,154,82,.14)}.growth-glow{position:absolute;z-index:-1;width:320px;height:120px;left:calc(50% - 160px);bottom:-90px;background:rgba(201,154,82,.18);filter:blur(80px)}
      .growth-section{max-width:1180px;margin:0 auto;padding:58px 24px 20px}.growth-section-heading{display:flex;align-items:end;justify-content:space-between;gap:25px;margin-bottom:24px}.growth-section-heading>div>span{color:#9d6a27;font:700 .63rem 'DM Sans',sans-serif;letter-spacing:.16em}.growth-section-heading h2{margin:8px 0 0;color:#38250f;font:500 clamp(2rem,4vw,3.25rem)/1.08 'Cormorant Garamond',serif}.growth-section-heading>p{max-width:290px;margin:0;color:#80684b;font:400 .83rem/1.6 'DM Sans',sans-serif}.growth-products{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.growth-product{overflow:hidden;border:1px solid rgba(157,106,39,.18);border-radius:20px;background:linear-gradient(145deg,#fff 0%,#fbf4e9 100%);box-shadow:0 18px 44px rgba(89,60,32,.10);transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}.growth-product:hover{transform:translateY(-4px);border-color:rgba(157,106,39,.34);box-shadow:0 24px 50px rgba(89,60,32,.15)}.growth-product-top{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:16px 18px 12px}.growth-product-top>span{display:flex;align-items:center;gap:7px;color:#80684b;font:700 .6rem 'DM Sans',sans-serif;letter-spacing:.13em}.growth-product-top>span svg{color:#a66e28}.growth-status{padding:5px 8px;border:1px solid rgba(157,106,39,.16);border-radius:99px;color:#80684b;background:#f8f1e6;font:600 .59rem 'DM Sans',sans-serif;white-space:nowrap}.growth-status-active{border-color:rgba(88,112,62,.22);color:#607049;background:#edf1df}.growth-product-preview{height:208px;margin:0 14px;position:relative;overflow:hidden;border:1px solid rgba(157,106,39,.14);border-radius:13px;background:#f1e4d1}.growth-product-preview>img{width:100%;height:100%;object-fit:cover}.growth-resume-preview{position:absolute;inset:0;overflow:hidden;background:radial-gradient(ellipse at 57% 62%,rgba(201,154,82,.20),transparent 42%),linear-gradient(145deg,#f5ead7,#ead9bc)}.growth-resume-grid{position:absolute;inset:0;opacity:.32;background-image:linear-gradient(rgba(157,106,39,.22) 1px,transparent 1px),linear-gradient(90deg,rgba(157,106,39,.22) 1px,transparent 1px);background-size:28px 28px;transform:perspective(300px) rotateX(48deg) scale(1.4);transform-origin:center bottom}.growth-build{position:absolute;left:50%;top:48%;width:180px;height:100px;transform:translate(-50%,-50%) perspective(260px) rotateX(55deg) rotateZ(-25deg);border:1px solid #a66e28;box-shadow:0 0 28px rgba(157,106,39,.16);background:linear-gradient(90deg,transparent 49%,rgba(157,106,39,.20) 50%,transparent 51%),linear-gradient(0deg,transparent 49%,rgba(157,106,39,.20) 50%,transparent 51%)}.growth-build i{position:absolute;bottom:0;width:1px;height:67px;background:#9d6a27}.growth-build i:nth-child(1){left:33%}.growth-build i:nth-child(2){left:66%}.growth-build i:nth-child(3){right:0}.growth-build b{position:absolute;left:18%;top:-48px;width:92px;height:48px;border:1px solid #76522c;border-bottom:0;box-shadow:0 0 22px rgba(157,106,39,.18)}.growth-build span{position:absolute;left:18%;top:0;width:92px;height:60px;border:1px solid #76522c;border-top:0;background:repeating-linear-gradient(90deg,transparent 0 21px,rgba(157,106,39,.28) 22px 24px)}.growth-preview-label{position:absolute;left:16px;bottom:14px;display:grid;gap:4px}.growth-preview-label small{color:#805826;font:700 .53rem 'DM Sans',sans-serif;letter-spacing:.13em}.growth-preview-label strong{font:500 .72rem 'DM Sans',sans-serif;color:#493015}
      .growth-network-preview{position:absolute;inset:0;display:flex;gap:13px;padding:18px;background:radial-gradient(ellipse at 80% 3%,rgba(201,154,82,.18),transparent 38%),linear-gradient(145deg,#f7efdf,#ead9bc)}.growth-network-sidebar{width:35px;flex:0 0 35px;display:grid;align-content:start;gap:13px;padding:8px;border:1px solid rgba(157,106,39,.14);border-radius:9px;background:#fbf7ef}.growth-network-sidebar b,.growth-network-sidebar i{height:7px;border-radius:8px;background:#d6c2a2}.growth-network-sidebar b{width:18px;height:18px;border-radius:6px;background:linear-gradient(140deg,#c99a52,#76522c)}.growth-network-content{display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:auto 10px 10px 1fr;align-content:start;gap:11px;flex:1;padding:5px}.growth-network-content>span{grid-column:1/-1;color:#805826;font:700 .53rem 'DM Sans',sans-serif;letter-spacing:.14em}.growth-network-content>b{height:31px;border:1px solid rgba(157,106,39,.15);border-radius:6px;background:linear-gradient(90deg,rgba(157,106,39,.16) 24%,transparent 24%),#fbf7ef}.growth-network-content>div{grid-column:1/-1;display:flex;gap:9px;padding:10px;border:1px solid rgba(157,106,39,.12);border-radius:7px}.growth-network-content>div i{flex:1;height:40px;border-radius:5px;background:linear-gradient(180deg,#dfca9f,#c6a575)}
      .growth-product-copy{padding:19px 20px 20px}.growth-product-copy h3{margin:0;color:#38250f;font:500 1.7rem 'Cormorant Garamond',serif}.growth-product-copy p{min-height:68px;margin:7px 0 16px;color:#80684b;font:400 .78rem/1.65 'DM Sans',sans-serif}.growth-product-action{display:inline-flex;align-items:center;gap:8px;padding:10px 13px;border:1px solid #76522c;border-radius:999px;background:linear-gradient(135deg,#8a5b22,#5a3a1c);color:#fff;font:600 .71rem 'DM Sans',sans-serif;text-decoration:none;cursor:pointer;box-shadow:0 5px 16px rgba(89,60,32,.12)}.growth-product-action:hover{box-shadow:0 8px 22px rgba(89,60,32,.20);transform:translateY(-1px)}.growth-product-action:disabled{border-color:#ddd1bf;background:#eee6da;color:#94856f;box-shadow:none;cursor:not-allowed}.growth-deploy-note{display:block;margin-top:10px;color:#947f65;font:400 .65rem/1.5 'DM Sans',sans-serif}.growth-error,.growth-unavailable{padding:11px 13px;border:1px solid rgba(157,106,39,.20);border-radius:10px;background:#fbf3e7;color:#805826;font:400 .74rem/1.5 'DM Sans',sans-serif}.growth-privacy-note{display:flex;align-items:center;gap:11px;max-width:700px;margin:26px auto 0;padding:14px 16px;border:1px solid rgba(157,106,39,.13);border-radius:13px;background:rgba(255,255,255,.55);color:#80684b}.growth-privacy-note p{margin:0;color:#80684b;font:400 .71rem/1.55 'DM Sans',sans-serif}.growth-privacy-note svg{flex:0 0 auto;color:#9d6a27}
      @media(max-width:700px){.growth-hero{min-height:400px;padding-top:56px}.growth-section{padding:39px 15px 18px}.growth-section-heading{display:block}.growth-section-heading>p{margin-top:9px}.growth-products{grid-template-columns:1fr;gap:14px}.growth-product-preview{height:190px}.growth-product-copy p{min-height:0}.growth-orbit-one{height:240px}.growth-orbit-two{height:350px}}
      @media(prefers-reduced-motion:reduce){.growth-page *{scroll-behavior:auto!important;transition:none!important}}
    `}</style>
  </main>;
}
