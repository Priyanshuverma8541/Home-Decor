import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

export default function Layout() {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (!hash) window.scrollTo({ top:0, behavior:"instant" }); }, [pathname, hash]);
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <Navbar />
      <main style={{ flex:1, paddingTop:64 }}><Outlet /></main>
      <Footer />
    </div>
  );
}
