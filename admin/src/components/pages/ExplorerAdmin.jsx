import { ArrowUpRight, BriefcaseBusiness, Building2, Compass, ExternalLink, Network, ShieldCheck, Sparkles, Users, Workflow } from "lucide-react";
import { Link } from "react-router-dom";

const areas = [
  { title: "Growth Livings", description: "Professional profiles, candidate approvals, companies, published jobs and portfolio websites.", to: "/growth-livings", label: "Manage Growth Livings", Icon: BriefcaseBusiness, status: "Live workflows" },
  { title: "Savinexa Talent", description: "Open the existing Savinexa talent and enquiry workspace to manage internal roles and enquiries.", to: "/savinexa", label: "Manage Savinexa", Icon: Users, status: "Existing workspace" },
  { title: "SL Business", description: "Review business partnership submissions and manage relationship stages and follow-ups.", to: "/business-opportunities", label: "Manage business opportunities", Icon: Building2, status: "Live workflows" },
  { title: "Opportunities", description: "Manage Growth Livings jobs and applications; public discovery follows each source product’s publishing rules.", to: "/growth-livings", label: "Manage jobs & applications", Icon: Network, status: "Source-managed" },
];

const operations = [
  { title: "HR Networking CRM", detail: "Track professional contacts, relationship stages, activity and follow-up dates.", to: "/explorer/hr-crm", Icon: Users },
  { title: "Privacy & consent", detail: "Review consent records and privacy operations.", to: "/privacy", Icon: ShieldCheck },
  { title: "Analytics", detail: "Open the current platform analytics workspace.", to: "/analytics", Icon: Workflow },
  { title: "LivingsAI", detail: "Manage the current AI knowledge and context content.", to: "/livings-ai", Icon: Sparkles },
];

export default function ExplorerAdmin() {
  return <main style={{ display: "grid", gap: 22, color: "#33251a" }}>
    <header style={{ padding: "clamp(20px,4vw,34px)", borderRadius: 18, color: "#f9f5ec", background: "radial-gradient(ellipse at 85% 10%,#52796a 0,transparent 36%),linear-gradient(125deg,#172f2d,#25473d 58%,#182b2b)", boxShadow: "0 18px 45px #1e382b24" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, color: "#efca78", fontSize: 11, letterSpacing: ".16em", fontWeight: 700 }}><Compass size={16}/> SAVITRI EXPLORER · OPERATIONS</div>
      <h1 style={{ margin: "13px 0 7px", fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.8rem,4vw,2.7rem)" }}>One workspace. Four connected journeys.</h1>
      <p style={{ maxWidth: 690, margin: 0, color: "#d3ded7", lineHeight: 1.7, fontSize: 14 }}>Use this control room to enter the existing Growth Livings, Savinexa Talent, SL Business and Opportunities workflows. Each module continues to own its records and approval rules.</p>
    </header>

    <section aria-label="Explorer modules" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,250px),1fr))", gap: 13 }}>
      {areas.map(({ title, description, to, label, Icon, status }, index) => <article key={title} style={{ display: "grid", alignContent: "start", gap: 12, padding: 18, border: "1px solid #eadfd3", borderRadius: 15, background: "linear-gradient(145deg,#fffefa,#fbf7f0)", boxShadow: "0 8px 24px #38281508", animation: `explorerAdminIn .45s ${index * 75}ms both` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}><span style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 12, color: "#315848", background: "#e8f0e9" }}><Icon size={21}/></span><span style={{ color: "#66816f", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>{status}</span></div>
        <div><h2 style={{ margin: "2px 0 6px", fontFamily: "'Playfair Display',serif", fontSize: 20 }}>{title}</h2><p style={{ margin: 0, minHeight: 58, color: "#796b5b", fontSize: 12, lineHeight: 1.65 }}>{description}</p></div>
        <Link to={to} style={{ display: "inline-flex", alignItems: "center", gap: 7, width: "fit-content", color: "#285544", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>{label}<ArrowUpRight size={15}/></Link>
      </article>)}
    </section>

    <section style={{ display: "grid", gap: 10 }}><div><p style={{ margin: 0, color: "#a66e28", fontSize: 10, fontWeight: 700, letterSpacing: ".14em" }}>SHARED OPERATIONS</p><h2 style={{ margin: "5px 0 0", fontFamily: "'Playfair Display',serif", fontSize: 22 }}>Platform controls</h2></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 11 }}>{operations.map(({ title, detail, to, Icon }) => <Link key={title} to={to} style={{ display: "flex", alignItems: "center", gap: 12, padding: 15, border: "1px solid #eadfd3", borderRadius: 12, background: "white", color: "inherit", textDecoration: "none" }}><Icon size={19} color="#a66e28"/><span style={{ flex: 1 }}><strong style={{ display: "block", fontSize: 13 }}>{title}</strong><small style={{ display: "block", marginTop: 4, color: "#82715f", fontSize: 11, lineHeight: 1.5 }}>{detail}</small></span><ExternalLink size={14} color="#9c8b78"/></Link>)}</div></section>

    <p style={{ margin: 0, padding: "12px 14px", borderLeft: "3px solid #d1ae6e", background: "#faf5e9", color: "#77664f", fontSize: 11, lineHeight: 1.6 }}>The HR Networking CRM is restricted to Savitri admins and captures source and contact basis for each record. Unified cross-module search and AI-assisted talent matching remain future phases.</p>
    <style>{`@keyframes explorerAdminIn{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){article{animation:none!important}}`}</style>
  </main>;
}
