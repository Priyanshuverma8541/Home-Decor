import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Search, UserPlus, ExternalLink, UserMinus, RefreshCw, ShoppingBag, ImagePlus, X, MapPin, CalendarDays, ShieldCheck, Smartphone, Send, Users } from "lucide-react";
import toast from "react-hot-toast";
import { leadAPI, productAPI, savinexaAPI, API_BASE_URL } from "../../services/api.js";

const input = { width: "100%", padding: ".7rem .8rem", border: "1px solid #e6d9cb", borderRadius: 9, font: "inherit", color: "#2c1f14", background: "#fff" };
const button = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, border: 0, borderRadius: 9, padding: ".68rem .9rem", background: "#29483c", color: "white", fontWeight: 650, cursor: "pointer", textDecoration: "none" };
const section = { background: "white", border: "1px solid #eee4da", borderRadius: 16, padding: 20, boxShadow: "0 8px 24px #3d2d1b08" };
const stores = { livings: "https://home-decor-n2z6.vercel.app", kolkata: "https://savitri-kolkata.vercel.app" };
const subtle = { color: "#806e5d", fontSize: 12 };

function waNumber(value = "") {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`;
  return digits;
}
function initials(name = "") { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "SL"; }
function absoluteMediaUrl(url = "") { return /^https?:\/\//i.test(url) ? url : `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`; }

export default function WhatsAppMarketing() {
  const [contacts, setContacts] = useState([]);
  const [contactPage, setContactPage] = useState(1);
  const [contactPages, setContactPages] = useState(1);
  const [contactTotal, setContactTotal] = useState(0);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [store, setStore] = useState("livings");
  const [productId, setProductId] = useState("");
  const [message, setMessage] = useState("Hi {name}! I wanted to share a new Savitri Livings find with you. Have a look when you have a moment.");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", city: "Kolkata", consent: false, consentSource: "" });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");

  const loadContacts = async (page = contactPage, query = search) => {
    const { data } = await leadAPI.whatsappContacts({ page, limit: 100, ...(query ? { search: query } : {}) });
    setContacts(data.contacts || []); setContactTotal(data.total || 0); setContactPages(data.pages || 1);
  };
  const loadProducts = async () => { const { data } = await productAPI.getAll({ limit: 250 }); setProducts(data.products || []); };
  useEffect(() => { loadProducts().catch(() => toast.error("Could not load products.")); }, []);
  useEffect(() => { const timer = setTimeout(() => loadContacts().catch(() => toast.error("Could not load the WhatsApp list.")), 250); return () => clearTimeout(timer); }, [search, contactPage]);
  useEffect(() => () => { if (mediaPreview.startsWith("blob:")) URL.revokeObjectURL(mediaPreview); }, [mediaPreview]);

  const availableProducts = useMemo(() => products.filter((product) => store !== "kolkata" || product.kolkataVisible !== false), [products, store]);
  const selectedProduct = availableProducts.find((product) => product._id === productId);
  const productLink = selectedProduct ? `${stores[store]}/product/${encodeURIComponent(selectedProduct._id)}` : "";
  const personalizedMessage = (contact) => {
    const copy = message.trim().replaceAll("{name}", contact.name || "there");
    return `${copy}${productLink ? `\n\n${selectedProduct.name} · ₹${Number(selectedProduct.price || 0).toLocaleString("en-IN")}\n${productLink}` : `\n\n${stores[store]}`}${mediaUrl ? `\n\n${mediaUrl}` : ""}`;
  };
  const openChat = (contact) => {
    const phone = waNumber(contact.phone || "");
    if (phone.length < 10 || phone.length > 15) { toast.error("This contact has an invalid WhatsApp number."); return; }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(personalizedMessage(contact))}`, "_blank", "noopener,noreferrer");
  };
  const shareImage = async (contact) => {
    if (!mediaFile) return;
    const copy = personalizedMessage(contact);
    if (!navigator.canShare?.({ files: [mediaFile] })) { toast.error("Image sharing is not supported in this browser. Use Open WhatsApp; the image link is included."); return; }
    try { await navigator.share({ files: [mediaFile], title: "Savitri Livings offer", text: copy }); }
    catch (error) { if (error.name !== "AbortError") toast.error("Could not open the device share sheet."); }
  };
  const chooseImage = async (event) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) { toast.error("Choose a JPG, PNG or WebP image up to 5 MB."); return; }
    if (mediaPreview.startsWith("blob:")) URL.revokeObjectURL(mediaPreview);
    setMediaFile(file); setMediaPreview(URL.createObjectURL(file)); setMediaUrl(""); setUploading(true);
    try {
      const body = new FormData(); body.append("image", file);
      const { data } = await savinexaAPI.uploadImage(body);
      setMediaUrl(absoluteMediaUrl(data.url)); toast.success("Image uploaded and ready for outreach.");
    } catch (error) { setMediaFile(null); setMediaPreview(""); toast.error(error.response?.data?.message || "Could not upload the image."); }
    finally { setUploading(false); }
  };
  const clearImage = () => { if (mediaPreview.startsWith("blob:")) URL.revokeObjectURL(mediaPreview); setMediaFile(null); setMediaPreview(""); setMediaUrl(""); };
  const addContact = async (event) => {
    event.preventDefault();
    if (!form.consent) { toast.error("Confirm that this person agreed to promotional WhatsApp updates."); return; }
    setSaving(true);
    try {
      await leadAPI.addWhatsAppContact({ name: form.name.trim(), phone: form.phone.trim(), city: form.city, contactConsent: { granted: true }, marketingConsent: { granted: true, channels: ["whatsapp"] }, consentSource: form.consentSource });
      setForm({ name: "", phone: "", city: "Kolkata", consent: false, consentSource: "" }); toast.success("Consented WhatsApp contact added to the shared CRM.");
      if (contactPage !== 1) setContactPage(1); else await loadContacts(1, search);
    } catch (error) { toast.error(error.response?.data?.message || "Could not save this contact."); }
    finally { setSaving(false); }
  };
  const removeContact = async (contact) => {
    setBusyId(contact._id);
    try { await leadAPI.updateWhatsAppConsent(contact._id, false); setContacts((current) => current.filter((item) => item._id !== contact._id)); setContactTotal((current) => Math.max(0, current - 1)); toast.success("Removed from promotional WhatsApp messages."); }
    catch (error) { toast.error(error.response?.data?.message || "Could not update consent."); }
    finally { setBusyId(""); }
  };
  const shareSupported = Boolean(mediaFile && navigator.canShare?.({ files: [mediaFile] }));

  return <div style={{ display: "grid", gap: 18 }}>
    <section style={{ ...section, background: "linear-gradient(130deg,#f7f2ea,#fffdf9 72%)", padding: 24 }}>
      <p className="section-tag" style={{ margin: 0 }}>Shared Savitri contact list</p>
      <h2 style={{ fontFamily: "'Playfair Display',serif", margin: "5px 0 8px", color: "#2c1f14", fontSize: 27 }}>WhatsApp product updates</h2>
      <p style={{ color: "#735f4e", lineHeight: 1.7, margin: 0, maxWidth: 760 }}>Prepare personal messages for people who opted in. Add a product, write your note and include a campaign image. Review and send each message yourself in WhatsApp.</p>
      <div className="wa-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, marginTop: 20 }}>
        {[[Users, "Consented contacts", contactTotal, "#29483c"], [MessageCircle, "On this page", contacts.length, "#16805c"], [ShieldCheck, "Audience", "Opted in", "#a66e28"]].map(([Icon, label, value, color]) => <div key={label} style={{ background: "#fffefa", border: "1px solid #eee4da", borderRadius: 12, padding: "13px 15px", display: "flex", gap: 11, alignItems: "center" }}><span style={{ width: 36, height: 36, borderRadius: 11, display: "grid", placeItems: "center", background: `${color}12`, color }}><Icon size={18}/></span><div><small style={{ ...subtle, display: "block" }}>{label}</small><strong style={{ color: "#2c1f14", fontSize: 18 }}>{value}</strong></div></div>)}
      </div>
    </section>

    <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,.8fr) minmax(0,1.2fr)", gap: 16 }} className="wa-marketing-grid">
      <section style={section}>
        <h3 style={{ margin: "0 0 15px", display: "flex", alignItems: "center", gap: 8 }}><UserPlus size={18} color="#a66e28"/>Add an opted-in contact</h3>
        <form onSubmit={addContact} style={{ display: "grid", gap: 11 }}>
          <label style={{ display: "grid", gap: 5, fontSize: 13 }}>Name<input required minLength={2} maxLength={120} style={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
          <label style={{ display: "grid", gap: 5, fontSize: 13 }}>WhatsApp number<input required type="tel" placeholder="+91 98765 43210" style={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}/></label>
          <label style={{ display: "grid", gap: 5, fontSize: 13 }}>City / notes<input maxLength={120} style={input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}/></label>
          <label style={{ display: "grid", gap: 5, fontSize: 13 }}>Consent came from<select required style={input} value={form.consentSource} onChange={(e) => setForm({ ...form, consentSource: e.target.value })}><option value="">Choose a source</option><option value="in-person">In person</option><option value="whatsapp-chat">WhatsApp conversation</option><option value="written-message">Written message or email</option><option value="website-signup">Website signup</option><option value="other">Other</option></select></label>
          <label style={{ display: "flex", alignItems: "start", gap: 9, padding: 11, borderRadius: 10, background: "#fbf7f2", color: "#57483b", fontSize: 12, lineHeight: 1.55 }}><input required type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} style={{ marginTop: 2, accentColor: "#29483c" }}/><span>I confirm this person asked to receive Savitri product and offer updates on WhatsApp.</span></label>
          <button style={button} disabled={saving}>{saving ? "Saving…" : "Save contact"}</button>
        </form>
      </section>

      <section style={section}>
        <h3 style={{ margin: "0 0 15px", display: "flex", alignItems: "center", gap: 8 }}><MessageCircle size={18} color="#16805c"/>Prepare your message</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={{ display: "grid", gap: 5, fontSize: 13 }}>Send from<select style={input} value={store} onChange={(e) => { setStore(e.target.value); setProductId(""); }}><option value="livings">Savitri Livings</option><option value="kolkata">Savitri Kolkata</option></select></label>
          <label style={{ display: "grid", gap: 5, fontSize: 13 }}>Product link (optional)<select style={input} value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">Store homepage only</option>{availableProducts.map((product) => <option key={product._id} value={product._id}>{product.name} · ₹{product.price}</option>)}</select></label>
        </div>
        <label style={{ display: "grid", gap: 5, fontSize: 13, marginTop: 12 }}>Message<textarea rows={4} maxLength={900} style={{ ...input, resize: "vertical" }} value={message} onChange={(e) => setMessage(e.target.value)}/></label>
        <div style={{ marginTop: 12, border: "1px dashed #d9cbb9", borderRadius: 12, padding: 14, background: "#fdfaf5" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}><div><b style={{ color: "#3e3125", fontSize: 13 }}>Campaign image</b><p style={{ ...subtle, margin: "3px 0 0" }}>JPG, PNG or WebP · up to 5 MB</p></div><label style={{ ...button, background: "#fff", color: "#385344", border: "1px solid #d9cbb9", cursor: uploading ? "wait" : "pointer" }}><ImagePlus size={15}/>{uploading ? "Uploading…" : mediaFile ? "Change image" : "Add image"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} disabled={uploading} style={{ display: "none" }}/></label></div>
          {mediaPreview && <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 13, padding: 9, borderRadius: 10, background: "white", border: "1px solid #eee4da" }}><img src={mediaPreview} alt="WhatsApp outreach preview" style={{ width: 74, height: 74, objectFit: "cover", borderRadius: 8, background: "#f1ece3" }}/><div style={{ minWidth: 0, flex: 1 }}><b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{mediaFile?.name}</b><small style={subtle}>{uploading ? "Uploading image…" : mediaUrl ? "Uploaded and ready" : "Preparing image…"}</small></div><button type="button" onClick={clearImage} aria-label="Remove image" style={{ ...button, padding: 9, background: "#fff", color: "#8b4035", border: "1px solid #ead8d2" }}><X size={15}/></button></div>}
          <p style={{ ...subtle, margin: "10px 0 0", lineHeight: 1.6 }}>The direct chat includes the image link. On a supported phone, use “Share image” on a contact card to attach the actual image through your device’s share sheet.</p>
        </div>
        <p style={{ ...subtle, lineHeight: 1.6, marginBottom: 0 }}><ShoppingBag size={13} style={{ verticalAlign: "-2px", marginRight: 5 }}/>Use <code>{"{name}"}</code> to personalize. Product details and the selected store link are added automatically.</p>
      </section>
    </div>

    <section style={section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div><h3 style={{ margin: 0, color: "#2c1f14" }}>Your contacts</h3><small style={subtle}>Only people with WhatsApp marketing consent are shown.</small></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}><label style={{ position: "relative" }}><Search size={14} style={{ position: "absolute", left: 10, top: 12, color: "#8c7060" }}/><input aria-label="Search opted-in contacts" placeholder="Search names or numbers" style={{ ...input, width: "min(260px,55vw)", paddingLeft: 30 }} value={search} onChange={(e) => { setContactPage(1); setSearch(e.target.value); }}/></label><button type="button" onClick={() => Promise.all([loadContacts(), loadProducts()]).catch(() => toast.error("Refresh failed."))} style={{ ...button, background: "white", color: "#5d4936", border: "1px solid #e6d9cb", padding: 11 }} aria-label="Refresh contacts"><RefreshCw size={15}/></button></div>
      </div>
      <div className="wa-contact-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: 12, marginTop: 16 }}>
        {contacts.map((contact) => <article key={contact._id} style={{ border: "1px solid #eee4da", borderRadius: 14, padding: 15, background: "linear-gradient(135deg,#fffefa,#fff 78%)", minWidth: 0 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}><span aria-hidden="true" style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 15, display: "grid", placeItems: "center", background: "#e8efe8", color: "#29483c", fontWeight: 750, fontSize: 15 }}>{initials(contact.name)}</span><div style={{ minWidth: 0, flex: 1 }}><b style={{ display: "block", color: "#2c1f14", fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.name || "Unnamed contact"}</b><div style={{ display: "grid", gap: 3, marginTop: 3 }}><a href={`tel:${contact.phone}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#68766b", textDecoration: "none" }}><Smartphone size={12}/>{contact.phone}</a>{contact.email && <a href={`mailto:${contact.email}`} style={{ fontSize: 11, color: "#8c7060", textDecoration: "none" }}>{contact.email}</a>}</div></div><span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#24704f", background: "#eaf4ec", borderRadius: 20, padding: "5px 8px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}><ShieldCheck size={12}/>Opted in</span></div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "13px 0 14px", paddingTop: 11, borderTop: "1px solid #f0e8e0" }}><span style={{ ...subtle, display: "inline-flex", alignItems: "center", gap: 5 }}><MapPin size={13}/>{contact.city || "City not set"}</span><span style={{ ...subtle, display: "inline-flex", alignItems: "center", gap: 5 }}><CalendarDays size={13}/>Consent {contact.marketingConsent?.grantedAt ? new Date(contact.marketingConsent.grantedAt).toLocaleDateString() : "date unavailable"}</span>{contact.source && <span style={{ ...subtle, textTransform: "capitalize" }}>Added via {contact.source}</span>}</div>
          {Boolean(contact.interestedIn?.length || contact.budget) && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>{contact.interestedIn?.slice(0, 3).map((item) => <span key={item} style={{ borderRadius: 20, background: "#f4eee5", color: "#735b43", padding: "4px 8px", fontSize: 10 }}>{item}</span>)}{contact.budget && <span style={{ borderRadius: 20, background: "#f4eee5", color: "#735b43", padding: "4px 8px", fontSize: 10 }}>{contact.budget}</span>}</div>}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}><button type="button" onClick={() => openChat(contact)} style={{ ...button, flex: 1 }} disabled={!message.trim() || uploading}><ExternalLink size={14}/>Open WhatsApp</button>{shareSupported && <button type="button" onClick={() => shareImage(contact)} style={{ ...button, background: "#f4eee5", color: "#4e493b" }}><Send size={14}/>Share image</button>}<button type="button" title="Remove WhatsApp marketing consent" onClick={() => removeContact(contact)} disabled={busyId === contact._id} style={{ ...button, padding: 10, background: "#fff", color: "#8b4035", border: "1px solid #ead8d2" }} aria-label={`Remove ${contact.name} from WhatsApp marketing`}><UserMinus size={15}/></button></div>
        </article>)}
        {!contacts.length && <div style={{ gridColumn: "1/-1", border: "1px dashed #e6d9cb", borderRadius: 14, padding: 34, textAlign: "center", color: "#8c7060", background: "#fdfaf5" }}><Users size={25} style={{ marginBottom: 8, color: "#a98a67" }}/><p style={{ margin: 0 }}>{search ? "No contacts match that search." : "No opted-in contacts yet. Add someone after they agree to receive product updates."}</p></div>}
      </div>
      {contactPages > 1 && <div style={{ display: "flex", justifyContent: "end", alignItems: "center", gap: 10, marginTop: 15 }}><button type="button" style={{ ...button, background: "#fff", color: "#5d4936", border: "1px solid #e6d9cb" }} disabled={contactPage <= 1} onClick={() => setContactPage((page) => page - 1)}>Previous</button><small style={subtle}>Page {contactPage} of {contactPages}</small><button type="button" style={{ ...button, background: "#fff", color: "#5d4936", border: "1px solid #e6d9cb" }} disabled={contactPage >= contactPages} onClick={() => setContactPage((page) => page + 1)}>Next</button></div>}
      <p style={{ ...subtle, margin: "14px 0 0" }}>Each WhatsApp chat opens separately. Review the preview and tap Send in WhatsApp; the Admin does not bulk-send messages.</p>
    </section>
    <style>{`@media(max-width:760px){.wa-marketing-grid{grid-template-columns:1fr!important}.wa-summary-grid{grid-template-columns:1fr!important}}`}</style>
  </div>;
}
