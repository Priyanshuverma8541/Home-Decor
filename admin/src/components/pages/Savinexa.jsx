import { useCallback, useEffect, useState } from "react";
import { savinexaAPI } from "../../services/api.js";

const box = { background: "white", border: "1px solid #f0e8e0", borderRadius: 16, padding: 18 };
const initial = { title: "", department: "", location: "", employmentType: "Full-time", description: "", applicationEmail: "", status: "draft" };

export default function Savinexa() {
  const [data, setData] = useState({ jobs: [], enquiries: [] });
  const [form, setForm] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const refresh = useCallback(() => savinexaAPI.talent().then(({ data: result }) => setData(result)).catch((err) => setError(err.response?.data?.message || "SaviNexa hiring data could not be loaded.")).finally(() => setLoading(false)), []);
  useEffect(() => { refresh(); }, [refresh]);
  const saveJob = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try { await savinexaAPI.createJob(form); setForm(initial); setShowForm(false); await refresh(); }
    catch (err) { setError(err.response?.data?.message || "Role could not be saved."); }
    finally { setSaving(false); }
  };
  const setJobStatus = async (job, status) => { try { await savinexaAPI.updateJob(job._id, { status }); await refresh(); } catch (err) { setError(err.response?.data?.message || "Role status could not be updated."); } };
  const setEnquiryStatus = async (item, status) => { try { await savinexaAPI.updateEnquiry(item._id, { status }); await refresh(); } catch (err) { setError(err.response?.data?.message || "Enquiry status could not be updated."); } };
  if (loading) return <p style={{ color: "#7b5e46" }}>Loading SaviNexa hiring workspace…</p>;

  return <div style={{ display: "grid", gap: 18 }}>
    <header><p className="section-tag">Talent consultancy</p><h1 style={{ margin: "0 0 5px", color: "#2c1f14" }}>SaviNexa hiring workspace</h1><p style={{ margin: 0, color: "#8c7060" }}>Manage careers roles and review candidate or client enquiries. This workspace is separate from Savitri Livings product commerce.</p></header>
    {error && <div role="alert" style={{ ...box, color: "#a33", background: "#fff7f5" }}>{error}</div>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
      {[["Total roles", data.jobs.length], ["Published roles", data.jobs.filter((j) => j.status === "published").length], ["New enquiries", data.enquiries.filter((e) => e.status === "new").length], ["All enquiries", data.enquiries.length]].map(([label, value]) => <div key={label} style={box}><span style={{ color: "#8c7060" }}>{label}</span><strong style={{ display: "block", marginTop: 8, color: "#2c1f14", fontSize: 26 }}>{value}</strong></div>)}
    </div>
    <section style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}><div><h2 style={{ margin: 0, color: "#2c1f14" }}>Careers roles</h2><p style={{ margin: "5px 0 0", color: "#8c7060", fontSize: 13 }}>Draft roles stay private; publish a role to list it on the SaviNexa careers endpoint.</p></div><button onClick={() => setShowForm(!showForm)} style={{ border: 0, borderRadius: 9, padding: "10px 14px", color: "white", background: "#9b4e24", cursor: "pointer" }}>{showForm ? "Close form" : "Add role"}</button></div>
      {showForm && <form onSubmit={saveJob} style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
        <input required maxLength={140} placeholder="Role title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
        <input maxLength={100} placeholder="Function / department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} style={inputStyle} />
        <input maxLength={120} placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} style={inputStyle} />
        <select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} style={inputStyle}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select>
        <input type="email" placeholder="Application email (optional)" value={form.applicationEmail} onChange={(e) => setForm({ ...form, applicationEmail: e.target.value })} style={inputStyle} />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}><option value="draft">Save as draft</option><option value="published">Publish immediately</option></select>
        <textarea required maxLength={12000} placeholder="Role description and candidate profile" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, gridColumn: "1 / -1", minHeight: 130, resize: "vertical" }} />
        <button disabled={saving} style={{ ...inputStyle, border: 0, background: "#2c1f14", color: "white", cursor: "pointer", gridColumn: "1 / -1" }}>{saving ? "Saving…" : "Save role"}</button>
      </form>}
      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>{data.jobs.length ? data.jobs.map((job) => <article key={job._id} style={{ borderTop: "1px solid #f0e8e0", paddingTop: 13, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><strong style={{ color: "#38291b" }}>{job.title}</strong><p style={{ margin: "4px 0", color: "#8c7060", fontSize: 13 }}>{[job.department, job.location, job.employmentType].filter(Boolean).join(" · ")}</p><small style={{ color: "#886044" }}>Status: {job.status}</small></div><select aria-label={`Status for ${job.title}`} value={job.status} onChange={(e) => setJobStatus(job, e.target.value)} style={inputStyle}><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select></article>) : <p style={{ color: "#8c7060" }}>No roles added yet. Add roles only when they are confirmed for recruitment.</p>}</div>
    </section>
    <section style={box}><h2 style={{ margin: "0 0 5px", color: "#2c1f14" }}>Candidate & client enquiries</h2><p style={{ margin: "0 0 14px", color: "#8c7060", fontSize: 13 }}>Messages submitted through the SaviNexa enquiry form appear here.</p>
      {data.enquiries.length ? <div style={{ display: "grid", gap: 10 }}>{data.enquiries.map((item) => <article key={item._id} style={{ borderTop: "1px solid #f0e8e0", paddingTop: 12, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12 }}><div><strong>{item.name}</strong><p style={{ margin: "3px 0", color: "#806b56", fontSize: 13 }}>{item.email}{item.phone ? ` · ${item.phone}` : ""}{item.organization ? ` · ${item.organization}` : ""}</p><p style={{ whiteSpace: "pre-wrap", margin: "7px 0", fontSize: 14 }}>{item.message}</p><small style={{ color: "#96765c" }}>{new Date(item.createdAt).toLocaleString()}</small></div><select aria-label={`Status for enquiry from ${item.name}`} value={item.status} onChange={(e) => setEnquiryStatus(item, e.target.value)} style={inputStyle}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="responded">Responded</option><option value="closed">Closed</option></select></article>)}</div> : <p style={{ color: "#8c7060" }}>No enquiries received yet.</p>}
    </section>
  </div>;
}

const inputStyle = { minWidth: 0, width: "100%", boxSizing: "border-box", border: "1px solid #e5d9cd", borderRadius: 8, padding: "10px 11px", background: "white", color: "#392919", font: "inherit" };
