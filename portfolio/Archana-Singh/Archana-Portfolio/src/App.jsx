import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, BriefcaseBusiness, Mail, ShieldCheck } from "lucide-react";
import { getPublishedPortfolio } from "./services/api.js";
const BuildingExperience = lazy(() => import("./3d/BuildingExperience.jsx"));

const PROFILE_SLUG = "archana-singh";

export default function App() {
  const [profile, setProfile] = useState(null);
  const [state, setState] = useState("loading");
  const [activeRoom, setActiveRoom] = useState("welcome");
  useEffect(() => { let live = true; getPublishedPortfolio(PROFILE_SLUG).then((value) => { if (live) { setProfile(value); setState("ready"); document.title = `${value.name} | Professional Portfolio`; } }).catch(() => { if (live) setState("private"); }); return () => { live = false; }; }, []);
  const chooseRoom = useCallback((room) => setActiveRoom(room), []);
  if (state === "loading") return <main className="portfolio-state"><span className="loading-orbit" /><p>Checking portfolio availability…</p></main>;
  if (state === "private") return <main className="portfolio-private"><div className="private-mark">GL<span>·</span></div><p className="eyebrow">GROWTH LIVINGS · PROFESSIONAL PORTFOLIO</p><h1>This portfolio is being prepared.</h1><p>Professional information appears here only after its owner approves publication.</p><a href="https://home-decor-inky.vercel.app/growth-livings">Explore Growth Livings <ArrowUpRight size={16} /></a></main>;

  const { name, headline, summary, city, skills = [], experience = [], education = [], projects = [], resumeUrl, contactEmail } = profile;
  const sections = { welcome: ["Profile", summary], engineering: ["Experience", experience], management: ["Projects", projects], surveying: ["Education", education] };
  const [sectionTitle, sectionValue] = sections[activeRoom] || sections.welcome;
  const activeRoomIndex = ["welcome", "engineering", "management", "surveying"].indexOf(activeRoom) + 1;
  return <main className="portfolio-shell">
    <nav className="portfolio-nav"><a className="wordmark" href="#top">GROWTH<span> LIVINGS</span></a><span>PROFESSIONAL PROFILE · {city || "INDIA"}</span><a href="#contact">Connect <ArrowUpRight size={15} /></a></nav>
    <section className="portfolio-hero" id="top"><div className="hero-copy"><p className="eyebrow"><ShieldCheck size={14} /> OWNER APPROVED PROFILE</p><h1>{name}</h1><p className="hero-role">{headline}</p><p className="hero-summary">{summary}</p><div className="hero-actions"><a className="button-primary" href="#profile">Explore profile <ArrowDown size={16} /></a>{resumeUrl && <a className="button-secondary" href={resumeUrl} target="_blank" rel="noreferrer">View résumé <ArrowUpRight size={16} /></a>}</div></div><div className="hero-visual"><div className="visual-grid" /><div className="visual-sphere" /><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="visual-label">{city || "PROFESSIONAL"}<span>Growth Livings · Portfolio</span></div></div></section>
    <section className="portfolio-scene" id="profile"><div className="section-heading"><div><p className="eyebrow">INTERACTIVE PROFILE</p><h2>Explore the workspace</h2></div><p>Choose a room to explore verified profile details.</p></div><Suspense fallback={<div className="architecture-fallback" role="status">Loading the interactive portfolio scene…</div>}><BuildingExperience onChooseRoom={chooseRoom} /></Suspense><div className="room-detail"><span className="detail-index">{String(activeRoomIndex).padStart(2,"0")} / 04</span><div><p className="eyebrow">{sectionTitle.toUpperCase()}</p>{typeof sectionValue === "string" ? <p>{sectionValue || "Details will be added to this profile."}</p> : sectionValue?.length ? <ul>{sectionValue.map((entry, index) => <li key={index}>{typeof entry === "string" ? entry : <><strong>{entry.title || entry.role || entry.degree}</strong><span>{entry.organization || entry.company || entry.institution || entry.description}</span></>}</li>)}</ul> : <p>Details will be added to this profile.</p>}</div></div></section>
    {skills.length > 0 && <section className="skills-section"><p className="eyebrow">AREAS OF EXPERTISE</p><div className="skills-list">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section>}
    <section className="portfolio-contact" id="contact"><div><p className="eyebrow"><BriefcaseBusiness size={14} /> CONNECT THROUGH GROWTH LIVINGS</p><h2>Build what comes next.</h2><p>For professional conversations and opportunities.</p></div><a className="button-primary" href={contactEmail ? `mailto:${contactEmail}` : "https://home-decor-inky.vercel.app/growth-livings"}>{contactEmail ? <><Mail size={16} /> Send an enquiry</> : <>Connect <ArrowUpRight size={16} /></>}</a></section>
    <footer className="portfolio-footer"><a className="wordmark" href="https://home-decor-inky.vercel.app/growth-livings">GROWTH<span> LIVINGS</span></a><span>Professional identity, shared with permission.</span><a href="https://home-decor-inky.vercel.app">Savitri Livings <ArrowUpRight size={14} /></a></footer>
  </main>;
}
