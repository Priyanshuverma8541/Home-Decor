import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { savinexaAPI } from "../../services/savinexaApi";

const formatPrice = (price = 0, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);

export default function SavinexaHome() {
  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    savinexaAPI.getHome()
      .then((res) => setHome(res.data.home))
      .catch((err) => console.error("Savinexa home error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "2rem", color: "#5f4637" }}>Loading Savinexa...</div>;
  if (!home) return <div style={{ padding: "2rem", color: "#5f4637" }}>Unable to load Savinexa content.</div>;

  const { settings, featuredProducts = [], categories = [], collections = [], banners = [] } = home;

  return (
    <div style={{ background: "#f9f5f1", minHeight: "100vh", color: "#1f2937" }}>
      <section style={{
        background: "linear-gradient(135deg, rgba(16,24,40,0.96), rgba(89,77,55,0.82)), url('https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80') center/cover",
        color: "#fff",
        padding: "4rem 1.2rem 3rem",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ textTransform: "uppercase", letterSpacing: 4, fontSize: 12, opacity: 0.8 }}>Premium lifestyle collection</p>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 1.05, marginBottom: 18, maxWidth: 700, fontWeight: 800 }}>
            {settings?.siteName || "Savinexa"}
          </h1>
          <p style={{ maxWidth: 640, fontSize: 18, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>
            Curated essentials, elevated living, and product experiences designed for modern homes and premium lifestyles.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
            <Link to="/savinexa/products" style={{ background: settings?.secondaryColor || "#facc15", color: "#111827", padding: "0.9rem 1.4rem", borderRadius: 999, textDecoration: "none", fontWeight: 700 }}>
              Explore collection
            </Link>
            <Link to="/shop" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", padding: "0.9rem 1.4rem", borderRadius: 999, textDecoration: "none", fontWeight: 700 }}>
              Shop Savitri Livings
            </Link>
          </div>
        </div>
      </section>

      {banners.length > 0 && (
        <section style={{ maxWidth: 1200, margin: "-1rem auto 1.5rem", padding: "0 1rem" }}>
          {banners.map((banner) => (
            <div key={banner._id} style={{ background: "#fff", borderRadius: 24, padding: 18, boxShadow: "0 18px 45px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#9a7d5b" }}>{banner.placement}</p>
                  <h3 style={{ margin: "8px 0 0", fontSize: 26 }}>{banner.title}</h3>
                  <p style={{ marginTop: 6, color: "#5b4a3d" }}>{banner.subtitle}</p>
                </div>
                {banner.ctaText && banner.ctaUrl && (
                  <a href={banner.ctaUrl} style={{ alignSelf: "center", textDecoration: "none", padding: "0.8rem 1.2rem", borderRadius: 999, background: settings?.secondaryColor || "#facc15", color: "#111827", fontWeight: 700 }}>
                    {banner.ctaText}
                  </a>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontSize: 32, margin: 0 }}>Featured products</h2>
          <Link to="/savinexa/products" style={{ color: "#1f2937", textDecoration: "none", fontWeight: 600 }}>View all</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
          {featuredProducts.map((product) => (
            <Link key={product._id} to={`/savinexa/product/${product.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <article style={{ background: "#fff", borderRadius: 22, overflow: "hidden", boxShadow: "0 20px 45px rgba(0,0,0,0.05)" }}>
                <img src={product.images?.[0] || "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80"} alt={product.name} style={{ width: "100%", height: 220, objectFit: "cover" }} />
                <div style={{ padding: 18 }}>
                  <p style={{ color: "#8b5e3c", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.8 }}>{product.category}</p>
                  <h3 style={{ margin: "8px 0 10px", fontSize: 20 }}>{product.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                    <div>
                      <strong>{formatPrice(product.salePrice || product.price, product.currency || "INR")}</strong>
                      {product.salePrice && product.salePrice < product.price && <span style={{ color: "#8b5e3c", textDecoration: "line-through", marginLeft: 8 }}>{formatPrice(product.price, product.currency || "INR")}</span>}
                    </div>
                    {product.discount ? <span style={{ background: "#fff7d6", color: "#9b6a00", padding: "4px 8px", borderRadius: 999, fontSize: 12 }}>{product.discount}% off</span> : null}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "1rem 1rem 2rem" }}>
        <h2 style={{ fontSize: 32, marginBottom: 18 }}>Shop by category</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 18 }}>
          {categories.map((category) => (
            <Link key={category._id} to={`/savinexa/products?category=${encodeURIComponent(category.slug)}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 18px 40px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 32 }}>{category.icon || "✦"}</div>
                <h3 style={{ marginTop: 12, marginBottom: 4 }}>{category.name}</h3>
                <p style={{ margin: 0, color: "#6b7280" }}>{category.description || "Curated lifestyle picks"}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1rem 3rem" }}>
        <h2 style={{ fontSize: 32, marginBottom: 18 }}>Collections</h2>
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {collections.map((collection) => (
            <div key={collection._id} style={{ background: "#fff", borderRadius: 22, padding: 18, boxShadow: "0 18px 40px rgba(0,0,0,0.04)" }}>
              <h3>{collection.name}</h3>
              <p style={{ color: "#6b7280" }}>{collection.description}</p>
              <Link to={`/savinexa/collection/${collection.slug}`} style={{ color: "#1f2937", fontWeight: 700, textDecoration: "none" }}>View collection →</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
