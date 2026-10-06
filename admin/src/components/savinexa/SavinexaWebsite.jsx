import { useState } from "react";
import WebsiteSettings from "./WebsiteSettings.jsx";
import CatalogManager from "./CatalogManager.jsx";
import PromotionsPages from "./PromotionsPages.jsx";
import PushManager from "./PushManager.jsx";

const tabs = [["settings","Brand & layout"],["catalog","Products & categories"],["promotions","Promotions & pages"],["push","Web push"]];
const button = { border: 0, borderRadius: 8, padding: "10px 14px", color: "#fff", background: "#885129", fontWeight: 650, cursor: "pointer" };

export default function SavinexaWebsite() {
  const [tab, setTab] = useState("settings");
  return <div style={{ display: "grid", gap: 16, color: "#382719" }}>
    <header><p style={{ color: "#a66e28", margin: 0 }}>SaviNexa Website</p><h1 style={{ margin: "4px 0" }}>Website design & content</h1><p style={{ margin: 0, color: "#8c7060" }}>Configure the live storefront and manage its uploaded media from this Admin workspace.</p></header>
    <nav aria-label="SaviNexa website settings" style={{ display: "flex", gap: 7, overflowX: "auto", borderBottom: "1px solid #eadfd3", paddingBottom: 8 }}>{tabs.map(([id,label]) => <button key={id} onClick={() => setTab(id)} style={{ ...button, background: tab === id ? "#885129" : "#e9dfd5", color: tab === id ? "white" : "#513722", whiteSpace: "nowrap" }}>{label}</button>)}</nav>
    {tab === "settings" && <WebsiteSettings/>}
    {tab === "catalog" && <CatalogManager/>}
    {tab === "promotions" && <PromotionsPages/>}
    {tab === "push" && <PushManager/>}
  </div>;
}