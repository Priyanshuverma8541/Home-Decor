import { NavLink, useLocation } from "react-router-dom";
import { Compass, Gem, Hammer, Utensils } from "lucide-react";

const tabs = [
  { label: "Shop", description: "Discover products", to: "/shop", Icon: Gem, title: "Shop Savitri Livings" },
  { label: "SL Explorer", description: "Explore your city", to: "/marketplace", Icon: Compass, title: "Explore local listings and services" },
];

export default function ExperienceSwitcher({ hidden = false, homepage = false }) {
  const { pathname } = useLocation();
  if (hidden) return null;
  return <nav className={`experience-switcher${homepage ? " experience-switcher-home" : ""}`} aria-label="Savitri Livings experiences">
    {tabs.map(({ label, description, to, Icon, title }) => <NavLink key={to} to={to} title={title} className={({ isActive }) => `experience-tab experience-tab-shop${(isActive || (to === "/shop" && (pathname === "/" || pathname.startsWith("/product/")))) ? " is-active" : ""}`}>
      <Icon aria-hidden="true" size={homepage ? 24 : 16} /><span>{label}<small>{description}</small></span>
    </NavLink>)}
    <button className="experience-tab experience-tab-food is-unavailable" type="button" disabled aria-disabled="true" title="Food ordering is coming soon">
      <Utensils aria-hidden="true" size={homepage ? 24 : 16} /><span>Food & Snacks<small>{homepage ? "Taste your city" : "Coming soon"}</small></span>
    </button>
    <a className="experience-tab experience-tab-build" href="https://build-hub-lake.vercel.app/" target="_blank" rel="noopener noreferrer" title="Open BuildHub in a new tab">
      <Hammer aria-hidden="true" size={homepage ? 24 : 16} /><span>BuildHub<small>Build something</small></span>
    </a>
    <style>{`
      .experience-switcher{position:sticky;top:64px;z-index:90;display:flex;align-items:center;justify-content:center;gap:5px;min-height:52px;margin-top:64px;padding:5px max(12px,env(safe-area-inset-left)) 5px max(12px,env(safe-area-inset-right));overflow-x:auto;scrollbar-width:none;background:#fffdf9;border-bottom:1px solid rgba(99,71,42,.1);white-space:nowrap}
      .experience-switcher::-webkit-scrollbar{display:none}.experience-tab{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;gap:7px;min-height:38px;padding:0 13px;border:1px solid transparent;border-radius:999px;background:transparent;color:#705c43;text-decoration:none;font:600 .78rem 'DM Sans',sans-serif;transition:background .2s,color .2s,border-color .2s}
      .experience-tab:hover{background:#f6f0e7;color:#483522}.experience-tab.is-active{background:#3e3028;color:#fff8ed}.experience-tab.is-active svg{color:#e4c58f}.experience-tab.is-unavailable{opacity:.72;cursor:not-allowed}.experience-tab small{display:block;margin-top:3px;font-size:.58rem;font-weight:500;color:#947c5f}
      .experience-switcher-home{position:relative;top:auto;z-index:2;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;max-width:1280px;min-height:0;margin:0 auto;padding:14px clamp(14px,3vw,28px) 16px;border:0;background:transparent;overflow:visible;white-space:normal}
      .experience-switcher-home .experience-tab{min-height:92px;flex-direction:column;gap:7px;padding:12px 8px;border:1px solid transparent;border-radius:18px;white-space:normal;text-align:center;font-size:.82rem;box-shadow:0 5px 18px rgba(62,44,25,.06)}
      .experience-switcher-home .experience-tab>span{line-height:1.15}.experience-switcher-home .experience-tab small{margin-top:4px;font-size:.67rem;color:inherit;opacity:.78}
      .experience-switcher-home .experience-tab-shop{background:#f6e3bf;color:#644017;border-color:#e0bd7b}.experience-switcher-home .experience-tab-shop.is-active{background:#f2d39b;color:#4b2d12}
      .experience-switcher-home .experience-tab:nth-child(2){background:#e6eee2;color:#355a3d}.experience-switcher-home .experience-tab-food{background:#fae4d9;color:#874b31}.experience-switcher-home .experience-tab-build{background:#e5e9fa;color:#374c81}
      @media(max-width:520px){.experience-switcher{justify-content:flex-start;gap:2px;padding-inline:8px}.experience-tab{gap:5px;padding:0 10px;font-size:.7rem}.experience-switcher:not(.experience-switcher-home) .experience-tab small{display:none}.experience-switcher-home{gap:7px;padding-inline:14px}.experience-switcher-home .experience-tab{min-height:82px;padding:9px 5px;border-radius:15px;font-size:.67rem}.experience-switcher-home .experience-tab svg{width:22px;height:22px}.experience-switcher-home .experience-tab small{font-size:.56rem}}
      @media(max-width:360px){.experience-switcher-home{gap:5px;padding-inline:10px}.experience-switcher-home .experience-tab{min-height:78px;font-size:.61rem}}
    `}</style>
  </nav>;
}

