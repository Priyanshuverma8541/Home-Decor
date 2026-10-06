import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { savinexaAPI } from "../../services/savinexaApi.js";

export default function SavinexaPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true; setLoading(true);
    savinexaAPI.getPage(slug).then(({ data }) => { if (active) setPage(data.page); }).catch(() => { if (active) setPage(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);
  if (loading) return <p style={{ padding: 40, textAlign: "center" }}>Loading page…</p>;
  if (!page) return <p style={{ padding: 40, textAlign: "center" }}>This page is unavailable.</p>;
  return <article style={{ maxWidth: 1100, margin: "auto", padding: "42px 20px 64px" }}><h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)" }}>{page.title}</h1>{(page.sections || []).map((section, index) => {
    const image = section.image || section.imageUrl;
    if (section.type === "image") return image ? <figure key={index} style={{ margin: "28px 0" }}><img src={image} alt={section.alt || ""} style={{ width: "100%", maxHeight: 620, objectFit: "cover", borderRadius: "var(--savinexa-radius)" }}/>{section.caption && <figcaption>{section.caption}</figcaption>}</figure> : null;
    if (section.type === "hero") return <section key={index} style={{ position: "relative", minHeight: 300, margin: "24px 0", borderRadius: "var(--savinexa-radius)", overflow: "hidden", color: "white", display: "grid", alignItems: "end", padding: 32, background: image ? `linear-gradient(0deg,rgba(0,0,0,.7),transparent),url(${JSON.stringify(image)}) center/cover` : "var(--savinexa-primary)" }}><h2>{section.heading}</h2><p>{section.body}</p>{section.ctaUrl && <Link to={section.ctaUrl} style={{ color: "inherit" }}>{section.ctaLabel || "Learn more"}</Link>}</section>;
    if (section.type === "cta") return <section key={index} style={{ padding: 28, margin: "24px 0", background: "var(--savinexa-accent)", borderRadius: "var(--savinexa-radius)" }}><h2>{section.heading}</h2><p>{section.body}</p>{section.ctaUrl && <Link to={section.ctaUrl}>{section.ctaLabel || "Explore"}</Link>}</section>;
    return <section key={index} style={{ margin: "24px 0", lineHeight: 1.75 }}><h2>{section.heading}</h2><p style={{ whiteSpace: "pre-line" }}>{section.body}</p></section>;
  })}<p><Link to="/savinexa">← Back to {"Savinexa"}</Link></p></article>;
}