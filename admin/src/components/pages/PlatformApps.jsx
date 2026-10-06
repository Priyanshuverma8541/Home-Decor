import { useEffect, useState } from "react";
import { Copy, KeyRound, Plus, RefreshCw, Shield, X } from "lucide-react";
import { platformAPI } from "../../services/api.js";

const input = { width: "100%", border: "1px solid #e7d8c8", borderRadius: 8, padding: "10px 12px", background: "white", color: "#382719" };
const button = { border: 0, borderRadius: 8, padding: "9px 13px", background: "#c86e3c", color: "white", cursor: "pointer", fontWeight: 600 };
const card = { background: "white", border: "1px solid #eee4da", borderRadius: 12, padding: 18 };
const SCOPES = ["events:write", "users:write", "subscribers:read", "subscribers:write", "notifications:send", "campaigns:write", "analytics:read", "webhooks:write"];
const messageOf = (error) => error.response?.data?.message || "The request could not be completed.";

export default function PlatformApps() {
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState("");
  const [keys, setKeys] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", allowedDomains: "" });
  const [keyName, setKeyName] = useState("");
  const [keyScopes, setKeyScopes] = useState(["events:write"]);
  const [showCreate, setShowCreate] = useState(false);
  const [newSecret, setNewSecret] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadApps = async (preferred = selected) => {
    const response = await platformAPI.applications();
    const list = response.data.applications || [];
    setApps(list);
    const next = list.some((app) => app.appId === preferred) ? preferred : list[0]?.appId || "";
    setSelected(next);
    if (next) {
      const keyResponse = await platformAPI.keys(next);
      setKeys(keyResponse.data.keys || []);
    } else setKeys([]);
  };

  useEffect(() => { loadApps().catch((err) => setError(messageOf(err))); }, []);
  const activeApp = apps.find((app) => app.appId === selected);

  const createApp = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice(""); setNewSecret("");
    try {
      const response = await platformAPI.createApplication({ ...form, allowedDomains: form.allowedDomains.split(/[\n,]/).map((value) => value.trim()).filter(Boolean) });
      await loadApps(response.data.application.appId);
      setNotice(`Application created. Save its public key now: ${response.data.publicKey}`);
      setForm({ name: "", description: "", allowedDomains: "" }); setShowCreate(false);
    } catch (err) { setError(messageOf(err)); } finally { setBusy(false); }
  };

  const createKey = async (event) => {
    event.preventDefault(); if (!selected) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await platformAPI.createKey(selected, { name: keyName, scopes: keyScopes });
      setNewSecret(response.data.secret); setKeyName(""); await loadApps(selected);
      setNotice("Copy this secret now. It will not be shown again.");
    } catch (err) { setError(messageOf(err)); } finally { setBusy(false); }
  };

  const rotateKey = async (id) => {
    if (!selected) return; setBusy(true); setError(""); setNotice("");
    try { const response = await platformAPI.rotateKey(selected, id); setNewSecret(response.data.secret); await loadApps(selected); setNotice("The previous key is revoked. Copy the replacement secret now; it will not be shown again."); }
    catch (err) { setError(messageOf(err)); } finally { setBusy(false); }
  };

  const revokeKey = async (id) => {
    if (!selected) return; setBusy(true); setError("");
    try { await platformAPI.revokeKey(selected, id); await loadApps(selected); setNotice("API key revoked."); }
    catch (err) { setError(messageOf(err)); } finally { setBusy(false); }
  };

  const setAppStatus = async (status) => {
    if (!activeApp) return; setBusy(true); setError("");
    try { await platformAPI.updateApplication(activeApp.appId, { status }); await loadApps(activeApp.appId); setNotice(`Application ${status}.`); }
    catch (err) { setError(messageOf(err)); } finally { setBusy(false); }
  };

  const copy = async (value) => { await navigator.clipboard.writeText(value); setNotice("Copied to clipboard."); };

  return <main style={{ display: "grid", gap: 18, color: "#382719" }}>
    <header><p style={{ color: "#a66e28", margin: 0 }}>Savitri Platform</p><h1 style={{ margin: "4px 0", fontFamily: "'Playfair Display',serif" }}>Applications & API keys</h1><p style={{ color: "#8c7060", margin: 0 }}>Register connected apps and manage scoped server credentials.</p></header>
    {error && <div role="alert" style={{ ...card, color: "#a33", borderColor: "#e6b9ad" }}>{error}</div>}
    {notice && <div role="status" style={{ ...card, background: "#f5fbf3", color: "#375c30", overflowWrap: "anywhere" }}>{notice}</div>}
    {newSecret && <section style={{ ...card, borderColor: "#d7b56c", display: "grid", gap: 9 }}><strong>New secret key — copy it now</strong><code style={{ display: "block", padding: 12, background: "#fbf6ee", overflowWrap: "anywhere" }}>{newSecret}</code><button type="button" style={{ ...button, justifySelf: "start" }} onClick={() => copy(newSecret)}><Copy size={14} style={{ verticalAlign: "middle", marginRight: 6 }}/>Copy secret</button></section>}
    <section style={{ ...card, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><h2 style={{ margin: 0, fontSize: 18 }}>Application registry</h2><button style={button} onClick={() => setShowCreate(true)}><Plus size={15} style={{ verticalAlign: "middle", marginRight: 5 }}/>Register application</button></div>
      <label style={{ display: "grid", gap: 5, maxWidth: 520 }}>Selected application<select style={input} value={selected} onChange={(event) => { setSelected(event.target.value); loadApps(event.target.value).catch((err) => setError(messageOf(err))); }}>{apps.map((app) => <option key={app.appId} value={app.appId}>{app.name} · {app.appId}</option>)}</select></label>
      {activeApp ? <div style={{ borderTop: "1px solid #eee4da", paddingTop: 12, display: "grid", gap: 7 }}><strong>{activeApp.name} <small style={{ color: "#8c7060", fontWeight: 400 }}>{activeApp.appId}</small></strong><span>{activeApp.description || "No description"}</span><span>Status: <b>{activeApp.status}</b> · Type: {activeApp.platform}</span><span>Allowed domains: {activeApp.allowedDomains?.join(", ") || "None configured"}</span><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><code style={{ overflowWrap: "anywhere", fontSize: 12 }}>Public key: {activeApp.publicKey || "Not available"}</code>{activeApp.publicKey && <button style={{ ...button, background: "#806c58" }} onClick={() => copy(activeApp.publicKey)}><Copy size={13}/></button>}</div><div style={{ display: "flex", gap: 8 }}>{activeApp.status === "active" ? <button style={{ ...button, background: "#806c58" }} disabled={busy} onClick={() => setAppStatus("paused")}>Pause app</button> : <button style={button} disabled={busy} onClick={() => setAppStatus("active")}>Activate app</button>}</div></div> : <p>No applications are registered.</p>}
    </section>
    {activeApp && <section style={{ ...card, display: "grid", gap: 13 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><KeyRound size={18}/><h2 style={{ margin: 0, fontSize: 18 }}>Secret API keys</h2></div>
      <form onSubmit={createKey} style={{ display: "grid", gap: 10, maxWidth: 680 }}><label style={{ display: "grid", gap: 5 }}>Key name<input style={input} required maxLength={100} value={keyName} onChange={(event) => setKeyName(event.target.value)} placeholder="Production integration"/></label><fieldset style={{ border: "1px solid #eee4da", borderRadius: 8, display: "flex", flexWrap: "wrap", gap: 8 }}><legend>Permissions</legend>{SCOPES.map((scope) => <label key={scope} style={{ fontSize: 13, whiteSpace: "nowrap" }}><input type="checkbox" checked={keyScopes.includes(scope)} onChange={(event) => setKeyScopes(event.target.checked ? [...keyScopes, scope] : keyScopes.filter((item) => item !== scope))}/> {scope}</label>)}</fieldset><button disabled={busy || !keyScopes.length} style={{ ...button, justifySelf: "start" }}>{busy ? "Working…" : "Create secret key"}</button></form>
      <div style={{ display: "grid", gap: 8 }}>{keys.length ? keys.map((key) => <div key={key._id} style={{ borderTop: "1px solid #eee4da", paddingTop: 10, display: "grid", gridTemplateColumns: "minmax(150px,1fr) minmax(140px,1fr) auto", alignItems: "center", gap: 10 }}><div><strong>{key.name}</strong><div style={{ fontSize: 12, color: "#8c7060" }}>{key.prefix}… · {key.status}</div></div><div style={{ fontSize: 12 }}>{key.scopes.join(", ")}</div>{key.status === "active" && <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button disabled={busy} style={{ ...button, background: "#806c58" }} onClick={() => rotateKey(key._id)} title="Rotate key"><RefreshCw size={14}/></button><button disabled={busy} style={{ ...button, background: "#9c4e3f" }} onClick={() => revokeKey(key._id)} title="Revoke key"><X size={14}/></button></div>}</div>) : <p style={{ color: "#8c7060" }}>No API keys have been created for this application.</p>}</div>
      <p style={{ display: "flex", gap: 7, alignItems: "center", color: "#8c7060", fontSize: 12 }}><Shield size={15}/>Secret keys are hashed at rest and shown only once when created or rotated.</p>
    </section>}
    {showCreate && <div role="dialog" aria-modal="true" aria-label="Register an application" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(25,18,12,.5)", display: "grid", placeItems: "center", padding: 16 }}><form onSubmit={createApp} style={{ ...card, width: "min(560px,100%)", display: "grid", gap: 12 }}><div style={{ display: "flex", justifyContent: "space-between" }}><h2 style={{ margin: 0 }}>Register application</h2><button type="button" onClick={() => setShowCreate(false)} aria-label="Close"><X size={16}/></button></div><label style={{ display: "grid", gap: 5 }}>Name<input required maxLength={100} style={input} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label><label style={{ display: "grid", gap: 5 }}>Description<textarea maxLength={500} rows={2} style={input} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></label><label style={{ display: "grid", gap: 5 }}>Allowed domains <small>One host per line (example.com or localhost:5173)</small><textarea rows={3} style={input} value={form.allowedDomains} onChange={(event) => setForm({ ...form, allowedDomains: event.target.value })}/></label><button disabled={busy} style={button}>{busy ? "Registering…" : "Register application"}</button></form></div>}
  </main>;
}