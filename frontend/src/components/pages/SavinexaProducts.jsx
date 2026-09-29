import { useEffect, useState } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { savinexaAPI } from "../../services/savinexaApi";

const formatPrice = (price = 0, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);

export default function SavinexaProducts() {
  const [searchParams] = useSearchParams();
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get("category") || slug || "");

  useEffect(() => {
    const resolvedCategory = searchParams.get("category") || slug || "";
    setCategory(resolvedCategory);
    const params = { limit: 24 };
    if (resolvedCategory) params.category = resolvedCategory;
    savinexaAPI.getProducts(params)
      .then((res) => setProducts(res.data.products || []))
      .catch((err) => console.error("Savinexa products error:", err))
      .finally(() => setLoading(false));
  }, [searchParams, slug]);

  if (loading) return <div style={{ padding: "2rem" }}>Loading products…</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <p style={{ letterSpacing: 3, textTransform: "uppercase", fontSize: 12, color: "#8b5e3c" }}>Savinexa</p>
          <h1 style={{ margin: "8px 0 0", fontSize: 38 }}>Products</h1>
        </div>
        {category && <span style={{ background: "#fff7d6", color: "#8a5a00", padding: "8px 12px", borderRadius: 999 }}>{category}</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
        {products.map((product) => (
          <Link key={product._id} to={`/savinexa/product/${product.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
            <article style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 18px 40px rgba(0,0,0,0.04)" }}>
              <img src={product.images?.[0] || "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80"} alt={product.name} style={{ width: "100%", height: 220, objectFit: "cover" }} />
              <div style={{ padding: 18 }}>
                <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1.6, color: "#8b5e3c" }}>{product.category}</p>
                <h3 style={{ margin: "10px 0 8px" }}>{product.name}</h3>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <strong>{formatPrice(product.salePrice || product.price, product.currency || "INR")}</strong>
                  {product.discount ? <span style={{ background: "#fff7d6", color: "#8a5a00", borderRadius: 999, padding: "4px 8px", fontSize: 12 }}>{product.discount}% off</span> : null}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {!products.length && (
        <div style={{ background: "#fff", borderRadius: 20, padding: 28, textAlign: "center", marginTop: 18 }}>
          No products are available in this category yet.
        </div>
      )}
    </div>
  );
}
