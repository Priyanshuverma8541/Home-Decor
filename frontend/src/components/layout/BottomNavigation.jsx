import { NavLink } from "react-router-dom";
import { BriefcaseBusiness, Home, Store, UserRound, Wrench } from "lucide-react";

const destinations = [
  { label: "Home", to: "/", Icon: Home, end: true },
  { label: "Thikana", to: "/marketplace", Icon: Store },
  { label: "SL Business", to: "/ecosystem", Icon: BriefcaseBusiness },
  { label: "Tools", to: "/tools", Icon: Wrench },
  { label: "Account", to: "/account", Icon: UserRound },
];

export default function BottomNavigation({ hidden = false }) {
  if (hidden) return null;
  return <nav className="bottom-navigation" aria-label="Main destinations">
    {destinations.map(({ label, to, Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `bottom-destination${isActive ? " is-active" : ""}`}>
      <Icon size={19} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>
    </NavLink>)}
    <style>{`
      .bottom-navigation{position:fixed;z-index:130;left:50%;bottom:calc(7px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(100% - 16px,720px);min-height:66px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:center;padding:5px 8px;background:rgba(255,253,249,.96);border:1px solid rgba(97,69,39,.13);border-radius:19px;box-shadow:0 12px 38px rgba(46,32,21,.18);backdrop-filter:blur(18px)}
      .bottom-destination{min-width:0;min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#79674f;text-decoration:none;font:600 .63rem 'DM Sans',sans-serif;white-space:nowrap}.bottom-destination svg{color:#8d7654}.bottom-destination.is-active{color:#684720}.bottom-destination.is-active svg{color:#ad7d38;stroke-width:2.2}
      @media(min-width:800px){.bottom-navigation{bottom:16px;min-height:60px;padding:5px 12px;border-radius:999px}.bottom-destination{flex-direction:row;gap:8px;min-height:46px;padding:0 10px;font-size:.78rem}}
      @media(max-width:360px){.bottom-destination{font-size:.56rem}.bottom-navigation{padding-inline:3px}}
    `}</style>
  </nav>;
}
