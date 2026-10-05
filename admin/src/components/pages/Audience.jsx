import { useEffect, useMemo, useState } from "react";
import { audienceAPI } from "../../services/api.js";

const card = { background: "#fff", border: "1px solid #f0e8e0", borderRadius: 16, padding: 18 };
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function Audience() {
  const [data, setData] = useState({ contacts: [], totals: {} });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const refresh = () => audienceAPI.getAll().then(({ data: result }) => setData(result)).catch((err) => setError(err.response?.data?.message || "Audience data could not be loaded.")).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);
  const contacts = useMemo(() => data.contacts.filter((item) => {
    const matches = `${item.name} ${item.email} ${item.phone} ${item.city}`.toLowerCase().includes(query.toLowerCase());
    const filtered = filter === "all" || (filter === "subscribed" ? item.pushStatus === "subscribed" : filter === "customers" ? item.orderCount > 0 : item.leadStatuses.length > 0);
    return matches && filtered;
  }), [data.contacts, query, filter]);

  return <div style={{ display: "grid", gap: 18 }}>
    <header><p className="section-tag">Customer 360</p><h1 style={{ margin: "0 0 5px", color: "#2c1f14" }}>Unified audience</h1><p style={{ margin: 0, color: "#8c7060" }}>One view across customer accounts, guest orders, enquiries and notification opt-ins.</p></header>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
      {[["Unified profiles", data.totals.contacts], ["Customer accounts", data.totals.customers], ["Leads", data.totals.leads], ["Push opt-ins", data.totals.pushSubscribers]].map(([label, value]) => <div key={label} style={card}><div style={{ color: "#8c7060", fontSize: 13 }}>{label}</div><strong style={{ display: "block", marginTop: 8, color: "#2c1f14", fontSize: 25 }}>{value ?? "—"}</strong></div>)}
    </div>
    <div style={{ ...card, background: "#fffaf3", color: "#715535", fontSize: 13, lineHeight: 1.55 }}>Profiles are matched using an existing account ID, or an exact email/phone match when available. Anonymous browser subscriptions stay anonymous. This page does not collect location, contacts, or hidden device identifiers.</div>
    <section style={{ ...card, padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: 16, borderBottom: "1px solid #f0e8e0" }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone or city" aria-label="Search audience" style={{ flex: "1 1 240px", minWidth: 0, padding: 10, border: "1px solid #e4d8ca", borderRadius: 9 }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter audience" style={{ padding: 10, border: "1px solid #e4d8ca", borderRadius: 9, background: "white" }}><option value="all">Everyone</option><option value="customers">Customers</option><option value="leads">Leads</option><option value="subscribed">Push subscribers</option></select>
        <button onClick={() => { setLoading(true); setError(""); refresh(); }} style={{ border: 0, borderRadius: 9, padding: "0 15px", background: "#2c1f14", color: "white", cursor: "pointer" }}>Refresh</button>
      </div>
      {loading ? <p style={{ padding: 20, color: "#8c7060" }}>Loading audience…</p> : error ? <p role="alert" style={{ padding: 20, color: "#a33" }}>{error}</p> : contacts.length === 0 ? <p style={{ padding: 20, color: "#8c7060" }}>No profiles match this view yet.</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}><thead><tr>{["Contact", "Location", "Orders", "Lifetime value", "Lead", "Notifications", "Sources"].map((title) => <th key={title} style={{ textAlign: "left", padding: "12px 14px", background: "#fcf8f3", color: "#84694f", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</th>)}</tr></thead><tbody>{contacts.map((item) => <tr key={item.id} style={{ borderTop: "1px solid #f3ece5" }}><td style={{ padding: "13px 14px" }}><strong style={{ display: "block", color: "#362719" }}>{item.name || "Guest / anonymous"}</strong><small style={{ color: "#8c7060" }}>{item.email || item.phone || "No contact detail"}</small></td><td style={{ padding: "13px 14px", color: "#715f4c" }}>{item.city || "—"}</td><td style={{ padding: "13px 14px" }}>{item.orderCount}</td><td style={{ padding: "13px 14px" }}>{money(item.lifetimeValue)}</td><td style={{ padding: "13px 14px" }}>{item.leadStatuses.join(", ") || "—"}</td><td style={{ padding: "13px 14px" }}>{item.pushStatus}</td><td style={{ padding: "13px 14px" }}>{item.sources.join(", ") || "—"}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
