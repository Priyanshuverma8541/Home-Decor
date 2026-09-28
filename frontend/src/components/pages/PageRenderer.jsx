import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ExternalLink, ImageOff } from "lucide-react";
import { pagesAPI, productAPI } from "../../services/api.js";
import { useCart } from "../../context/CartContext.jsx";

const getSessionId = () => {
  let id = sessionStorage.getItem("sl-page-session");
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() || `visit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem("sl-page-session", id);
  }
  return id;
};

const trackEvent = (slug, type, sessionId, sectionId = "") => {
  const params = new URLSearchParams(window.location.search);
  const metadata = { sectionId };
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) metadata[key] = params.get(key) || "";
  return pagesAPI.track(slug, { type, sessionId, metadata }).catch(() => {});
};

const safeHref = (value) => {
  const href = String(value || "").trim();
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const url = new URL(href, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "#";
  } catch { return "#"; }
};

function safeDocument(html) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: http:; media-src https: http:; style-src 'unsafe-inline'; font-src https:; base-uri 'none'; form-action 'none'"><style>html{font-family:system-ui,sans-serif}body{margin:0}img,video{max-width:100%;height:auto}*{box-sizing:border-box}</style></head><body>${html}</body></html>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[character]);
}

function resolveHtml(page, products) {
  const custom = page.customizations || {};
  const product = products[0] || {};
  const values = {
    "page.title": custom.title || page.seo?.title || page.name,
    "page.description": custom.description || page.description,
    "page.ctaText": custom.ctaText,
    "page.ctaUrl": safeHref(custom.ctaUrl),
    "page.offerText": custom.offerText,
    "page.bannerImage": safeHref(custom.bannerImage),
    "product.name": product.name,
    "product.price": product.price,
    "product.image": safeHref(product.images?.[0]),
    "product.url": product._id ? `/product/${product._id}` : "",
    "customer.name": "",
    "campaign.name": page.campaignName,
    year: new Date().getFullYear(),
  };
  let html = String(page.htmlContent || "");
  for (const [key, value] of Object.entries(values)) html = html.replaceAll(`{{${key}}}`, escapeHtml(value));
  const cards = products.map((item) => `<article><a href="/product/${escapeHtml(item._id)}" target="_top"><img src="${escapeHtml(safeHref(item.images?.[0]))}" alt="${escapeHtml(item.name)}"><h3>${escapeHtml(item.name)}</h3><span>₹${escapeHtml(item.price)}</span></a></article>`).join("");
  html = html.replaceAll("{{savitri.products}}", cards);
  return html.replace(/<div\b(?=[^>]*\bid=["']savitri-products["'])[^>]*>\s*<\/div>/i, cards);
}

export default function PageRenderer({ Navbar, Footer }) {
  const { slug } = useParams();
  const [previewToken] = useState(() => new URLSearchParams(window.location.search).get("previewToken") || "");
  const [page, setPage] = useState(null);
  const [htmlProducts, setHtmlProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const sessionId = getSessionId();
  const { addToCart } = useCart();

  useLayoutEffect(() => {
    if (!previewToken) return;
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("previewToken");
    window.history.replaceState(window.history.state, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
  }, [previewToken]);

  useEffect(() => {
    let active = true;
    setLoading(true); setPage(null); setError("");
    const request = new URLSearchParams(window.location.search).get("preview") === "true"
      ? previewToken ? pagesAPI.preview(slug, previewToken) : Promise.reject(new Error("Preview access is required."))
      : pagesAPI.published(slug);
    request.then(({ data }) => {
      if (!active) return;
      setPage(data.page);
      if (!previewToken) {
        sessionStorage.setItem("sl_landing_page_slug", slug);
        sessionStorage.setItem("sl_landing_page_session", sessionId);
        trackEvent(slug, "page_view", sessionId);
      }
    }).catch((requestError) => {
      if (active) setError(requestError.response?.status === 404 ? "This page is not available." : requestError.response?.data?.message || "This page could not be loaded.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, previewToken, sessionId]);

  useEffect(() => {
    if (!page || page.sourceType !== "html") { setHtmlProducts([]); return undefined; }
    let active = true;
    const params = { limit:100, ...(page.settings?.productCategory ? { category:page.settings.productCategory } : {}) };
    productAPI.getAll(params).then(({ data }) => {
      if (!active) return;
      const available = data.products || [];
      const featured = page.settings?.productId ? available.find((product) => product._id === page.settings.productId) : null;
      setHtmlProducts(featured ? [featured, ...available.filter((product) => product._id !== featured._id)] : available);
    }).catch(() => { if (active) setHtmlProducts([]); });
    return () => { active = false; };
  }, [page]);

  useEffect(() => {
    if (!page) return;
    const seo = page.seo || {};
    const previousTitle = document.title;
    const metaSpecs = [
      ["description", "name"], ["keywords", "name"], ["robots", "name"],
      ["og:title", "property"], ["og:description", "property"], ["og:image", "property"],
    ];
    const previousMeta = metaSpecs.map(([name, attribute]) => ({
      name,
      attribute,
      tag: document.head.querySelector(`meta[${attribute}="${name}"]`),
      content: document.head.querySelector(`meta[${attribute}="${name}"]`)?.getAttribute("content"),
    }));
    const previousCanonical = document.head.querySelector('link[rel="canonical"]');
    const previousCanonicalUrl = previousCanonical?.getAttribute("href");
    document.title = seo.title || page.name || "Savitri Livings";
    setMeta("description", seo.description || page.description || "");
    setMeta("keywords", seo.keywords || "");
    setMeta("robots", previewToken ? "noindex,nofollow" : seo.robots || "index,follow");
    setMeta("og:title", seo.ogTitle || seo.title || page.name || "", "property");
    setMeta("og:description", seo.ogDescription || seo.description || page.description || "", "property");
    setMeta("og:image", seo.ogImage || "", "property");
    const canonical = getCanonicalLink();
    if (seo.canonicalUrl && !previewToken) canonical.href = safeHref(seo.canonicalUrl);
    else canonical.removeAttribute("href");
    return () => {
      document.title = previousTitle;
      for (const item of previousMeta) {
        const tag = document.head.querySelector(`meta[${item.attribute}="${item.name}"]`);
        if (!item.tag) tag?.remove();
        else if (item.content === null) tag?.removeAttribute("content");
        else tag?.setAttribute("content", item.content);
      }
      const canonicalTag = document.head.querySelector('link[rel="canonical"]');
      if (!previousCanonical) canonicalTag?.remove();
      else if (previousCanonicalUrl) canonicalTag.href = previousCanonicalUrl;
      else canonicalTag?.removeAttribute("href");
    };
  }, [page, previewToken]);

  if (loading) return <div style={{ minHeight:"100vh", display:"grid", placeItems:"center", color:"#6b5040" }}>Loading page…</div>;
  if (!page) return <main style={{ minHeight:"70vh", display:"grid", placeItems:"center", padding:24, textAlign:"center", background:"#fffaf3", color:"#4a3728" }}><div><h1 style={{ fontSize:"2rem" }}>{error || "Page not found"}</h1><Link to="/" style={{ color:"#9d6a27" }}>Return to Savitri Livings</Link></div></main>;

  const settings = page.settings || {};
  const customizations = page.customizations || {};
  const showNavbar = settings.showNavbar !== false;
  const showFooter = settings.showFooter !== false;
  const pageStyle = { minHeight:"65vh", background:settings.background || "#fffaf3", color:"#2c1f14", fontFamily:`${settings.fontFamily || "DM Sans"}, sans-serif`, paddingTop:showNavbar ? 64 : 0 };
  return <div style={pageStyle}>
    {showNavbar && <Navbar />}
    {page.sourceType === "html" ? (
      <iframe title={page.name} srcDoc={safeDocument(resolveHtml(page, htmlProducts))} sandbox="allow-top-navigation-by-user-activation" referrerPolicy="no-referrer" style={{ display:"block", width:"100%", height:"100vh", minHeight:700, border:0, background:settings.background || "#fffaf3" }}/>
    ) : (
      <main style={{ width:"100%", maxWidth:settings.fullWidth ? "none" : 1200, margin:"0 auto", padding:settings.fullWidth ? 0 : "clamp(1rem,4vw,3rem) 1rem" }}>
        {previewToken && <div role="status" style={{ marginBottom:16, padding:".6rem .8rem", borderRadius:8, background:"#fff0ce", color:"#79501d", fontSize:13 }}>Admin preview · this page is not public</div>}
        {customizeSections(page).filter((section) => section.visible !== false).map((section) => <PageSection key={section.id} section={section} slug={slug} sessionId={sessionId} addToCart={addToCart} primaryColor={settings.primaryColor || "#9d6a27"} secondaryColor={settings.secondaryColor || "#1a3c34"} productCategory={settings.productCategory}/>) }
      </main>
    )}
    {showFooter && <Footer/>}
  </div>;
}

function customizeSections(page) {
  const custom = page.customizations || {};
  let customizedTitle = false;
  let customizedDescription = false;
  let customizedCta = false;
  let customizedImage = false;
  return (page.sections || []).map((section) => {
    const next = { ...section };
    if (!customizedTitle && custom.title && ["hero", "heading", "imageText"].includes(section.type)) { next.title = custom.title; customizedTitle = true; }
    if (!customizedDescription && custom.description && ["hero", "text", "imageText"].includes(section.type)) { next.text = custom.description; customizedDescription = true; }
    if (!customizedCta && custom.ctaText && section.ctaText !== undefined) { next.ctaText = custom.ctaText; if (custom.ctaUrl) next.ctaUrl = custom.ctaUrl; customizedCta = true; }
    if (!customizedImage && custom.bannerImage && ["hero", "imageText"].includes(section.type)) { next.image = custom.bannerImage; customizedImage = true; }
    for (const key of ["title", "text", "ctaText", "ctaUrl"]) {
      if (typeof next[key] === "string") next[key] = resolveBuilderText(next[key], page);
    }
    if (section.type === "hero" && custom.offerText) next.offerText = custom.offerText;
    if (["products", "productCarousel", "collection"].includes(section.type) && !next.category) next.category = page.settings?.productCategory || "";
    return next;
  });
}

function resolveBuilderText(text, page) {
  const values = {
    "page.title": page.customizations?.title || page.seo?.title || page.name,
    "page.description": page.customizations?.description || page.description,
    "campaign.name": page.campaignName,
    "year": new Date().getFullYear(),
  };
  return text.replace(/\{\{([\w.]+)\}\}/g, (match, key) => values[key] === undefined ? match : String(values[key]));
}

function PageSection({ section, slug, sessionId, addToCart, primaryColor, secondaryColor, productCategory }) {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(["products", "productCarousel", "collection"].includes(section.type));
  const [countdown, setCountdown] = useState("");
  const title = section.title || section.heading || "";

  useEffect(() => {
    if (section.type === "form") trackEvent(slug, "form_view", sessionId, section.id);
    if (!["products", "productCarousel", "collection"].includes(section.type) && !(section.type === "button" && section.productId)) return undefined;
    let active = true;
    const limit = Math.min(24, Math.max(1, Number(section.limit) || 8));
    const productRequest = section.type === "button" ? productAPI.getOne(section.productId) : productAPI.getAll({ limit:100, ...((section.category || productCategory) ? { category:section.category || productCategory } : {}) });
    productRequest.then(({ data }) => {
        if (!active) return;
        const available = section.type === "button" ? [data.product].filter(Boolean) : data.products || [];
        const selected = Array.isArray(section.productIds) ? section.productIds : [];
        setProducts((selected.length ? available.filter((product) => selected.includes(product._id)) : available).slice(0, limit));
      })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setProductsLoading(false); });
    return () => { active = false; };
  }, [section.type, section.id, section.category, section.limit, section.productId, section.productIds, slug, sessionId]);

  useEffect(() => {
    if (section.type !== "countdown" || !section.targetDate) return undefined;
    const update = () => {
      const remaining = new Date(section.targetDate).getTime() - Date.now();
      if (!Number.isFinite(remaining) || remaining <= 0) { setCountdown("The event is here"); return; }
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [section.type, section.targetDate]);

  if (section.type === "hero") return <section style={{ position:"relative", minHeight:360, display:"grid", alignItems:"center", overflow:"hidden", background:"#4a3728", margin:section.fullBleed ? "0 calc((100vw - 100%)/-2) 1.5rem" : "0 0 1.5rem", color:"white" }}>
    {section.image && <img src={safeHref(section.image)} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:.58 }}/>}<div style={{ position:"relative", width:"min(100%,980px)", margin:"0 auto", padding:"clamp(2rem,7vw,5rem) 1.5rem" }}>{section.offerText && <p style={{ display:"inline-block", margin:"0 0 1rem", padding:".35rem .65rem", borderRadius:4, background:"rgba(255,255,255,.16)", fontWeight:600 }}>{section.offerText}</p>}<h1 style={{ maxWidth:760, fontSize:"clamp(2.3rem,6vw,4.4rem)", margin:"0 0 1rem", lineHeight:1.05 }}>{title}</h1><p style={{ maxWidth:650, fontSize:"1.05rem", lineHeight:1.75 }}>{section.text}</p><Cta section={section} product={products[0]} slug={slug} sessionId={sessionId} addToCart={addToCart} primaryColor={primaryColor}/></div>
  </section>;
  if (section.type === "heading") return <section style={{ margin:"2rem 0 1rem" }}><h2 style={{ fontSize:"clamp(1.7rem,4vw,2.5rem)", margin:0 }}>{title}</h2></section>;
  if (section.type === "text") return <section style={{ maxWidth:850, margin:"1.5rem 0", whiteSpace:"pre-wrap", lineHeight:1.8 }}>{section.text}</section>;
  if (section.type === "image") return section.image ? <figure style={{ margin:"1.5rem 0" }}><img src={safeHref(section.image)} alt={section.alt || ""} style={{ width:"100%", maxHeight:700, objectFit:"cover", borderRadius:8 }}/>{section.alt && <figcaption style={{ color:"#8c7060", fontSize:13, marginTop:6 }}>{section.alt}</figcaption>}</figure> : null;
  if (section.type === "imageText" || section.type === "custom") return <section style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,320px),1fr))", gap:28, alignItems:"center", margin:"2rem 0" }}>{section.image && <img src={safeHref(section.image)} alt="" style={{ width:"100%", maxHeight:480, objectFit:"cover", borderRadius:8 }}/>}<div><h2 style={{ fontSize:"2rem", margin:"0 0 .75rem" }}>{title}</h2><p style={{ lineHeight:1.75, whiteSpace:"pre-wrap" }}>{section.text}</p><Cta section={section} slug={slug} sessionId={sessionId} addToCart={addToCart} primaryColor={primaryColor}/></div></section>;
  if (section.type === "video") return <section style={{ margin:"2rem 0", padding:"1.25rem", background:"rgba(157,106,39,.08)", borderRadius:8 }}><h2 style={{ fontSize:"1.4rem" }}>{title || "Watch"}</h2><a href={safeHref(section.videoUrl)} target="_blank" rel="noopener noreferrer" style={{ color:primaryColor, display:"inline-flex", alignItems:"center", gap:6 }}>Open video <ExternalLink size={15}/></a></section>;
  if (section.type === "button") return <section style={{ margin:"1.5rem 0" }}><Cta section={section} product={products.find((product) => product._id === section.productId)} slug={slug} sessionId={sessionId} addToCart={addToCart} primaryColor={primaryColor}/></section>;
  if (section.type === "products") return <section style={{ margin:"2rem 0" }}><h2 style={{ fontSize:"1.8rem", marginBottom:16 }}>{title || "Shop the collection"}</h2>{productsLoading ? <p>Loading products…</p> : products.length ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,210px),1fr))", gap:14 }}>{products.map((product) => <article key={product._id} style={{ border:"1px solid #eadbc6", borderRadius:8, overflow:"hidden", background:"white" }}><Link to={`/product/${product._id}`} onClick={() => trackEvent(slug, "product_click", sessionId, section.id)} style={{ color:"inherit" }}>{product.images?.[0] ? <img src={product.images[0]} alt={product.name} style={{ width:"100%", aspectRatio:"1", objectFit:"cover" }}/> : <div style={{ aspectRatio:"1", display:"grid", placeItems:"center", color:"#8c7060" }}><ImageOff/></div>}<div style={{ padding:".8rem" }}><strong>{product.name}</strong><div style={{ marginTop:5 }}>₹{Number(product.price || 0).toLocaleString("en-IN")}</div></div></Link><button type="button" onClick={() => { addToCart(product); trackEvent(slug, "add_to_cart", sessionId, section.id); }} style={{ margin:"0 .8rem .8rem", padding:".55rem .8rem", border:0, borderRadius:6, background:primaryColor, color:"white", cursor:"pointer" }}>Add to cart</button></article>)}</div> : <p style={{ color:"#8c7060" }}>No products are available for this selection.</p>}</section>;
  if (section.type === "faq") return <section style={{ margin:"2rem 0" }}><h2 style={{ fontSize:"1.8rem" }}>{title || "Frequently asked questions"}</h2>{String(section.text || "").split("\n").filter(Boolean).map((row, index) => { const [question, answer] = row.split("|"); return <details key={`${question}-${index}`} style={{ padding:".8rem 0", borderBottom:"1px solid #eadbc6" }}><summary style={{ cursor:"pointer", fontWeight:600 }}>{question}</summary><p style={{ lineHeight:1.7, color:"#6b5040" }}>{answer || ""}</p></details>; })}</section>;
  if (section.type === "form") return <PageForm section={section} slug={slug} sessionId={sessionId} primaryColor={primaryColor}/>;
  if (["productCarousel", "collection"].includes(section.type)) return <section style={{ margin:"2rem 0" }}><h2 style={{ fontSize:"1.8rem" }}>{title || "Featured collection"}</h2><div style={{ display:"flex", gap:12, overflowX:"auto", padding:".5rem 0" }}>{products.map((product) => <Link key={product._id} to={`/product/${product._id}`} onClick={() => trackEvent(slug, "product_click", sessionId, section.id)} style={{ flex:"0 0 210px", padding:12, border:"1px solid #eadbc6", borderRadius:8, background:"white", color:"inherit" }}>{product.images?.[0] && <img src={product.images[0]} alt={product.name} style={{ width:"100%", aspectRatio:"1", objectFit:"cover" }}/>}<strong>{product.name}</strong><div>₹{Number(product.price || 0).toLocaleString("en-IN")}</div></Link>)}</div></section>;
  if (section.type === "categoryGrid") return <section style={{ margin:"2rem 0" }}><h2 style={{ fontSize:"1.8rem" }}>{title || "Explore categories"}</h2><div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:14 }}>{String(section.categories || "Jewellery\nGifts\nHome decor").split("\n").filter(Boolean).map((category) => <Link key={category} to={`/shop?category=${encodeURIComponent(category.trim())}`} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:".7rem 1rem", border:"1px solid #eadbc6", borderRadius:6, color:secondaryColor, background:"white" }}>{category.trim()}<ArrowRight size={14}/></Link>)}</div></section>;
  if (section.type === "countdown") return <section style={{ margin:"2rem 0", padding:"1.5rem", background:"rgba(157,106,39,.09)", borderRadius:8, textAlign:"center" }}><h2 style={{ fontSize:"1.6rem" }}>{title || "Coming soon"}</h2><p aria-live="polite" style={{ color:primaryColor, fontSize:"1.5rem", fontWeight:700 }}>{countdown || "Set a launch date"}</p></section>;
  if (section.type === "testimonials") return <section style={{ margin:"2rem 0" }}><h2 style={{ fontSize:"1.8rem" }}>{title || "Kind words"}</h2><div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,240px),1fr))", gap:14 }}>{String(section.text || "").split("\n").filter(Boolean).map((row, index) => { const [quote, author, detail] = row.split("|"); return <figure key={`${author}-${index}`} style={{ margin:0, padding:"1rem", borderTop:`2px solid ${primaryColor}`, background:"white" }}><blockquote style={{ margin:0, lineHeight:1.7 }}>“{quote}”</blockquote><figcaption style={{ marginTop:10, color:"#8c7060", fontSize:13 }}>{author}{detail ? ` · ${detail}` : ""}</figcaption></figure>; })}</div></section>;
  if (section.type === "socialLinks") return <section style={{ margin:"2rem 0" }}><h2 style={{ fontSize:"1.6rem" }}>{title || "Follow along"}</h2><div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>{String(section.text || "").split("\n").filter(Boolean).map((row) => { const [label, url] = row.split("|"); const href = safeHref(url); return <a key={`${label}-${url}`} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:5, color:primaryColor }}>{label || url}<ExternalLink size={13}/></a>; })}</div></section>;
  if (["whatsapp", "referral"].includes(section.type)) return <section style={{ margin:"1.5rem 0" }}><Cta section={{ ...section, action:section.type === "whatsapp" ? "whatsapp" : "link", ctaText:section.ctaText || title }} slug={slug} sessionId={sessionId} addToCart={addToCart} primaryColor={primaryColor}/></section>;
  return null;
}

function Cta({ section, product, slug, sessionId, addToCart, primaryColor }) {
  if (!section.ctaText) return null;
  const action = section.action || "link";
  const rawHref = String(section.ctaUrl || "").trim();
  const phoneNumber = rawHref.replace(/\D/g, "");
  const href = action === "whatsapp" && /^\+?[\d ()-]{7,24}$/.test(rawHref) ? `https://wa.me/${phoneNumber}` : safeHref(rawHref);
  const onClick = (event) => {
    trackEvent(slug, "cta_click", sessionId, section.id);
    if (action === "add_to_cart") {
      event.preventDefault();
      if (product) { addToCart(product); trackEvent(slug, "add_to_cart", sessionId, section.id); }
    }
  };
  if (action === "add_to_cart") return <button type="button" onClick={onClick} disabled={!product} style={{ display:"inline-flex", alignItems:"center", gap:8, marginTop:12, padding:".75rem 1.1rem", border:0, borderRadius:6, background:primaryColor, color:"white", fontWeight:600, cursor:product?"pointer":"not-allowed", opacity:product?1:.6 }}>{section.ctaText}<ArrowRight size={16}/></button>;
  return <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" onClick={onClick} style={{ display:"inline-flex", alignItems:"center", gap:8, marginTop:12, padding:".75rem 1.1rem", borderRadius:6, background:primaryColor, color:"white", fontWeight:600 }}>{section.ctaText}<ArrowRight size={16}/></a>;
}

function PageForm({ section, slug, sessionId, primaryColor }) {
  const [values, setValues] = useState({});
  const [consents, setConsents] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const { data } = await pagesAPI.submit(slug, section.id, { values, consents, sessionId });
      setMessage(data.message || section.successMessage || "Thanks, your response has been received.");
      if (data.redirectUrl) window.location.assign(safeHref(data.redirectUrl));
    } catch (submitError) { setError(submitError.response?.data?.message || "Your response could not be submitted. Please try again."); }
    finally { setBusy(false); }
  };
  return <section style={{ maxWidth:640, margin:"2rem auto", padding:"clamp(1rem,4vw,2rem)", border:"1px solid #eadbc6", borderRadius:8, background:"white" }}><h2 style={{ fontSize:"1.8rem", marginTop:0 }}>{section.title || "Get in touch"}</h2>
    {message ? <p role="status">{message}</p> : <form onSubmit={submit} style={{ display:"grid", gap:12 }}>
      {(section.fields || []).map((field) => <FormField key={field.name} field={field} value={values[field.name]} onChange={(value) => setValues((previous) => ({ ...previous, [field.name]:value }))}/>)}
      {(section.consents || []).map((consent) => <label key={consent.type} style={{ display:"flex", alignItems:"start", gap:8, fontSize:13, lineHeight:1.5, color:"#6b5040" }}><input type="checkbox" required={consent.required} checked={Boolean(consents[consent.type])} onChange={(event) => setConsents((previous) => ({ ...previous, [consent.type]:event.target.checked }))}/>{consent.label}</label>)}
      {error && <p role="alert" style={{ color:"#9b2c1c", margin:0 }}>{error}</p>}<button type="submit" disabled={busy} style={{ justifySelf:"start", padding:".7rem 1rem", border:0, borderRadius:6, color:"white", background:primaryColor, cursor:busy?"wait":"pointer" }}>{busy ? "Submitting…" : section.submitText || "Submit"}</button>
    </form>}
  </section>;
}

function FormField({ field, value, onChange }) {
  const options = String(field.options || "").split("\n").map((option) => option.trim()).filter(Boolean);
  return <label style={{ display:"grid", gap:5, fontSize:14 }}>{field.label || field.name}
    {field.type === "textarea" ? <textarea required={field.required} value={value || ""} onChange={(event) => onChange(event.target.value)} style={formControl} rows={4}/> : null}
    {field.type === "select" ? <select required={field.required} value={value || ""} onChange={(event) => onChange(event.target.value)} style={formControl}><option value="">Choose an option</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : null}
    {field.type === "radio" ? <span style={{ display:"grid", gap:6 }}>{options.map((option) => <label key={option} style={{ display:"flex", alignItems:"center", gap:7 }}><input type="radio" name={field.name} required={field.required} checked={value === option} onChange={() => onChange(option)}/>{option}</label>)}</span> : null}
    {field.type === "checkbox" ? <span style={{ display:"flex", alignItems:"center", gap:7 }}><input type="checkbox" required={field.required} checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)}/> Yes</span> : null}
    {["text", "email", "tel"].includes(field.type) ? <input required={field.required} type={field.type} value={value || ""} onChange={(event) => onChange(event.target.value)} style={formControl}/> : null}
  </label>;
}

function setMeta(name, content, attribute = "name") {
  let tag = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!tag) { tag = document.createElement("meta"); tag.setAttribute(attribute, name); document.head.appendChild(tag); }
  tag.setAttribute("content", content);
}

function getCanonicalLink() {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
  return link;
}

const formControl = { width:"100%", padding:".7rem .75rem", border:"1px solid #d9cbb9", borderRadius:6, font:"inherit", color:"#2c1f14", background:"white" };