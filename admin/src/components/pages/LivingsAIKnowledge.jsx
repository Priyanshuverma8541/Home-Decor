import { useCallback, useEffect, useState } from "react";
import { BookOpen, Check, FilePlus2, Pencil, RefreshCw, Save, Sparkles, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { livingsAIAdminAPI } from "../../services/api.js";

const blank = { title: "", content: "", audience: "public", sourceLabel: "Savitri Livings guide", sourceUrl: "", active: true };
const panel = { border: "1px solid #e9dfd0", borderRadius: 14, background: "#fffdf9", padding: 18 };
const fieldStyle = { display: "grid", gap: 6, color: "#715c43", fontSize: 12, fontWeight: 700 };
const inputStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #ddd2c2", borderRadius: 8, padding: "10px 11px", background: "white", color: "#3d3024", font: "inherit" };

export default function LivingsAIKnowledge() {
  const [knowledge, setKnowledge] = useState([]);
  const [builtIn, setBuiltIn] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await livingsAIAdminAPI.knowledge();
      setKnowledge(data.knowledge || []); setBuiltIn(data.builtIn || []); setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load LivingsAI knowledge sources.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  const change = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const startEdit = (item) => { setEditing(item._id); setForm({ title: item.title, content: item.content, audience: item.audience, sourceLabel: item.sourceLabel || "Savitri Livings guide", sourceUrl: item.sourceUrl || "", active: item.active !== false }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const reset = () => { setEditing(""); setForm(blank); };

  const save = async (event) => {
    event.preventDefault(); setBusy(true);
    try {
      if (editing) await livingsAIAdminAPI.updateKnowledge(editing, form);
      else await livingsAIAdminAPI.createKnowledge(form);
      toast.success(editing ? "Knowledge source updated" : "Knowledge source added"); reset(); await refresh();
    } catch (requestError) { toast.error(requestError.response?.data?.message || "Could not save this knowledge source."); }
    finally { setBusy(false); }
  };

  const remove = async (item) => {
    if (!window.confirm(`Remove “${item.title}” from LivingsAI knowledge?`)) return;
    try { await livingsAIAdminAPI.deleteKnowledge(item._id); toast.success("Knowledge source removed"); await refresh(); }
    catch (requestError) { toast.error(requestError.response?.data?.message || "Could not remove this source."); }
  };

  return <main style={{ maxWidth: 1160, margin: "0 auto", color: "#3f3023" }}>
    <header style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 22 }}>
      <div style={{ display: "grid", placeItems: "center", width: 45, height: 45, borderRadius: 14, background: "#2c4b3e", color: "#f4ce7c", flex: "none" }}><Sparkles size={22}/></div>
      <div><span style={{ color: "#9a6d3d", fontSize: 10, fontWeight: 800, letterSpacing: 2 }}>AI PLATFORM · ADMIN</span><h1 style={{ margin: "5px 0", font: "600 30px Georgia,serif", color: "#2c1f14" }}>LivingsAI knowledge</h1><p style={{ maxWidth: 800, margin: 0, color: "#796b59", fontSize: 13, lineHeight: 1.65 }}>Maintain the approved information LivingsAI can use. Public sources are available to all visitors; internal sources are only provided to signed-in Savitri admins. Chat conversations are not stored.</p></div>
    </header>

    <form onSubmit={save} style={{ ...panel, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 15, color: "#4b684f" }}><FilePlus2 size={17}/><strong>{editing ? "Edit knowledge source" : "Add a knowledge source"}</strong></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        <label style={fieldStyle}>Title<input required maxLength={120} value={form.title} onChange={change("title")} placeholder="For example, Delivery overview" style={inputStyle}/></label>
        <label style={fieldStyle}>Audience<select value={form.audience} onChange={change("audience")} style={inputStyle}><option value="public">Public · customers, visitors, partners</option><option value="internal">Internal · Savitri admins only</option></select></label>
        <label style={fieldStyle}>Source label<input maxLength={120} value={form.sourceLabel} onChange={change("sourceLabel")} placeholder="Policy, guide or team" style={inputStyle}/></label>
        <label style={fieldStyle}>Source link (optional)<input maxLength={300} value={form.sourceUrl} onChange={change("sourceUrl")} placeholder="/faqs or https://…" style={inputStyle}/></label>
      </div>
      <label style={{ ...fieldStyle, marginTop: 12 }}>Approved facts and guidance<textarea required maxLength={8000} rows={7} value={form.content} onChange={change("content")} placeholder="Write only facts Savitri Livings is comfortable sharing with this audience." style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}/></label>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginTop: 13 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#715c43", fontSize: 12 }}><input type="checkbox" checked={form.active} onChange={change("active")}/> Available to LivingsAI</label>
        <div style={{ display: "flex", gap: 8 }}>
          {editing && <button type="button" onClick={reset} style={{ border: "1px solid #ded2c1", borderRadius: 8, background: "white", padding: "9px 12px", color: "#69573f", cursor: "pointer" }}><X size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>Cancel</button>}
          <button type="submit" disabled={busy} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: 0, borderRadius: 8, background: "#2c4b3e", color: "white", padding: "10px 14px", fontWeight: 700, cursor: busy ? "wait" : "pointer", opacity: busy ? .65 : 1 }}><Save size={15}/>{busy ? "Saving…" : editing ? "Save changes" : "Add source"}</button>
        </div>
      </div>
    </form>

    {error && <p role="alert" style={{ color: "#a04436", padding: 12, background: "#fff3ed", borderRadius: 8 }}>{error}</p>}
    <section style={{ ...panel, marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}><div><span style={{ color: "#9a6d3d", fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>ALWAYS INCLUDED</span><h2 style={{ margin: "5px 0", fontSize: 18 }}>Built-in platform guides</h2></div><BookOpen size={18} color="#62806a"/></div>
      <p style={{ margin: "0 0 12px", color: "#817360", fontSize: 12, lineHeight: 1.55 }}>These safe platform maps help LivingsAI explain what Savitri modules do. Add approved details above when you want to teach it current policies or deeper business context.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 9 }}>{builtIn.map((item) => <article key={item.id} style={{ padding: 12, border: "1px solid #eee5d7", borderRadius: 10, background: "#fcfaf5" }}><strong style={{ fontSize: 12 }}>{item.title}</strong><p style={{ margin: "5px 0 0", color: "#88785f", fontSize: 10 }}>{item.audience === "internal" ? "Internal · admins" : "Public · everyone"} · {item.sourceLabel}</p></article>)}</div>
    </section>

    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "22px 0 12px" }}><div><span style={{ color: "#9a6d3d", fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>SAVITRI KNOWLEDGE</span><h2 style={{ margin: "4px 0", fontSize: 19 }}>Managed sources <span style={{ color: "#9b8d79", fontSize: 12, fontWeight: 500 }}>({knowledge.length})</span></h2></div><button type="button" onClick={refresh} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 10px", border: "1px solid #ded2c1", borderRadius: 8, background: "white", color: "#69573f", cursor: "pointer" }}><RefreshCw size={14}/>{loading ? "Loading…" : "Refresh"}</button></div>
      {!loading && !knowledge.length && <div style={{ ...panel, color: "#817360", fontSize: 13 }}>No managed sources yet. Add a verified guide above to expand LivingsAI’s knowledge.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 12 }}>{knowledge.map((item) => <article key={item._id} style={{ ...panel, opacity: item.active ? 1 : .72 }}><div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}><BookOpen size={17} color="#62806a"/><strong style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>{item.title}</strong><span style={{ padding: "4px 6px", borderRadius: 20, background: item.audience === "internal" ? "#f1e6d9" : "#eaf1e8", color: item.audience === "internal" ? "#8a5c2c" : "#4e7153", fontSize: 9, fontWeight: 800 }}>{item.audience === "internal" ? "INTERNAL" : "PUBLIC"}</span></div><p style={{ maxHeight: 92, overflow: "hidden", whiteSpace: "pre-wrap", color: "#746958", fontSize: 11, lineHeight: 1.55 }}>{item.content}</p><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderTop: "1px solid #eee7dd", paddingTop: 10 }}><span style={{ color: item.active ? "#5c825e" : "#9b8d79", fontSize: 10 }}>{item.active ? "Available to AI" : "Paused"} · {item.sourceLabel || "Savitri Livings guide"}</span><div style={{ display: "flex", gap: 6 }}><button type="button" title="Edit source" onClick={() => startEdit(item)} style={{ display: "grid", placeItems: "center", width: 30, height: 30, border: "1px solid #e4dbce", borderRadius: 7, background: "white", color: "#6a593f", cursor: "pointer" }}><Pencil size={13}/></button><button type="button" title={item.active ? "Pause source" : "Enable source"} onClick={async () => { try { await livingsAIAdminAPI.updateKnowledge(item._id, { ...item, active: !item.active }); toast.success(item.active ? "Source paused" : "Source enabled"); await refresh(); } catch (requestError) { toast.error(requestError.response?.data?.message || "Could not update source."); } }} style={{ display: "grid", placeItems: "center", width: 30, height: 30, border: "1px solid #e4dbce", borderRadius: 7, background: "white", color: item.active ? "#a7654f" : "#52745a", cursor: "pointer" }}>{item.active ? <X size={14}/> : <Check size={14}/>}</button><button type="button" title="Remove source" onClick={() => remove(item)} style={{ display: "grid", placeItems: "center", width: 30, height: 30, border: "1px solid #e4dbce", borderRadius: 7, background: "white", color: "#a34b3e", cursor: "pointer" }}><Trash2 size={13}/></button></div></div></article>)}</div>
    </section>
  </main>;
}
