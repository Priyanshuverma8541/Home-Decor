import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import MiniPlayer from "../../modules/entertainment/components/MiniPlayer.jsx";
import ExperienceSwitcher from "./ExperienceSwitcher.jsx";
import BottomNavigation from "./BottomNavigation.jsx";

export default function Layout({ onOpenPermissions }) {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (!hash) window.scrollTo({ top:0, behavior:"instant" }); }, [pathname, hash]);
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <Navbar />
      {pathname !== "/" && <ExperienceSwitcher />}
      <main style={{ flex:1, paddingTop:pathname === "/" ? 64 : 0, paddingBottom:"calc(86px + env(safe-area-inset-bottom,0px))" }}><Outlet /></main>
      <MiniPlayer />
      <Footer onOpenPermissions={onOpenPermissions} />
      <BottomNavigation />
    </div>
  );
}
