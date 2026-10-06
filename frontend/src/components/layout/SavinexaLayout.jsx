import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Bell, Menu, X } from "lucide-react";
import { savinexaAPI } from "../../services/savinexaApi.js";
import NotificationButton from "../ui/NotificationButton.jsx";

const defaults = { siteName: "Savinexa", primaryColor: "#1f2937", secondaryColor: "#eab308", background: "#f8fafc", typography: "Inter", borderRadius: "18px", logo: "", favicon: "", footer: {}, contact: {}, socialLinks: {} };

export default function SavinexaLayout() {
  const [settings, setSettings] = useState(defaults);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    let active = true;
    savinexaAPI.getSettings().then(({ data }) => { if (active && data.settings) setSettings({ ...defaults, ...data.settings }); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty("--savinexa-primary", settings.primaryColor || defaults.primaryColor);
    document.documentElement.style.setProperty("--savinexa-accent", settings.secondaryColor || defaults.secondaryColor);
    document.documentElement.style.setProperty("--savinexa-background", settings.background || defaults.background);
    document.documentElement.style.setProperty("--savinexa-font", `\"${settings.typography || "Inter"}\", sans-serif`);
    document.documentElement.style.setProperty("--savinexa-radius", settings.borderRadius || defaults.borderRadius);
    document.title = settings.seo?.defaultMetaTitle || settings.siteName || defaults.siteName;
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && settings.favicon) favicon.href = settings.favicon;
    return () => {
      for (const name of ["--savinexa-primary", "--savinexa-accent", "--savinexa-background", "--savinexa-font", "--savinexa-radius"]) document.documentElement.style.removeProperty(name);
    };
  }, [settings]);

  const closeMenu = () => setMenuOpen(false);
  return <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--savinexa-background)", color: "var(--savinexa-primary)", fontFamily: "var(--savinexa-font)" }}>
    {settings.announcementBar?.enabled && settings.announcementBar.text && <a href={settings.announcementBar.link || "#"} style={{ display: "block", padding: "8px 16px", textAlign: "center", textDecoration: "none", background: settings.secondaryColor, color: settings.primaryColor, fontSize: 13, fontWeight: 600 }}>{settings.announcementBar.text}</a>}
    <header style={{ position: "sticky", top: 0, zIndex: 60, background: "rgba(255,255,255,.96)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e9e4dc" }}>
      <div style={{ minHeight: 68, maxWidth: 1240, padding: "0 20px", margin: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <Link to="/savinexa" onClick={closeMenu} style={{ display: "flex", alignItems: "center", gap: 10, color: "inherit", textDecoration: "none", fontWeight: 800, fontSize: 20 }}>
          {settings.logo ? <img src={settings.logo} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} /> : <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 12, background: "var(--savinexa-primary)", color: "white" }}><Bell size={18}/></span>}
          {settings.siteName || "Savinexa"}
        </Link>
        <button type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen(!menuOpen)} style={{ display: "none", border: 0, background: "transparent", color: "inherit" }} className="savinexa-menu-toggle">{menuOpen ? <X/> : <Menu/>}</button>
        <nav className={`savinexa-nav${menuOpen ? " open" : ""}`} style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {[ ["/savinexa", "Home"], ["/savinexa/products", "Products"], ["/savinexa/jobs", "Careers"] ].map(([to, label]) => <NavLink key={to} to={to} end={to === "/savinexa"} onClick={closeMenu} style={({ isActive }) => ({ textDecoration: "none", color: isActive ? "var(--savinexa-accent)" : "var(--savinexa-primary)", fontWeight: 600, fontSize: 14 })}>{label}</NavLink>)}
          <NotificationButton appId="app_savinexa" appName={settings.siteName || "Savinexa"}/>
        </nav>
      </div>
    </header>
    <style>{`@media(max-width:720px){.savinexa-menu-toggle{display:block!important}.savinexa-nav{display:none!important;position:absolute;top:100%;left:0;right:0;padding:16px 20px;background:white;border-bottom:1px solid #e9e4dc;flex-direction:column;align-items:stretch!important}.savinexa-nav.open{display:flex!important}}`}</style>
    <main style={{ flex: 1 }}><Outlet context={{ settings }}/></main>
    <footer style={{ background: settings.footer?.background || settings.primaryColor, color: settings.footer?.textColor || "#fff", padding: "32px 20px" }}><div style={{ maxWidth: 1200, margin: "auto", display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}><div><strong>{settings.siteName || "Savinexa"}</strong><p style={{ opacity: .78, maxWidth: 480 }}>{settings.footer?.tagline || "Thoughtful finds for everyday living."}</p></div><div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", fontSize: 14 }}>{settings.contact?.email && <a href={`mailto:${settings.contact.email}`} style={{ color: "inherit" }}>{settings.contact.email}</a>}{settings.socialLinks?.instagram && <a href={settings.socialLinks.instagram} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>Instagram</a>}{settings.socialLinks?.facebook && <a href={settings.socialLinks.facebook} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>Facebook</a>}</div></div></footer>
  </div>;
}