import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, ContactRound, ExternalLink, Plus, RefreshCw, Save, Search, ShieldCheck } from "lucide-react";
import { explorerHRAPI } from "../../services/api.js";
import { PageLoader } from "../ui/index.jsx";

const empty = { fullName: "", jobTitle: "", companyName: "", workEmail: "", workPhone: "", linkedInUrl: "", otherProfileUrl: "", technologies: "", hiringAreas: "", source: "", contactBasis: "public_professional_info", contactBasisDetails: "", relationshipStatus: "identified", nextFollowUpAt: "", privateNotes: "" };
const stages = ["to_research", "identified", "contacted", "connected", "conversation", "do_not_contact", "archived"];
const activityTypes = ["note", "email", "call", "meeting", "connection", "follow_up"];
const box = { background: "#fff", border: "1px solid #eadfd3", borderRadius: 14, padding: 16 };
const input = { width: "100%", marginTop: 5, padding: "10px 11px", border: "1px solid #decfbd", borderRadius: 9, background: "#fffdf9", color: "#35291e", font: "inherit", fontSize: 12 };
const label = { display: "block", color: "#725d48", fontSize: 11, fontWeight: 650 };
const toForm = (contact) => ({ ...empty, ...contact, technologies: (contact.technologies || []).join(", "), hiringAreas: (contact.hiringAreas || []).join(", "), nextFollowUpAt: contact.nextFollowUpAt ? new Date(contact.nextFollowUpAt).toISOString().slice(0, 10) : "" });
const fromForm = (form) => ({ ...form, technologies: form.technologies.split(",").map((item) => item.trim()).filter(Boolean), hiringAreas: form.hiringAreas.split(",").map((item) => item.trim()).filter(Boolean), nextFollowUpAt: form.nextFollowUpAt || null });
const messageOf = (error) => error?.response?.data?.message || "The HR contact request could not be completed.";

export default function ExplorerHRCRM() {
  const [contacts, setContacts] = useState([]), [selectedId, setSelectedId] = useState(""), [form, setForm] = useState(empty), [activityForm, setActivityForm] = useState({ type: "note", summary: "", nextFollowUpAt: "" });
  const [activities, setActivities] = useState([]), [search, setSearch] = useState(""), [followUp, setFollowUp] = useState(""), [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const selected = contacts.find((contact) => contact._id === selectedId);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await explorerHRAPI.contacts({ ...(search ? { search } : {}), ...(followUp ? { followUp } : {}) });
      setContacts(data.contacts || []);
    } catch (err) { setError(messageOf(err)); }
    finally { setLoading(false); }
  }, [search, followUp]);

  useEffect(() => { const timer = setTimeout(load, search ? 250 : 0); return () => clearTimeout(timer); }, [load]);
  useEffect(() => {
    let active = true;
    if (!selectedId) { setActivities([]); return () => { active = false; }; }
    explorerHRAPI.activities(selectedId).then(({ data }) => { if (active) setActivities(data.activities || []); }).catch((err) => { if (active) setError(messageOf(err)); });
    return () => { active = false; };
  }, [selectedId]);

  const overdueCount = useMemo(() => contacts.filter((contact) => contact.nextFollowUpAt && new Date(contact.nextFollowUpAt) < new Date() && !["do_not_contact", "archived"].includes(contact.relationshipStatus)).length, [contacts]);
  const startNew = () => { setSelectedId(""); setForm(empty); setActivities([]); setAdding(true); setError(""); setNotice(""); };
  const select = (contact) => { setSelectedId(contact._id); setForm(toForm(contact)); setAdding(false); setError(""); setNotice(""); };
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const saveContact = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const payload = fromForm(form);
      const response = adding ? await explorerHRAPI.createContact(payload) : await explorerHRAPI.updateContact(selectedId, payload);
      const contact = response.data.contact; setSelectedId(contact._id); setAdding(false); setForm(toForm(contact)); setNotice(adding ? "HR contact added." : "HR contact saved."); await load();
    } catch (err) { setError(messageOf(err)); }
    finally { setSaving(false); }
  };

  const addActivity = async (event) => {
    event.preventDefault(); if (!selectedId) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await explorerHRAPI.addActivity(selectedId, { ...activityForm, nextFollowUpAt: activityForm.nextFollowUpAt || undefined });
      setActivityForm({ type: "note", summary: "", nextFollowUpAt: "" });
      const [{ data: activityData }, { data: contactData }] = await Promise.all([explorerHRAPI.activities(selectedId), explorerHRAPI.contacts({ ...(search ? { search } : {}), ...(followUp ? { followUp } : {}) })]);
      setActivities(activityData.activities || []); setContacts(contactData.contacts || []);
      const updated = (contactData.contacts || []).find((contact) => contact._id === selectedId);
      if (updated) setForm(toForm(updated));
      setNotice("Activity recorded.");
    } catch (err) { setError(messageOf(err)); }
    finally { setSaving(false); }
  };

  if (loading && !contacts.length) return <PageLoader/>;

  return <main style={{ display: "grid", gap: 17, color: "#33251a" }}>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 14, flexWrap: "wrap" }}><div><p style={{ margin: 0, color: "#a66e28", fontSize: 11, fontWeight: 700, letterSpacing: ".14em" }}>SAVITRI EXPLORER · PRIVATE OPERATIONS</p><h1 style={{ margin: "5px 0", fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.7rem,4vw,2.2rem)" }}>HR Networking CRM</h1><p style={{ margin: 0, color: "#82715f", fontSize: 13 }}>Build professional relationships with source, contact basis, activity history and follow-up tracking.</p></div><button type="button" onClick={startNew} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 13px", border: 0, borderRadius: 9, background: "#2c5a49", color: "white", fontWeight: 700, cursor: "pointer" }}><Plus size={15}/>Add HR contact</button></header>
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 12px", border: "1px solid #eadfd3", borderRadius: 10, background: "#f9f5ec", color: "#665742", fontSize: 11 }}><ShieldCheck size={16} color="#53745d"/> Admin-only contacts. Record professional source and contact basis; do not enter sensitive personal data or private social information.</div>
    {error && <p role="alert" style={{ ...box, padding: 11, color: "#9a3028", borderColor: "#e7b8ac" }}>{error}</p>}{notice && <p role="status" style={{ ...box, padding: 11, background: "#f5fbf3", color: "#375c30" }}>{notice}</p>}
    <section style={{ display: "grid", gridTemplateColumns: "minmax(270px,.78fr) minmax(0,1.6fr)", gap: 14, alignItems: "start" }} className="explorer-hr-layout">
      <aside style={{ ...box, display: "grid", gap: 11 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><strong style={{ fontSize: 13 }}>Contact list · {contacts.length}</strong><button type="button" aria-label="Refresh contacts" onClick={load} style={{ border: 0, background: "transparent", color: "#8b755d", cursor: "pointer" }}><RefreshCw size={15}/></button></div>
        <label style={{ ...label, position: "relative" }}><Search size={15} style={{ position: "absolute", left: 10, top: 30, color: "#9d8b76" }}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, company, role…" style={{ ...input, paddingLeft: 32 }}/></label>
        <select aria-label="Filter follow-ups" value={followUp} onChange={(event) => setFollowUp(event.target.value)} style={input}><option value="">All follow-ups</option><option value="overdue">Overdue only ({overdueCount})</option><option value="upcoming">Next 30 days</option></select>
        {loading && <small style={{ color: "#887663" }}>Refreshing…</small>}
        <div style={{ display: "grid", gap: 7, maxHeight: 600, overflowY: "auto" }}>{contacts.map((contact) => <button type="button" key={contact._id} onClick={() => select(contact)} style={{ padding: 11, textAlign: "left", border: `1px solid ${selectedId === contact._id ? "#6c9279" : "#eee4d9"}`, borderRadius: 10, background: selectedId === contact._id ? "#f0f6ef" : "#fffdf9", cursor: "pointer", color: "#382b1d" }}><strong style={{ display: "block", fontSize: 12 }}>{contact.fullName}</strong><span style={{ display: "block", marginTop: 4, color: "#85725f", fontSize: 10 }}>{contact.jobTitle || "Role not recorded"}{contact.companyName ? ` · ${contact.companyName}` : ""}</span><span style={{ display: "flex", justifyContent: "space-between", gap: 7, marginTop: 7, color: "#68806c", fontSize: 9 }}><span>{contact.relationshipStatus?.replaceAll("_", " ")}</span>{contact.nextFollowUpAt && <span><CalendarClock size={11} style={{ verticalAlign: "-2px" }}/> {new Date(contact.nextFollowUpAt).toLocaleDateString()}</span>}</span></button>)}{!contacts.length && <div style={{ padding: 17, textAlign: "center", color: "#897765", fontSize: 11 }}>{search || followUp ? "No matching contacts." : "No HR contacts yet. Add a professionally sourced contact to start your relationship list."}</div>}</div>
      </aside>

      <div style={{ display: "grid", gap: 13 }}>
        {(selected || adding) ? <form onSubmit={saveContact} style={{ ...box, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))", gap: 11 }}>
          <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 8 }}><ContactRound size={18} color="#47745b"/><h2 style={{ margin: 0, fontFamily: "'Playfair Display',serif", fontSize: 19 }}>{adding ? "Add HR contact" : "Contact details"}</h2></div>
          {[["fullName", "Full name", true], ["jobTitle", "Professional role"], ["companyName", "Company"], ["workEmail", "Work email"], ["workPhone", "Work phone"], ["linkedInUrl", "Professional profile URL"], ["otherProfileUrl", "Other professional URL"], ["technologies", "Technologies (comma separated)"], ["hiringAreas", "Hiring areas (comma separated)"], ["source", "Source / how discovered", true], ["contactBasisDetails", "Contact basis details", true]].map(([key, title, required]) => <label key={key} style={label}>{title}<input required={Boolean(required)} type={key === "workEmail" ? "email" : "text"} value={form[key] || ""} onChange={(event) => change(key, event.target.value)} style={input}/></label>)}
          <label style={label}>Contact basis<select required value={form.contactBasis} onChange={(event) => change("contactBasis", event.target.value)} style={input}><option value="public_professional_info">Public professional information</option><option value="direct_consent">Direct consent</option><option value="referral">Referral</option><option value="existing_relationship">Existing relationship</option><option value="other">Other</option></select></label>
          <label style={label}>Relationship status<select value={form.relationshipStatus} onChange={(event) => change("relationshipStatus", event.target.value)} style={input}>{stages.map((stage) => <option key={stage} value={stage}>{stage.replaceAll("_", " ")}</option>)}</select></label>
          <label style={label}>Next follow-up<input type="date" value={form.nextFollowUpAt || ""} onChange={(event) => change("nextFollowUpAt", event.target.value)} style={input}/></label>
          <label style={{ ...label, gridColumn: "1/-1" }}>Private internal notes<textarea rows={3} value={form.privateNotes || ""} onChange={(event) => change("privateNotes", event.target.value)} style={{ ...input, resize: "vertical" }}/></label>
          <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 9, flexWrap: "wrap" }}><small style={{ color: "#887763", fontSize: 10 }}>The source and contact basis are required for every record.</small><button disabled={saving} type="submit" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 12px", border: 0, borderRadius: 8, background: "#2c5a49", color: "white", fontWeight: 700, cursor: "pointer" }}><Save size={14}/>{saving ? "Saving…" : adding ? "Create contact" : "Save changes"}</button></div>
        </form> : <div style={{ ...box, minHeight: 150, display: "grid", placeItems: "center", color: "#867560", textAlign: "center", fontSize: 12 }}>Select an HR contact or add one to manage details and relationship activity.</div>}

        {selected && <section style={{ ...box, display: "grid", gap: 12 }}><div><h2 style={{ margin: 0, fontFamily: "'Playfair Display',serif", fontSize: 18 }}>Activity & follow-up</h2><p style={{ margin: "4px 0 0", color: "#887663", fontSize: 10 }}>History is append-only so relationship records retain their timeline.</p></div>
          <form onSubmit={addActivity} style={{ display: "grid", gridTemplateColumns: "minmax(130px,.5fr) minmax(180px,1fr) auto", gap: 8, alignItems: "end" }}><label style={label}>Activity<select value={activityForm.type} onChange={(event) => setActivityForm({ ...activityForm, type: event.target.value })} style={input}>{activityTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label style={label}>Summary<input required value={activityForm.summary} onChange={(event) => setActivityForm({ ...activityForm, summary: event.target.value })} placeholder="Record a work-related interaction" style={input}/></label><button disabled={saving} type="submit" style={{ marginTop: 5, padding: "10px 12px", border: 0, borderRadius: 8, background: "#eadfcf", color: "#4b3a28", fontWeight: 700, cursor: "pointer" }}>Record</button><label style={{ ...label, gridColumn: "1/-1", maxWidth: 230 }}>Set next follow-up date<input type="date" value={activityForm.nextFollowUpAt} onChange={(event) => setActivityForm({ ...activityForm, nextFollowUpAt: event.target.value })} style={input}/></label></form>
          <div style={{ display: "grid", gap: 8 }}>{activities.map((activity) => <article key={activity._id} style={{ padding: "9px 11px", borderLeft: "2px solid #97b39a", background: "#f9faf6", borderRadius: "0 8px 8px 0" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "#786651", fontSize: 9 }}><strong>{activity.type.replaceAll("_", " ")}</strong><span>{new Date(activity.occurredAt).toLocaleString()}</span></div><p style={{ margin: "5px 0 0", color: "#4e4032", fontSize: 11 }}>{activity.summary}</p><small style={{ color: "#91816d", fontSize: 9 }}>By {activity.actorId?.fullName || "Admin"}{activity.nextFollowUpAt ? ` · Follow-up ${new Date(activity.nextFollowUpAt).toLocaleDateString()}` : ""}</small></article>)}{!activities.length && <small style={{ color: "#897765" }}>No activity has been recorded.</small>}</div>
          {selected.linkedInUrl && <a href={selected.linkedInUrl} target="_blank" rel="noreferrer" style={{ width: "fit-content", display: "inline-flex", alignItems: "center", gap: 5, color: "#396b54", fontSize: 11 }}>Open professional profile <ExternalLink size={13}/></a>}
        </section>}
      </div>
    </section>
    <style>{`@media(max-width:850px){.explorer-hr-layout{grid-template-columns:1fr!important}}@media(max-width:600px){.explorer-hr-layout form[style*="grid-template-columns"]{grid-template-columns:1fr!important}.explorer-hr-layout form>label{grid-column:1/-1!important}}`}</style>
  </main>;
}
