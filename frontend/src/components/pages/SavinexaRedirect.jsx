import { useEffect } from "react";

export default function SavinexaRedirect() {
  useEffect(() => { window.location.replace("https://savinexa.vercel.app/"); }, []);
  return <main aria-live="polite" style={{ minHeight:"100vh", display:"grid", placeItems:"center", color:"#62431f", background:"#fffaf2", fontFamily:"'DM Sans',sans-serif" }}>Opening Savinexa…</main>;
}
