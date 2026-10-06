import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { savinexaAPI } from "../../services/savinexaApi.js";

const formatPrice = (price = 0, currency = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
const target = (url) => typeof url === "string" && url.startsWith("/") && !url.startsWith("//");
const imageFallback = "";

export default function SavinexaHome() {
  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; savinexaAPI.getHome().then((res) => { if (active) setHome(res.data.home); }).catch((err) => console.error("Savinexa home error:", err)).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  if (loading) return <div style={{ padding: "2rem" }}>Loading Savinexa…</div>;
  if (!home) return <div style={{ padding: "2rem" }}>Unable to load Savinexa content.</div>;

  const { settings = {}, featuredProducts = [], categories = [], collections = [], banners = [] } = home;
  const hero = settings.hero || {};
  const sections = settings.homeSections || {};
  const radius = settings.borderRadius || "18px";
  const accent = settings.secondaryColor || "#eab308";
  const primary = settings.primaryColor || "#1f2937";
  const renderLink = (url, label, style) => target(url)
    ? <Link to={url} style={style}>{label}</Link>
    : <a href={url || "/"} style={style}>{label}</a>;

  return <div style={{ minHeight: "100%", background: settings.background || "#f8fafc", color: primary, fontFamily: `"${settings.typography || "Inter"}", sans-serif` }}>
    <section style={{ position: "relative", isolation: "isolate", minHeight: "clamp(420px, 58vw, 650px)", padding: "80px 22px", color: "#fff", display: "grid", alignItems: "center", overflow: "hidden", background: primary }}>
      {hero.image && <picture style={{ position: "absolute", inset: 0, zIndex: -2 }}><source media="(max-width:700px)" srcSet={hero.mobileImage || hero.image}/><img src={hero.image} alt="" fetchPriority="high" style={{ width: "100%", height: "100%", objectFit: "cover" }}/></picture>}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: -1, background: `linear-gradient(110deg, ${hero.overlayColor || "#101828"}d9 0%, ${hero.overlayColor || "#101828"}77 58%, transparent 100%)`, opacity: hero.overlayOpacity ?? 0.72 }}/>
      <div style={{ width: "min(1200px,100%)", margin: "auto" }}>
        {hero.eyebrow && <p style={{ textTransform: "uppercase", letterSpacing: 4, fontSize: 12, opacity: .83 }}>{hero.eyebrow}</p>}
        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 1.05, margin: "18px 0", maxWidth: 760, fontWeight: 800 }}>{hero.title || settings.siteName || "Savinexa"}</h1>
        {hero.subtitle && <p style={{ maxWidth: 640, fontSize: 18, lineHeight: 1.65, color: "rgba(255,255,255,.84)" }}>{hero.subtitle}</p>}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          {renderLink(hero.primaryCtaUrl || "/savinexa/products", hero.primaryCtaLabel || "Explore collection", { background: accent, color: primary, padding: "0.9rem 1.4rem", borderRadius: 999, textDecoration: "none", fontWeight: 700 })}
          {renderLink(hero.secondaryCtaUrl || "/shop", hero.secondaryCtaLabel || "Shop Savitri Livings", { background: "transparent", border: "1px solid rgba(255,255,255,.55)", color: "#fff", padding: "0.9rem 1.4rem", borderRadius: 999, textDecoration: "none", fontWeight: 700 })}
        </div>
      </div>
    </section>

    {banners.length > 0 && <section style={{ maxWidth: 1200, margin: "-22px auto 18px", padding: "0 18px", display: "grid", gap: 14, position: "relative" }}>
      {banners.map((banner) => <article key={banner._id} style={{ position: "relative", overflow: "hidden", minHeight: banner.desktopImage ? 220 : 0, background: "white", borderRadius: radius, boxShadow: "0 18px 45px rgba(0,0,0,.08)" }}>
        {(banner.desktopImage || banner.mobileImage) && <picture style={{ position: "absolute", inset: 0 }}><source media="(max-width:700px)" srcSet={banner.mobileImage || banner.desktopImage}/><img src={banner.desktopImage || banner.mobileImage} alt="" style={{ width: "100%", height: "100%", minHeight: 220, objectFit: "cover" }}/></picture>}
        <div style={{ position: "relative", minHeight: 220, padding: 24, display: "flex", flexDirection: "column", justifyContent: "end", background: banner.desktopImage || banner.mobileImage ? "linear-gradient(0deg,rgba(0,0,0,.72),rgba(0,0,0,.08))" : "transparent", color: banner.desktopImage || banner.mobileImage ? "white" : primary }}>
          <p style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", opacity: .8 }}>{banner.placement}</p><h2 style={{ margin: "8px 0 0", fontSize: 26 }}>{banner.title}</h2><p style={{ margin: "6px 0 0" }}>{banner.subtitle}</p>
          {banner.ctaText && banner.ctaUrl && renderLink(banner.ctaUrl, banner.ctaText, { alignSelf: "start", marginTop: 14, textDecoration: "none", padding: ".8rem 1.2rem", borderRadius: 999, background: accent, color: primary, fontWeight: 700 })}
        </div>
      </article>)}
    </section>}

    {sections.featuredProducts?.enabled !== false && <section style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18 }}><h2 style={{ fontSize: 32, margin: 0 }}>{sections.featuredProducts?.title || "Featured products"}</h2>{renderLink("/savinexa/products", "View all", { color: primary, textDecoration: "none", fontWeight: 600 })}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
        {featuredProducts.map((product) => <Link key={product._id} to={`/savinexa/product/${product.slug}`} style={{ textDecoration: "none", color: "inherit" }}><article style={{ height: "100%", background: "#fff", borderRadius: radius, overflow: "hidden", boxShadow: "0 20px 45px rgba(0,0,0,.05)" }}><img src={product.images?.[0] || product.thumbnail || imageFallback} alt={product.name} loading="lazy" style={{ width: "100%", height: 240, objectFit: "cover", background: "#f1eee9" }}/><div style={{ padding: 18 }}><p style={{ color: accent, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.8 }}>{product.category}</p><h3 style={{ margin: "8px 0 10px", fontSize: 20 }}>{product.name}</h3><strong>{formatPrice(product.salePrice || product.price, product.currency || settings.commerce?.currency || "INR")}</strong></div></article></Link>)}
      </div>
      {!featuredProducts.length && <p style={{ color: "#6b7280" }}>Featured products will appear here when they are published in Admin.</p>}
    </section>}

    {sections.categories?.enabled !== false && categories.length > 0 && <section style={{ maxWidth: 1200, margin: "0 auto", padding: "25px 18px" }}><h2 style={{ fontSize: 32, marginBottom: 18 }}>{sections.categories?.title || "Shop by category"}</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>{categories.map((category) => <Link key={category._id} to={`/savinexa/products?category=${encodeURIComponent(category.slug)}`} style={{ textDecoration: "none", color: "inherit" }}><article style={{ position: "relative", minHeight: 180, display: "flex", alignItems: "end", overflow: "hidden", borderRadius: radius, background: primary, color: "white" }}>{category.image && <img src={category.image} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .72 }}/>}<div style={{ position: "relative", padding: 18 }}><h3 style={{ margin: 0 }}>{category.name}</h3><p style={{ margin: "6px 0 0", opacity: .82 }}>{category.description || "Explore the collection"}</p></div></article></Link>)}</div></section>}

    {sections.collections?.enabled !== false && collections.length > 0 && <section style={{ maxWidth: 1200, margin: "0 auto", padding: "35px 18px 55px" }}><h2 style={{ fontSize: 32, marginBottom: 18 }}>{sections.collections?.title || "Collections"}</h2><div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>{collections.map((collection) => <article key={collection._id} style={{ background: "#fff", borderRadius: radius, overflow: "hidden", boxShadow: "0 18px 40px rgba(0,0,0,.04)" }}>{collection.image && <img src={collection.image} alt="" loading="lazy" style={{ width: "100%", height: 200, objectFit: "cover" }}/>}<div style={{ padding: 18 }}><h3>{collection.name}</h3><p style={{ color: "#6b7280" }}>{collection.description}</p>{renderLink(`/savinexa/collection/${collection.slug}`, "View collection →", { color: primary, fontWeight: 700, textDecoration: "none" })}</div></article>)}</div></section>}
  </div>;
}