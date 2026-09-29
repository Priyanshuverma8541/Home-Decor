import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { savinexaAPI } from "../../services/api.js";

const statCardStyle = {
  background: "#fff",
  border: "1px solid #f0e8e0",
  borderRadius: 18,
  padding: "1.1rem 1rem",
  boxShadow: "0 8px 24px rgba(44,31,20,0.04)",
};

export default function Savinexa() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    savinexaAPI.dashboard()
      .then((res) => setDashboard(res.data.dashboard))
      .catch((err) => console.error("Savinexa dashboard error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 20, color: "#7b5e46" }}>Loading Savinexa dashboard...</div>;

  const totals = dashboard?.totals || {};

  return (
    <div style={{ padding: 20 }}>
      <p className="section-tag">Savinexa</p>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.8rem", color: "#2c1f14", margin: "0 0 1rem" }}>Savinexa Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <div style={statCardStyle}><p style={{ color: "#8c7060", margin: 0 }}>Products</p><h2 style={{ margin: "8px 0 0", color: "#2c1f14" }}>{totals.products || 0}</h2></div>
        <div style={statCardStyle}><p style={{ color: "#8c7060", margin: 0 }}>Categories</p><h2 style={{ margin: "8px 0 0", color: "#2c1f14" }}>{totals.categories || 0}</h2></div>
        <div style={statCardStyle}><p style={{ color: "#8c7060", margin: 0 }}>Collections</p><h2 style={{ margin: "8px 0 0", color: "#2c1f14" }}>{totals.collections || 0}</h2></div>
        <div style={statCardStyle}><p style={{ color: "#8c7060", margin: 0 }}>Campaigns</p><h2 style={{ margin: "8px 0 0", color: "#2c1f14" }}>{totals.campaigns || 0}</h2></div>
      </div>

      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
        <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f0e8e0", padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#2c1f14" }}>Top products</h2>
            <Link to="/products" style={{ color: "#c96030", textDecoration: "none" }}>Manage products</Link>
          </div>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {(dashboard?.topProducts || []).map((product) => (
              <div key={product._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f5efe9", paddingBottom: 8 }}>
                <span style={{ fontWeight: 600, color: "#2c1f14" }}>{product.name}</span>
                <span style={{ color: "#8c7060" }}>{product.active ? "Active" : "Draft"}</span>
              </div>
            ))}
            {!(dashboard?.topProducts || []).length && <p style={{ color: "#8c7060", margin: 0 }}>No Savinexa products yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
