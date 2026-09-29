import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { savinexaAPI } from "../../services/savinexaApi";

const formatPrice = (price = 0, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);

export default function SavinexaProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    savinexaAPI.getProductBySlug(slug)
      .then((res) => setProduct(res.data.product))
      .catch((err) => console.error("Savinexa detail error:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={{ padding: "2rem" }}>Loading product…</div>;
  if (!product) return <div style={{ padding: "2rem" }}>Product not found.</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <Link to="/savinexa/products" style={{ color: "#1f2937", textDecoration: "none", display: "inline-block", marginBottom: 18 }}>← Back to products</Link>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 30 }}>
        <div>
          <img src={product.images?.[0] || "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80"} alt={product.name} style={{ width: "100%", borderRadius: 24, boxShadow: "0 18px 48px rgba(0,0,0,0.08)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12, marginTop: 14 }}>
            {(product.images || []).slice(0, 4).map((img, index) => (
              <img key={index} src={img} alt={`${product.name}-${index + 1}`} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 12 }} />
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 18px 48px rgba(0,0,0,0.06)" }}>
          <p style={{ margin: 0, color: "#8b5e3c", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>{product.category}</p>
          <h1 style={{ margin: "10px 0 12px", fontSize: 38 }}>{product.name}</h1>
          <p style={{ color: "#4b5563", lineHeight: 1.7 }}>{product.shortDescription || product.description}</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 18, marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 32 }}>{formatPrice(product.salePrice || product.price, product.currency || "INR")}</h2>
            {product.salePrice && product.salePrice < product.price && <span style={{ color: "#8b5e3c", textDecoration: "line-through" }}>{formatPrice(product.price, product.currency || "INR")}</span>}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 999, padding: "0.9rem 1.4rem", cursor: "pointer", fontWeight: 700 }}>Add to cart</button>
            <button style={{ background: "#facc15", color: "#111827", border: "none", borderRadius: 999, padding: "0.9rem 1.4rem", cursor: "pointer", fontWeight: 700 }}>Buy now</button>
          </div>

          <ul style={{ marginTop: 20, paddingLeft: 18, color: "#374151", lineHeight: 1.8 }}>
            <li>SKU: {product.sku || "N/A"}</li>
            <li>Status: {product.inventory?.status || "in stock"}</li>
            <li>Tags: {(product.tags || []).join(", ") || "General"}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
