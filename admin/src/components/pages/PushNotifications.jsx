import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, Plus, RefreshCw, Send, Users, X, Pencil, Trash2, CalendarClock } from "lucide-react";
import { pushAPI } from "../../services/api.js";

const emptyForm = { name: "", title: "", body: "", imageUrl: "", iconUrl: "", targetUrl: "/", audience: "all", subscriptionIds: [], sendMode: "draft", scheduledAt: "" };
const tabs = ["Overview", "Subscribers", "Campaigns", "Scheduled", "History", "Analytics", "Settings"];
const inputStyle = { width: "100%", padding: ".65rem .75rem", border: "1px solid #e6d9cb", borderRadius: 8, font: "inherit", color: "#2c1f14", background: "white" };
const primary = { border: 0, borderRadius: 8, background: "#c96030", color: "white", padding: ".65rem .9rem", display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", fontWeight: 600 };
const secondary = { border: "1px solid #e6d9cb", borderRadius: 8, background: "white", color: "#593c20", padding: ".55rem .75rem", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" };
const localDate = (value) => value ? new Date(value).toLocaleString() : "—";

export default function PushNotifications() {
  const [data, setData] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [tab, setTab] = useState("Overview");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState("");
  const [testSubscriber, setTestSubscriber] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const [summary, subscriberResult] = await Promise.all([pushAPI.summary(), pushAPI.subscribers()]);
    setData(summary.data);
    setSubscribers(subscriberResult.data.subscribers || []);
  }, []);
  useEffect(() => { load().catch(() => setMessage("Could not load push notification data.")); }, [load]);

  const campaigns = data?.campaigns || [];
  const visibleCampaigns = useMemo(() => {
    if (tab === "Scheduled") return campaigns.filter((campaign) => campaign.status === "scheduled");
    if (tab === "History") return campaigns.filter((campaign) => ["sent", "partial", "failed"].includes(campaign.status));
    return campaigns;
  }, [campaigns, tab]);
  const activeSubscribers = subscribers.filter((subscriber) => subscriber.status === "active");
  const startNew = () => { setEditing(""); setForm(emptyForm); setShowForm(true); setMessage(""); };
  const startEdit = (campaign) => {
    setEditing(campaign._id);
    setForm({ name: campaign.name || "", title: campaign.title || "", body: campaign.body || "", imageUrl: campaign.imageUrl || "", iconUrl: campaign.iconUrl || "", targetUrl: campaign.targetUrl || "/", audience: campaign.audience || "all", subscriptionIds: campaign.subscriptionIds || [], sendMode: campaign.sendMode || "draft", scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : "" });
    setShowForm(true);
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const payload = { ...form, scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined };
      if (editing) await pushAPI.updateCampaign(editing, payload);
      else await pushAPI.createCampaign(payload);
      setShowForm(false); setForm(emptyForm); setEditing(""); await load();
      setMessage(form.sendMode === "now" && !editing ? "Push attempt complete. The push service acceptance count is not device delivery confirmation." : "Campaign saved.");
    } catch (error) { setMessage(error.response?.data?.message || "Could not save the campaign."); }
    finally { setBusy(false); }
  };
  const send = async (id) => {
    if (!window.confirm("Send this notification to its selected audience now?")) return;
    setBusy(true); setMessage("");
    try { await pushAPI.sendCampaign(id); await load(); setMessage("Push attempt complete. Accepted means the push service accepted the request, not that a device displayed it."); }
    catch (error) { setMessage(error.response?.data?.message || "Could not send campaign."); }
    finally { setBusy(false); }
  };
  const cancel = async (id) => {
    setBusy(true); try { await pushAPI.cancelCampaign(id); await load(); setMessage("Scheduled campaign cancelled and saved as a draft."); }
    catch (error) { setMessage(error.response?.data?.message || "Could not cancel schedule."); } finally { setBusy(false); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this campaign?")) return;
    setBusy(true); try { await pushAPI.deleteCampaign(id); await load(); setMessage("Campaign deleted."); }
    catch (error) { setMessage(error.response?.data?.message || "Could not delete campaign."); } finally { setBusy(false); }
  };
  const test = async () => {
    if (!testSubscriber) { setMessage("Choose an active subscriber to receive the test."); return; }
    setBusy(true); setMessage("");
    try { await pushAPI.test({ subscriptionId: testSubscriber, title: "Savitri Livings test", body: "Your browser push notifications are working.", targetUrl: "/" }); setMessage("Test push accepted by the push service. Check the device notification panel."); }
    catch (error) { setMessage(error.response?.data?.message || "Test push failed."); } finally { setBusy(false); }
  };

  if (!data) return <p style={{ color: "#8c7060" }}>Loading push notifications…</p>;
  return <div style={{ color: "#2c1f14" }}>
    <header style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
      <div><p style={{ color: "#a66e28", margin: 0 }}>Savitri Livings</p><h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", margin: "4px 0" }}>Push Notifications</h1><p style={{ color: "#8c7060", margin: 0 }}>Manage opt-in browser notifications and campaigns.</p></div>
      <div style={{ display: "flex", gap: 8 }}><button style={secondary} onClick={() => load().catch(() => setMessage("Refresh failed."))} aria-label="Refresh"><RefreshCw size={15} /></button><button style={primary} onClick={startNew}><Plus size={15} />New campaign</button></div>
    </header>
    <nav aria-label="Push notification sections" style={{ display: "flex", overflowX: "auto", gap: 6, borderBottom: "1px solid #eadfd3", marginBottom: 18 }}>
      {tabs.map((item) => <button key={item} onClick={() => setTab(item)} style={{ border: 0, borderBottom: tab === item ? "2px solid #c96030" : "2px solid transparent", background: "transparent", padding: ".65rem .75rem", whiteSpace: "nowrap", color: tab === item ? "#a84925" : "#8c7060", cursor: "pointer" }}>{item}</button>)}
    </nav>
    {message && <p role="status" style={{ padding: ".75rem", borderRadius: 8, background: "#f9eed9", color: "#79501d" }}>{message}</p>}
    {tab === "Subscribers" ? <section style={{ background: "white", border: "1px solid #eee4da", borderRadius: 12, padding: 16, overflowX: "auto" }}><h2>Subscribers ({subscribers.length})</h2><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}><thead><tr>{["Status", "Customer", "Browser / device", "Platform", "Subscribed", "Last push", "Clicks"].map((label) => <th key={label} style={{ textAlign: "left", padding: 9, borderBottom: "1px solid #eee4da" }}>{label}</th>)}</tr></thead><tbody>{subscribers.map((sub) => <tr key={sub._id}><td style={{ padding: 9 }}>{sub.status}</td><td style={{ padding: 9 }}>{sub.userId?.fullName || sub.userId?.email || "Guest"}</td><td style={{ padding: 9, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>{sub.device?.browser || "Unknown"}</td><td style={{ padding: 9 }}>{sub.device?.platform || "—"}</td><td style={{ padding: 9 }}>{localDate(sub.createdAt)}</td><td style={{ padding: 9 }}>{localDate(sub.lastSuccessAt)}</td><td style={{ padding: 9 }}>{sub.clickCount || 0}</td></tr>)}</tbody></table></section> : null}
    {["Overview", "Analytics", "Settings"].includes(tab) && <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 12, marginBottom: 18 }}>
        {[["Total subscribers", data.totalSubscribers], ["Active", data.activeSubscribers], ["Invalid / inactive", data.inactiveSubscribers], ["Campaigns", data.campaignCount ?? campaigns.length], ["Attempts", data.pushAttempts], ["Accepted by push service", data.acceptedPushes], ["Failed / expired", data.failedPushes], ["Clicks", data.clicks]].map(([label, value]) => <div key={label} style={{ background: "white", border: "1px solid #eee4da", borderRadius: 12, padding: 14 }}><small style={{ color: "#8c7060" }}>{label}</small><strong style={{ display: "block", fontSize: "1.55rem", marginTop: 5 }}>{value ?? 0}</strong></div>)}
      </div>
      <div style={{ background: data.configured ? "#e9f5ef" : "#f9eed9", padding: 12, borderRadius: 9, color: data.configured ? "#236448" : "#79501d", marginBottom: 18 }}>{data.configured ? "VAPID is configured. Push acceptance is tracked separately from device delivery." : "Add VAPID_SUBJECT, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY to the backend environment."}</div>
      {tab === "Settings" && <section style={{ background: "white", border: "1px solid #eee4da", borderRadius: 12, padding: 16 }}><h2>Web Push settings</h2><p>Permission is requested only after a visitor selects Enable Notifications. Keep VAPID_PRIVATE_KEY on the backend. The public key is served by the backend config endpoint.</p><p>Push service acceptance does not confirm that a device displayed the notification.</p></section>}
      {tab === "Analytics" && <section style={{ background: "white", border: "1px solid #eee4da", borderRadius: 12, padding: 16 }}><h2>Campaign analytics</h2><p>Attempts: {data.pushAttempts || 0} · Accepted: {data.acceptedPushes || 0} · Failed / expired: {data.failedPushes || 0} · Clicks: {data.clicks || 0}</p></section>}
      {tab === "Overview" && <section style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", background: "white", border: "1px solid #eee4da", borderRadius: 12, padding: 14 }}><Users size={18} color="#a66e28"/><label>Send test to <select value={testSubscriber} onChange={(event) => setTestSubscriber(event.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 220 }}><option value="">Select active subscriber</option>{activeSubscribers.map((sub) => <option key={sub._id} value={sub._id}>{sub.userId?.fullName || sub.device?.platform || "Guest"} · {sub.status}</option>)}</select></label><button style={primary} onClick={test} disabled={busy || !data.configured}><Send size={14}/>Send test</button></section>}
    </>}
    {["Campaigns", "Scheduled", "History", "Overview"].includes(tab) && <section style={{ marginTop: 18, background: "white", border: "1px solid #eee4da", borderRadius: 12, padding: 16 }}><h2 style={{ marginTop: 0 }}>{tab === "Overview" ? "Recent campaigns" : tab}</h2>{visibleCampaigns.length ? visibleCampaigns.map((campaign) => <article key={campaign._id} style={{ borderTop: "1px solid #f0e8e0", padding: "13px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><div><strong>{campaign.name}</strong><div style={{ color: "#8c7060", fontSize: ".85rem", marginTop: 4 }}>{campaign.title} · {campaign.status}{campaign.scheduledAt ? ` · ${localDate(campaign.scheduledAt)}` : ""}</div><small style={{ color: "#8c7060" }}>Attempts {campaign.stats?.targeted || 0} · Accepted {campaign.stats?.accepted || 0} · Failed {campaign.stats?.failed || 0} · Expired {campaign.stats?.stale || 0} · Clicks {campaign.stats?.clicked || 0}</small></div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{["draft", "scheduled"].includes(campaign.status) && <button style={secondary} onClick={() => startEdit(campaign)}><Pencil size={14}/>Edit</button>}{campaign.status === "draft" && <button style={primary} onClick={() => send(campaign._id)} disabled={busy || !data.configured}><Send size={14}/>Send now</button>}{campaign.status === "scheduled" && <button style={secondary} onClick={() => cancel(campaign._id)} disabled={busy}><CalendarClock size={14}/>Cancel schedule</button>}<button style={secondary} onClick={() => remove(campaign._id)} disabled={busy} aria-label="Delete campaign"><Trash2 size={14}/></button></div></article>) : <p style={{ color: "#8c7060" }}>No campaigns in this section yet.</p>}</section>}
    {showForm && <div role="dialog" aria-modal="true" aria-label={editing ? "Edit campaign" : "Create campaign"} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(25,18,12,.45)", display: "grid", placeItems: "center", padding: 16 }}><form onSubmit={save} style={{ width: "min(720px,100%)", maxHeight: "92vh", overflow: "auto", background: "#fffdf9", borderRadius: 14, padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}><div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ margin: 0 }}>{editing ? "Edit push campaign" : "Create push campaign"}</h2><button type="button" style={secondary} onClick={() => setShowForm(false)} aria-label="Close"><X size={16}/></button></div>{[["name", "Campaign name"], ["title", "Notification title"], ["targetUrl", "Target URL (site path or approved HTTPS URL)"], ["imageUrl", "Image URL (optional)"], ["iconUrl", "Icon URL (optional)"]].map(([key, label]) => <label key={key} style={{ display: "grid", gap: 5 }}>{label}<input required={key === "name" || key === "title"} maxLength={key === "title" ? 100 : undefined} style={inputStyle} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })}/></label>)}<label style={{ display: "grid", gap: 5, gridColumn: "1/-1" }}>Body<textarea required maxLength={300} rows={3} style={inputStyle} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })}/></label><label style={{ display: "grid", gap: 5 }}>Audience<select style={inputStyle} value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}><option value="all">All active subscribers</option><option value="selected">Selected subscribers</option></select></label>{form.audience === "selected" && <label style={{ display: "grid", gap: 5, gridColumn: "1/-1" }}>Choose subscribers<select multiple size={Math.min(6, Math.max(3, activeSubscribers.length))} style={inputStyle} value={form.subscriptionIds} onChange={(event) => setForm({ ...form, subscriptionIds: Array.from(event.target.selectedOptions, (option) => option.value) })}>{activeSubscribers.map((sub) => <option key={sub._id} value={sub._id}>{sub.userId?.fullName || sub.userId?.email || "Guest"} · {sub.device?.platform || "device"}</option>)}</select></label>}<label style={{ display: "grid", gap: 5 }}>Send option<select style={inputStyle} value={form.sendMode} onChange={(event) => setForm({ ...form, sendMode: event.target.value })}><option value="draft">Save draft</option><option value="schedule">Schedule</option><option value="now">Send now</option></select></label>{form.sendMode === "schedule" && <label style={{ display: "grid", gap: 5 }}>Schedule time<input required type="datetime-local" min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} style={inputStyle} value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}/></label>}<div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "end", gap: 8 }}><button type="button" style={secondary} onClick={() => setShowForm(false)}>Close</button><button style={primary} disabled={busy}>{busy ? "Saving…" : editing ? "Update campaign" : form.sendMode === "now" ? "Send campaign" : form.sendMode === "schedule" ? "Schedule campaign" : "Save draft"}</button></div></form></div>}
  </div>;
}
