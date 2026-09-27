import { useEffect, useState } from "react";
import { Download, RefreshCw, Search, ShieldCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { privacyAPI } from "../../services/api.js";
import { Button, EmptyState, PageLoader } from "../ui/index.jsx";

const STATUSES = ["consented", "denied", "granted", "not-granted", "unsupported"];
const dateTime = (value) => value ? new Date(value).toLocaleString("en-IN") : "—";
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function PrivacyDataCenter() {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: "", capability: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadSummary = async () => {
    try {
      const { data } = await privacyAPI.summary();
      setSummary(data.summary);
    } catch {
      toast.error("Could not load privacy summary");
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const { data } = await privacyAPI.consents({ ...filters, page: pagination.page, limit: 25 });
      setRecords(data.records || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      toast.error("Could not load privacy records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSummary(); }, []);
  useEffect(() => { loadRecords(); }, [filters, pagination.page]);

  const setFilter = (key, value) => {
    setPagination((current) => ({ ...current, page: 1 }));
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const removeRecord = async (record) => {
    if (!window.confirm("Permanently delete this privacy-consent record and its history? This does not delete the customer account.")) return;
    try {
      await privacyAPI.removeConsent(record._id);
      toast.success("Privacy record deleted");
      await Promise.all([loadSummary(), loadRecords()]);
    } catch {
      toast.error("Could not delete privacy record");
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const exported = [];
      const first = await privacyAPI.consents({ ...filters, page: 1, limit: 100 });
      exported.push(...(first.data.records || []));
      const pages = Math.min(first.data.pagination?.pages || 1, 100);
      for (let page = 2; page <= pages; page += 1) {
        const { data } = await privacyAPI.consents({ ...filters, page, limit: 100 });
        exported.push(...(data.records || []));
      }
      const lines = [["Subject ID", "Customer", "Email", "Capability", "Decision", "Decision time", "Last seen"]];
      exported.forEach((record) => {
        (record.decisions || []).forEach((decision) => lines.push([
          record.subjectId,
          record.userId?.fullName || "Guest browser",
          record.userId?.email || "",
          decision.label || decision.key,
          decision.status,
          dateTime(decision.decidedAt),
          dateTime(record.lastSeenAt),
        ]));
      });
      const csv = lines.map((line) => line.map(csvCell).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `savitri-privacy-consents-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("CSV export failed");
    } finally {
      setExporting(false);
    }
  };

  if (loading && !summary && records.length === 0) return <PageLoader />;

  const capabilityStats = summary?.decisionStats || [];
  const capabilities = [...new Map(capabilityStats.map((item) => [item._id.key, item._id.label || item._id.key]))];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <div>
          <p className="section-tag">Customer privacy</p>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", color: "#2c1f14" }}>Privacy Data Center</h1>
          <p style={{ color: "#8c7060", fontSize: ".82rem", marginTop: 4 }}>Consent choices and audit history only. No camera, microphone, precise location, contacts, or clipboard contents are stored.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" onClick={() => Promise.all([loadSummary(), loadRecords()])}><RefreshCw size={14} />Refresh</Button>
          <Button variant="clay" onClick={exportCsv} loading={exporting}><Download size={14} />Export CSV</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: "1.25rem" }}>
        <div className="card" style={{ padding: "1rem" }}><p className="section-tag">Browser records</p><strong style={{ fontSize: "1.5rem", color: "#2c1f14" }}>{summary?.subjects ?? "—"}</strong></div>
        {STATUSES.slice(0, 3).map((status) => {
          const count = capabilityStats.filter((item) => item._id.status === status).reduce((total, item) => total + item.count, 0);
          return <div className="card" key={status} style={{ padding: "1rem" }}><p className="section-tag" style={{ textTransform: "capitalize" }}>{status === "consented" ? "Allowed" : status}</p><strong style={{ fontSize: "1.5rem", color: "#2c1f14" }}>{count}</strong></div>;
        })}
      </div>

      <div className="card" style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "1rem", marginBottom: "1rem" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 12, color: "#8c7060" }} />
          <input className="input" style={{ paddingLeft: 32 }} placeholder="Search customer or browser ID" value={filters.search} onChange={(event) => setFilter("search", event.target.value)} />
        </div>
        <select className="input" style={{ width: "auto" }} value={filters.capability} onChange={(event) => setFilter("capability", event.target.value)}>
          <option value="">All capabilities</option>
          {capabilities.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <select className="input" style={{ width: "auto" }} value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
          <option value="">All decisions</option>
          {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      {loading ? <PageLoader /> : records.length === 0 ? (
        <EmptyState title="No consent records" message="Customer choices appear here after they make a selection in the frontend Permission Center." />
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760, fontSize: ".82rem" }}>
              <thead><tr style={{ background: "#fdf8f2", textAlign: "left", color: "#8c7060" }}>
                {["Customer / browser", "Choices", "Last activity", "Record"].map((heading) => <th key={heading} style={{ padding: ".75rem", fontWeight: 600 }}>{heading}</th>)}
              </tr></thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id} style={{ borderTop: "1px solid #f0e8e0", verticalAlign: "top" }}>
                    <td style={{ padding: ".85rem .75rem", color: "#2c1f14" }}>
                      <strong>{record.userId?.fullName || "Guest browser"}</strong>
                      {record.userId?.email && <div style={{ color: "#8c7060", marginTop: 3 }}>{record.userId.email}</div>}
                      <code style={{ display: "block", color: "#8c7060", fontSize: ".68rem", marginTop: 5 }}>{record.subjectId}</code>
                    </td>
                    <td style={{ padding: ".85rem .75rem", minWidth: 260 }}>
                      <details>
                        <summary style={{ cursor: "pointer", color: "#765027", fontWeight: 600 }}>{record.decisions?.length || 0} capabilities · {record.history?.length || 0} changes</summary>
                        <div style={{ display: "grid", gap: 5, marginTop: 8 }}>
                          {record.decisions?.map((decision) => <div key={decision.key} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span>{decision.label || decision.key}</span><span style={{ color: decision.status === "denied" ? "#9b2c1c" : "#166534", textTransform: "capitalize" }}>{decision.status}</span></div>)}
                        </div>
                        {record.history?.length > 0 && <p style={{ color: "#8c7060", fontSize: ".72rem", marginTop: 8 }}>Latest decision: {dateTime(record.history.at(-1).decidedAt)}</p>}
                      </details>
                    </td>
                    <td style={{ padding: ".85rem .75rem", whiteSpace: "nowrap", color: "#6b5040" }}>{dateTime(record.lastSeenAt)}</td>
                    <td style={{ padding: ".65rem .75rem" }}><button type="button" title="Delete privacy record" aria-label="Delete privacy record" onClick={() => removeRecord(record)} style={{ width: 34, height: 34, border: "1px solid #efd4ce", background: "#fff7f5", color: "#9b2c1c", borderRadius: 8, cursor: "pointer" }}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: ".75rem 1rem", borderTop: "1px solid #f0e8e0", color: "#8c7060", fontSize: ".8rem" }}>
            <span>{pagination.total} records</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button type="button" className="btn-ghost" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Previous</button>
              <span>{pagination.page} / {pagination.pages || 1}</span>
              <button type="button" className="btn-ghost" disabled={pagination.page >= pagination.pages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Next</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, color: "#8c7060", fontSize: ".75rem" }}><ShieldCheck size={14} /> Access is restricted to authenticated administrators. Deleting here removes only consent records, not customer accounts or orders.</div>
    </div>
  );
}
