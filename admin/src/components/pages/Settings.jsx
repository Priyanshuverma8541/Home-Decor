import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Save, Upload, QrCode, Smartphone, Globe, Truck, Bell } from "lucide-react";
import { settingsAPI } from "../../services/api.js";
import { PageLoader, Button } from "../ui/index.jsx";
import toast from "react-hot-toast";

const CITIES = ["Buxar","Varanasi","Kolkata"];

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [qrFile,   setQrFile]   = useState(null);
  const [qrPreview,setQrPreview]= useState(null);
  const qrRef = useRef();

  useEffect(() => {
    settingsAPI.get().then(({ data }) => setSettings(data.settings)).catch(() => toast.error("Failed to load settings"));
  }, []);

  const set = (k) => (e) => setSettings(p => ({ ...p, [k]: e.target.value }));

  const toggleCity = (c) => {
    setSettings(p => ({
      ...p, activeCities: p.activeCities.includes(c) ? p.activeCities.filter(x=>x!==c) : [...p.activeCities, c]
    }));
  };

  const handleQrFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setQrFile(f); setQrPreview(URL.createObjectURL(f));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Save settings
      await settingsAPI.update({
        upiId: settings.upiId, brandName: settings.brandName, tagline: settings.tagline,
        contactPhone: settings.contactPhone, whatsappNumber: settings.whatsappNumber,
        instagramHandle: settings.instagramHandle, activeCities: settings.activeCities,
        freeDeliveryAbove: settings.freeDeliveryAbove, announcementText: settings.announcementText,
        showAnnouncement: settings.showAnnouncement, maintenanceMode: settings.maintenanceMode,
        waOrderTemplate: settings.waOrderTemplate, facebookUrl: settings.facebookUrl,
        razorpayKeyId: settings.razorpayKeyId,
      });
      // Upload QR if changed
      if (qrFile) {
        const fd = new FormData();
        fd.append("qr", qrFile);
        fd.append("upiId", settings.upiId);
        await settingsAPI.uploadQR(fd);
      }
      toast.success("Settings saved");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  if (!settings) return <PageLoader/>;

  const Section = ({ icon: Icon, title, children }) => (
    <div className="card" style={{ padding:"1.25rem 1.5rem", marginBottom:"1.25rem" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:"1rem", paddingBottom:"0.75rem", borderBottom:"1px solid #f0e8e0" }}>
        <Icon style={{ width:18, height:18, color:"#c96030" }}/>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", color:"#2c1f14" }}>{title}</h2>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }} className="setting-grid">
        {children}
      </div>
    </div>
  );

  const Field = ({ label, full, children }) => (
    <div style={ full ? { gridColumn:"span 2" } : {}}>
      <label className="label">{label}</label>
      {children}
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem", flexWrap:"wrap", gap:10 }}>
        <div>
          <p className="section-tag">Configuration</p>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", color:"#2c1f14" }}>Settings</h1>
        </div>
        <Button variant="clay" onClick={saveAll} loading={saving}>
          <Save style={{ width:15, height:15 }}/>Save All Changes
        </Button>
      </div>

      {/* Payment */}
      <Section icon={QrCode} title="Payment — UPI & QR">
        <Field label="UPI ID (editable anytime)">
          <input className="input" value={settings.upiId||""} onChange={set("upiId")} placeholder="6207855397@ybl"/>
        </Field>
        <Field label="Razorpay Key ID">
          <input className="input" value={settings.razorpayKeyId||""} onChange={set("razorpayKeyId")} placeholder="rzp_test_…"/>
        </Field>
        <Field label="QR Code Image" full>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {(qrPreview || settings.qrImageUrl) && (
              <img src={qrPreview||settings.qrImageUrl} alt="QR" style={{ width:80, height:80, objectFit:"contain", borderRadius:8, border:"1px solid #d4c4b0" }}/>
            )}
            <div>
              <button type="button" onClick={()=>qrRef.current.click()} className="btn-ghost" style={{ gap:6 }}>
                <Upload style={{ width:14, height:14 }}/>Upload new QR image
              </button>
              <p style={{ fontSize:"0.7rem", color:"#b09880", marginTop:4 }}>Download your UPI QR from PhonePe / GPay and upload here</p>
              <input ref={qrRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleQrFile}/>
            </div>
          </div>
        </Field>
      </Section>

      {/* Brand */}
      <Section icon={Globe} title="Brand & Contact">
        <Field label="Brand Name">
          <input className="input" value={settings.brandName||""} onChange={set("brandName")}/>
        </Field>
        <Field label="Tagline">
          <input className="input" value={settings.tagline||""} onChange={set("tagline")}/>
        </Field>
        <Field label="WhatsApp Number">
          <input className="input" value={settings.whatsappNumber||""} onChange={set("whatsappNumber")} placeholder="6207855397"/>
        </Field>
        <Field label="Instagram Handle">
          <input className="input" value={settings.instagramHandle||""} onChange={set("instagramHandle")} placeholder="livingcrafts__"/>
        </Field>
        <Field label="Contact Phone">
          <input className="input" value={settings.contactPhone||""} onChange={set("contactPhone")}/>
        </Field>
        <Field label="Facebook URL">
          <input className="input" value={settings.facebookUrl||""} onChange={set("facebookUrl")} placeholder="https://facebook.com/…"/>
        </Field>
        <Field label="WhatsApp Order Template" full>
          <textarea className="input" rows={3} style={{ resize:"vertical" }} value={settings.waOrderTemplate||""} onChange={set("waOrderTemplate")}/>
          <p style={{ fontSize:"0.7rem", color:"#b09880", marginTop:4 }}>Use {"{productName}"}, {"{qty}"}, {"{address}"}, {"{city}"} as placeholders</p>
        </Field>
      </Section>

      {/* Delivery */}
      <Section icon={Truck} title="Delivery & Cities">
        <Field label="Active Cities" full>
          <div style={{ display:"flex", gap:8 }}>
            {CITIES.map(c=>(
              <button type="button" key={c} onClick={()=>toggleCity(c)}
                style={{ padding:"0.4rem 1rem", borderRadius:20, fontSize:"0.875rem", fontWeight:500, cursor:"pointer", border:"1px solid", borderColor: settings.activeCities?.includes(c)?"#c96030":"#d4c4b0", background: settings.activeCities?.includes(c)?"#fae8d8":"white", color: settings.activeCities?.includes(c)?"#a84a22":"#6b5040" }}>
                {c}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Free Delivery Above (Rs.)">
          <input type="number" className="input" value={settings.freeDeliveryAbove||""} onChange={set("freeDeliveryAbove")}/>
        </Field>
      </Section>

      {/* Announcement */}
      <Section icon={Bell} title="Announcement Banner">
        <Field label="Announcement Text" full>
          <input className="input" value={settings.announcementText||""} onChange={set("announcementText")} placeholder="Free delivery this weekend in Buxar!"/>
        </Field>
        <Field label="Show Announcement" full>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <input type="checkbox" checked={settings.showAnnouncement||false} onChange={e=>setSettings(p=>({...p,showAnnouncement:e.target.checked}))} style={{ width:16, height:16, accentColor:"#c96030" }}/>
            <span style={{ fontSize:"0.875rem", color:"#2c1f14" }}>Display banner on website</span>
          </label>
        </Field>
        <Field label="Maintenance Mode" full>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <input type="checkbox" checked={settings.maintenanceMode||false} onChange={e=>setSettings(p=>({...p,maintenanceMode:e.target.checked}))} style={{ width:16, height:16, accentColor:"#ef4444" }}/>
            <span style={{ fontSize:"0.875rem", color:"#2c1f14" }}>Take site offline (maintenance)</span>
          </label>
        </Field>
      </Section>

      <style>{`@media(max-width:640px){.setting-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
