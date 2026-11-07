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
    <div className="growth-preview-label"><small>RESUME / PORTFOLIO</small><strong>Architecture · Engineering · Project Delivery</strong></div>
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
      .growth-page{--growth-ink:#f0f3ff;--growth-muted:#a6b1c9;--growth-violet:#a58bff;--growth-cyan:#70d9f3;min-height:100vh;background:#080b16;color:var(--growth-ink);padding-bottom:50px}
      .growth-hero{position:relative;isolation:isolate;min-height:490px;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:70px 22px 48px;text-align:center;background:radial-gradient(ellipse at 50% 92%,rgba(53,47,116,.3),transparent 46%),linear-gradient(145deg,#101529,#090b17 68%)}.growth-kicker{display:inline-flex;align-items:center;gap:8px;color:var(--growth-cyan);font:700 .65rem 'DM Sans',sans-serif;letter-spacing:.18em}.growth-hero h1{position:relative;margin:17px 0 5px;font:600 clamp(3.3rem,9vw,6.5rem)/.96 'Cormorant Garamond',serif;letter-spacing:-.035em;background:linear-gradient(100deg,#fff,#a8dcff 42%,#c5a9ff 72%,#fff);color:transparent;background-clip:text}.growth-tagline{position:relative;max-width:850px;margin:11px auto 0;color:#e8eaff;font:500 clamp(1.05rem,2.3vw,1.45rem)/1.4 'DM Sans',sans-serif}.growth-description{position:relative;max-width:660px;margin:15px auto 0;color:var(--growth-muted);font:400 .93rem/1.75 'DM Sans',sans-serif}.growth-scroll{position:relative;display:inline-flex;align-items:center;gap:7px;margin-top:26px;color:#c3b5ff;font:600 .76rem 'DM Sans',sans-serif;text-decoration:none}.growth-orbit{position:absolute;z-index:-1;left:50%;top:50%;border:1px solid rgba(102,194,239,.13);border-radius:50%;transform:translate(-50%,-50%) rotate(-18deg)}.growth-orbit-one{width:min(900px,96vw);height:290px}.growth-orbit-two{width:min(1130px,112vw);height:410px;border-color:rgba(155,123,255,.11)}.growth-glow{position:absolute;z-index:-1;width:320px;height:120px;left:calc(50% - 160px);bottom:-90px;background:rgba(103,81,239,.3);filter:blur(80px)}
      .growth-section{max-width:1180px;margin:0 auto;padding:58px 24px 20px}.growth-section-heading{display:flex;align-items:end;justify-content:space-between;gap:25px;margin-bottom:24px}.growth-section-heading>div>span{color:#83d7f1;font:700 .63rem 'DM Sans',sans-serif;letter-spacing:.16em}.growth-section-heading h2{margin:8px 0 0;font:500 clamp(2rem,4vw,3.25rem)/1.08 'Cormorant Garamond',serif}.growth-section-heading>p{max-width:290px;margin:0;color:#9da9c2;font:400 .83rem/1.6 'DM Sans',sans-serif}.growth-products{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.growth-product{overflow:hidden;border:1px solid rgba(156,173,219,.17);border-radius:20px;background:linear-gradient(145deg,rgba(28,36,62,.86),rgba(15,18,33,.98));box-shadow:0 24px 70px rgba(0,0,0,.24)}.growth-product-top{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:16px 18px 12px}.growth-product-top>span{display:flex;align-items:center;gap:7px;color:#9db8d2;font:700 .6rem 'DM Sans',sans-serif;letter-spacing:.13em}.growth-product-top>span svg{color:#70d9f3}.growth-status{padding:5px 8px;border:1px solid rgba(122,180,221,.18);border-radius:99px;color:#b9c7de;font:600 .59rem 'DM Sans',sans-serif;white-space:nowrap}.growth-status-active{border-color:rgba(101,225,184,.25);color:#8fe8c4}.growth-product-preview{height:208px;margin:0 14px;position:relative;overflow:hidden;border:1px solid rgba(129,158,220,.13);border-radius:13px;background:#090d1d}.growth-product-preview>img{width:100%;height:100%;object-fit:cover}.growth-resume-preview{position:absolute;inset:0;overflow:hidden;background:radial-gradient(ellipse at 57% 62%,rgba(42,112,153,.23),transparent 39%),linear-gradient(145deg,#11192c,#0c1020)}.growth-resume-grid{position:absolute;inset:0;opacity:.28;background-image:linear-gradient(rgba(102,195,235,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(102,195,235,.2) 1px,transparent 1px);background-size:28px 28px;transform:perspective(300px) rotateX(48deg) scale(1.4);transform-origin:center bottom}.growth-build{position:absolute;left:50%;top:48%;width:180px;height:100px;transform:translate(-50%,-50%) perspective(260px) rotateX(55deg) rotateZ(-25deg);border:1px solid #5dc9e5;box-shadow:0 0 28px rgba(66,191,228,.23);background:linear-gradient(90deg,transparent 49%,rgba(70,197,225,.25) 50%,transparent 51%),linear-gradient(0deg,transparent 49%,rgba(70,197,225,.25) 50%,transparent 51%)}.growth-build i{position:absolute;bottom:0;width:1px;height:67px;background:#7cceef}.growth-build i:nth-child(1){left:33%}.growth-build i:nth-child(2){left:66%}.growth-build i:nth-child(3){right:0}.growth-build b{position:absolute;left:18%;top:-48px;width:92px;height:48px;border:1px solid #a88bff;border-bottom:0;box-shadow:0 0 22px rgba(157,127,255,.3)}.growth-build span{position:absolute;left:18%;top:0;width:92px;height:60px;border:1px solid #a88bff;border-top:0;background:repeating-linear-gradient(90deg,transparent 0 21px,rgba(131,107,206,.45) 22px 24px)}.growth-preview-label{position:absolute;left:16px;bottom:14px;display:grid;gap:4px}.growth-preview-label small{color:#7fd7ed;font:700 .53rem 'DM Sans',sans-serif;letter-spacing:.13em}.growth-preview-label strong{font:500 .72rem 'DM Sans',sans-serif;color:#d4dcf4}
      .growth-network-preview{position:absolute;inset:0;display:flex;gap:13px;padding:18px;background:radial-gradient(ellipse at 80% 3%,rgba(83,70,169,.26),transparent 38%),linear-gradient(145deg,#101629,#0b0e1d)}.growth-network-sidebar{width:35px;flex:0 0 35px;display:grid;align-content:start;gap:13px;padding:8px;border:1px solid rgba(149,161,207,.12);border-radius:9px;background:#12182a}.growth-network-sidebar b,.growth-network-sidebar i{height:7px;border-radius:8px;background:#303d5c}.growth-network-sidebar b{width:18px;height:18px;border-radius:6px;background:linear-gradient(140deg,#54c9df,#9d85fd)}.growth-network-content{display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:auto 10px 10px 1fr;align-content:start;gap:11px;flex:1;padding:5px}.growth-network-content>span{grid-column:1/-1;color:#77d7ee;font:700 .53rem 'DM Sans',sans-serif;letter-spacing:.14em}.growth-network-content>b{height:31px;border:1px solid rgba(148,162,204,.15);border-radius:6px;background:linear-gradient(90deg,rgba(131,120,194,.18) 24%,transparent 24%),linear-gradient(0deg,#171f34,#171f34)}.growth-network-content>div{grid-column:1/-1;display:flex;gap:9px;padding:10px;border:1px solid rgba(148,162,204,.12);border-radius:7px}.growth-network-content>div i{flex:1;height:40px;border-radius:5px;background:linear-gradient(180deg,#1c2a41,#111828)}
      .growth-product-copy{padding:19px 20px 20px}.growth-product-copy h3{margin:0;color:#edf1ff;font:500 1.7rem 'Cormorant Garamond',serif}.growth-product-copy p{min-height:68px;margin:7px 0 16px;color:#a4afc8;font:400 .78rem/1.65 'DM Sans',sans-serif}.growth-product-action{display:inline-flex;align-items:center;gap:8px;padding:10px 13px;border:1px solid rgba(112,217,243,.38);border-radius:999px;background:rgba(65,149,181,.13);color:#c7f3ff;font:600 .71rem 'DM Sans',sans-serif;text-decoration:none;cursor:pointer}.growth-product-action:disabled{border-color:rgba(160,166,189,.15);background:rgba(89,97,124,.15);color:#9da8c1;cursor:not-allowed}.growth-deploy-note{display:block;margin-top:10px;color:#7e8aa6;font:400 .65rem/1.5 'DM Sans',sans-serif}.growth-error,.growth-unavailable{padding:11px 13px;border:1px solid rgba(232,203,149,.23);border-radius:10px;background:rgba(190,139,62,.08);color:#e4cb9b;font:400 .74rem/1.5 'DM Sans',sans-serif}.growth-privacy-note{display:flex;align-items:center;gap:11px;max-width:700px;margin:26px auto 0;padding:14px 16px;border:1px solid rgba(145,159,195,.12);border-radius:13px;color:#91a1c0}.growth-privacy-note p{margin:0;color:#a8b4cb;font:400 .71rem/1.55 'DM Sans',sans-serif}.growth-privacy-note svg{flex:0 0 auto;color:#7bd9dc}
      @media(max-width:700px){.growth-hero{min-height:400px;padding-top:56px}.growth-section{padding:39px 15px 18px}.growth-section-heading{display:block}.growth-section-heading>p{margin-top:9px}.growth-products{grid-template-columns:1fr;gap:14px}.growth-product-preview{height:190px}.growth-product-copy p{min-height:0}.growth-orbit-one{height:240px}.growth-orbit-two{height:350px}}
      @media(prefers-reduced-motion:reduce){.growth-page *{scroll-behavior:auto!important;transition:none!important}}
    `}</style>
  </main>;
}
