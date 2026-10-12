import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Search, UserPlus, ExternalLink, UserMinus, RefreshCw, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { leadAPI, productAPI } from "../../services/api.js";

const input = { width: "100%", padding: ".7rem .8rem", border: "1px solid #e6d9cb", borderRadius: 9, font: "inherit", color: "#2c1f14", background: "#fff" };
const button = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, border: 0, borderRadius: 8, padding: ".65rem .85rem", background: "#29483c", color: "white", fontWeight: 600, cursor: "pointer" };
const section = { background: "white", border: "1px solid #eee4da", borderRadius: 12, padding: 18 };
const stores = { livings: "https://home-decor-n2z6.vercel.app", kolkata: "https://savitri-kolkata.vercel.app" };

function waNumber(value = "") {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`;
  return digits;
}

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
  const [form, setForm] = useState({ name: "", phone: "", city: "Kolkata", consent: false, consentSource: "" });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");

  const loadContacts = async (page = contactPage, query = search) => {
    const { data } = await leadAPI.whatsappContacts({ page, limit: 100, ...(query ? { search: query } : {}) });
    setContacts(data.contacts || []);
    setContactTotal(data.total || 0);
    setContactPages(data.pages || 1);
  };
  const loadProducts = async () => {
    const { data } = await productAPI.getAll({ limit: 250 });
    setProducts(data.products || []);
  };
  useEffect(() => { loadProducts().catch(() => toast.error("Could not load products.")); }, []);
  useEffect(() => {
    const timer = setTimeout(() => loadContacts().catch(() => toast.error("Could not load the WhatsApp list.")), 250);
    return () => clearTimeout(timer);
  }, [search, contactPage]);

  const availableProducts = useMemo(() => products.filter((product) => store !== "kolkata" || product.kolkataVisible !== false), [products, store]);
  const selectedProduct = availableProducts.find((product) => product._id === productId);
  const productLink = selectedProduct ? `${stores[store]}/product/${encodeURIComponent(selectedProduct._id)}` : "";
  const openChat = (contact) => {
    const phone = waNumber(contact.phone || "");
    if (phone.length < 10 || phone.length > 15) { toast.error("This contact has an invalid WhatsApp number."); return; }
    const personalized = message.trim().replaceAll("{name}", contact.name || "there");
    const copy = `${personalized}${productLink ? `\n\n${selectedProduct.name} · ₹${Number(selectedProduct.price || 0).toLocaleString("en-IN")}\n${productLink}` : `\n\n${stores[store]}`}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(copy)}`, "_blank", "noopener,noreferrer");
  };
  const addContact = async (event) => {
    event.preventDefault();
    if (!form.consent) { toast.error("Confirm that this person agreed to promotional WhatsApp updates."); return; }
    setSaving(true);
    try {
      await leadAPI.addWhatsAppContact({
        name: form.name.trim(), phone: form.phone.trim(), city: form.city,
        contactConsent: { granted: true },
        marketingConsent: { granted: true, channels: ["whatsapp"] },
        consentSource: form.consentSource,
      });
      setForm({ name: "", phone: "", city: "Kolkata", consent: false, consentSource: "" });
      toast.success("Consented WhatsApp contact added to the shared CRM.");
      if (contactPage !== 1) setContactPage(1);
      else await loadContacts(1, search);
    } catch (error) { toast.error(error.response?.data?.message || "Could not save this contact."); }
    finally { setSaving(false); }
  };
  const removeContact = async (contact) => {
    setBusyId(contact._id);
    try {
      await leadAPI.updateWhatsAppConsent(contact._id, false);
      setContacts((current) => current.filter((item) => item._id !== contact._id));
      setContactTotal((current) => Math.max(0, current - 1));
      toast.success("Removed from promotional WhatsApp messages.");
    } catch (error) { toast.error(error.response?.data?.message || "Could not update consent."); }
    finally { setBusyId(""); }
  };

  return <div style={{ display: "grid", gap: 16 }}>
    <section style={{ ...section, background: "#f7f2ea" }}>
      <p className="section-tag" style={{ margin: 0 }}>Shared Savitri contact list</p>
      <h2 style={{ fontFamily: "'Playfair Display',serif", margin: "5px 0 8px", color: "#2c1f14" }}>WhatsApp product updates</h2>
      <p style={{ color: "#735f4e", lineHeight: 1.7, margin: 0 }}>Save people who have agreed to receive Savitri updates, prepare a store-specific message, then open each chat to review and send it yourself. This does not send automatically.</p>
    </section>

    <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,.8fr) minmax(0,1.2fr)", gap: 16 }} className="wa-marketing-grid">
      <section style={section}>
        <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><UserPlus size={18} color="#a66e28"/>Add an opted-in contact</h3>
        <form onSubmit={addContact} style={{ display: "grid", gap: 11 }}>
          <label style={{ display: "grid", gap: 5, fontSize: 13 }}>Name<input required minLength={2} maxLength={120} style={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
          <label style={{ display: "grid", gap: 5, fontSize: 13 }}>WhatsApp number<input required type="tel" placeholder="+91 98765 43210" style={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}/></label>
          <label style={{ display: "grid", gap: 5, fontSize: 13 }}>City / notes<input maxLength={120} style={input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}/></label>
          <label style={{ display: "grid", gap: 5, fontSize: 13 }}>Consent came from<select required style={input} value={form.consentSource} onChange={(e) => setForm({ ...form, consentSource: e.target.value })}><option value="">Choose a source</option><option value="in-person">In person</option><option value="whatsapp-chat">WhatsApp conversation</option><option value="written-message">Written message or email</option><option value="website-signup">Website signup</option><option value="other">Other</option></select></label>
          <label style={{ display: "flex", alignItems: "start", gap: 9, padding: 11, borderRadius: 9, background: "#fbf7f2", color: "#57483b", fontSize: 12, lineHeight: 1.55 }}><input required type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} style={{ marginTop: 2, accentColor: "#29483c" }}/><span>I confirm this person asked to receive Savitri product and offer updates on WhatsApp.</span></label>
          <button style={button} disabled={saving}>{saving ? "Saving…" : "Save contact"}</button>
        </form>
      </section>

      <section style={section}>
        <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><MessageCircle size={18} color="#16805c"/>Prepare a message</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={{ display: "grid", gap: 5, fontSize: 13 }}>Send from<select style={input} value={store} onChange={(e) => { setStore(e.target.value); setProductId(""); }}><option value="livings">Savitri Livings</option><option value="kolkata">Savitri Kolkata</option></select></label>
          <label style={{ display: "grid", gap: 5, fontSize: 13 }}>Optional product link<select style={input} value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">Store homepage only</option>{availableProducts.map((product) => <option key={product._id} value={product._id}>{product.name} · ₹{product.price}</option>)}</select></label>
        </div>
        <label style={{ display: "grid", gap: 5, fontSize: 13, marginTop: 10 }}>Message<textarea rows={5} maxLength={900} style={{ ...input, resize: "vertical" }} value={message} onChange={(e) => setMessage(e.target.value)}/></label>
        <p style={{ fontSize: 11, color: "#8c7060", lineHeight: 1.6, marginBottom: 0 }}><ShoppingBag size={13} style={{ verticalAlign: "-2px", marginRight: 5 }}/>Use <code>{"{name}"}</code> to personalize. Product details and the correct storefront link are added automatically when selected.</p>
      </section>
    </div>

    <section style={section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>Ready to message · {contactTotal}</h3>
        <div style={{ display: "flex", gap: 8 }}><label style={{ position: "relative" }}><Search size={14} style={{ position: "absolute", left: 10, top: 12, color: "#8c7060" }}/><input aria-label="Search opted-in contacts" placeholder="Search names or numbers" style={{ ...input, width: 230, paddingLeft: 30 }} value={search} onChange={(e) => { setContactPage(1); setSearch(e.target.value); }}/></label><button type="button" onClick={() => Promise.all([loadContacts(), loadProducts()]).catch(() => toast.error("Refresh failed."))} style={{ ...button, background: "white", color: "#5d4936", border: "1px solid #e6d9cb" }} aria-label="Refresh contacts"><RefreshCw size={14}/></button></div>
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        {contacts.map((contact) => <article key={contact._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", borderTop: "1px solid #f0e8e0", padding: "12px 0" }}><div><b>{contact.name}</b><div style={{ color: "#8c7060", fontSize: 12, marginTop: 3 }}>{contact.phone} · {contact.city || "City not set"} · consented {contact.marketingConsent?.grantedAt ? new Date(contact.marketingConsent.grantedAt).toLocaleDateString() : ""}</div></div><div style={{ display: "flex", gap: 7 }}><button type="button" onClick={() => openChat(contact)} style={button} disabled={!message.trim()}><ExternalLink size={14}/>Open WhatsApp</button><button type="button" title="Remove WhatsApp marketing consent" onClick={() => removeContact(contact)} disabled={busyId === contact._id} style={{ ...button, background: "#fff", color: "#8b4035", border: "1px solid #ead8d2" }}><UserMinus size={14}/>Remove</button></div></article>)}
        {!contacts.length && <p style={{ color: "#8c7060" }}>No opted-in contacts yet. Add one after they agree to receive product updates.</p>}
      </div>
      {contactPages > 1 && <div style={{ display:"flex", justifyContent:"end", alignItems:"center", gap:10, marginTop:10 }}><button type="button" style={{ ...button, background:"#fff", color:"#5d4936", border:"1px solid #e6d9cb" }} disabled={contactPage<=1} onClick={()=>setContactPage((page)=>page-1)}>Previous</button><small style={{ color:"#8c7060" }}>Page {contactPage} of {contactPages}</small><button type="button" style={{ ...button, background:"#fff", color:"#5d4936", border:"1px solid #e6d9cb" }} disabled={contactPage>=contactPages} onClick={()=>setContactPage((page)=>page+1)}>Next</button></div>}
      <p style={{ fontSize: 11, color: "#8c7060", marginBottom: 0 }}>Each WhatsApp conversation opens separately. Review the text and press Send in WhatsApp; the Admin never bulk-sends messages.</p>
    </section>
    <style>{`@media(max-width:760px){.wa-marketing-grid{grid-template-columns:1fr!important}}`}</style>
  </div>;
}
