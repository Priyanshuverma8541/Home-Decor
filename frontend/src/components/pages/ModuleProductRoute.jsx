import { Suspense, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, LoaderCircle, ShieldAlert } from "lucide-react";
import { moduleAPI } from "../../services/api.js";
export default function ModuleProductRoute({ internalEntries }) {
  const { section, productId } = useParams(); const [product, setProduct] = useState(null); const [state, setState] = useState("loading"); const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true; setState("loading"); setMessage("");
    moduleAPI.resolve(section, productId).then(({ data }) => { if (active) { setProduct(data.product); setState("ready"); } }).catch((error) => { if (active) { setMessage(error.response?.data?.message || "This product could not be opened."); setState(error.response?.status === 401 ? "auth" : "error"); } });
    return () => { active = false; };
  }, [section, productId]);

  if (state === "loading") return <main className="sl-module-state" role="status"><LoaderCircle className="sl-module-spin"/>Loading product…</main>;
  if (state === "error" || state === "auth") return <main className="sl-module-state" role="alert"><ShieldAlert size={28}/><h1>{state === "auth" ? "Sign in to continue" : "Product unavailable"}</h1><p>{message}</p>{state === "auth" ? <Link to="/login">Sign in</Link> : <Link to="/tools">Back to tools</Link>}<style>{`.sl-module-state{min-height:50vh;display:grid;place-content:center;justify-items:center;gap:10px;padding:25px;text-align:center;color:#4b3927}.sl-module-state p{color:#806f59}.sl-module-state a{color:#8b602c}.sl-module-spin{animation:slModuleSpin 1s linear infinite}@keyframes slModuleSpin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.sl-module-spin{animation:none}}`}</style></main>;

  const release = product.publishedRelease || {};
  if (release.integrationType === "internal") {
    const Entry = internalEntries[release.internalKey];
    return Entry ? <Suspense fallback={<main className="sl-module-state" role="status"><LoaderCircle className="sl-module-spin"/>Opening product…</main>}><Entry/></Suspense> : <main className="sl-module-state"><h1>Integration not available</h1><p>This internal entry point is not supported by this frontend version.</p></main>;
  }
  if (release.integrationType === "deployed") return <main className="sl-module-state"><div className="sl-module-summary"><span>PRODUCT · {product.category}</span><h1>{product.name}</h1><p>{product.description}</p><a href={release.deploymentUrl} target="_blank" rel="noreferrer">Open {product.name}<ExternalLink size={16}/></a><Link to="/tools"><ArrowLeft size={14}/> Back to Savitri Livings</Link></div><style>{`.sl-module-state{min-height:50vh;display:grid;place-content:center;padding:24px;color:#4b3927}.sl-module-summary{max-width:680px;padding:clamp(25px,6vw,56px);border:1px solid #e8dcc9;border-radius:22px;background:#fffdf9;box-shadow:0 18px 50px #4d34101a}.sl-module-summary>span{color:#99713b;font-size:.65rem;letter-spacing:.14em;font-weight:800}.sl-module-summary h1{margin:10px 0;font:500 clamp(2.5rem,7vw,4.2rem)/.98 'Cormorant Garamond',Georgia,serif}.sl-module-summary p{color:#806f59;line-height:1.7}.sl-module-summary a{display:flex;align-items:center;gap:8px;width:fit-content;margin-top:15px;color:#81572a;font-weight:700;text-decoration:none}`}</style></main>;
  if (release.integrationType === "iframe" || release.integrationType === "microfrontend") {
    let deploymentOrigin = ""; try { deploymentOrigin = new URL(release.deploymentUrl).origin.toLowerCase(); } catch {}
    const allowlisted = (release.allowedOrigins || []).some((origin) => { try { return new URL(origin).origin.toLowerCase() === deploymentOrigin; } catch { return false; } });
    if (!allowlisted) return <main className="sl-module-state" role="alert"><h1>Integration blocked</h1><p>The deployment origin is not in this product’s approved allowlist.</p></main>;
    return <main className="sl-module-embed"><header><strong>{product.name}</strong><Link to="/tools"><ArrowLeft size={14}/> Savitri Livings</Link></header><iframe title={product.name} src={release.deploymentUrl} sandbox="allow-scripts allow-forms allow-popups allow-downloads" referrerPolicy="strict-origin" loading="lazy"/><style>{`.sl-module-embed{display:flex;flex-direction:column;min-height:70vh}.sl-module-embed header{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 16px;background:#fffdf9;border-bottom:1px solid #eee4da;color:#473523}.sl-module-embed header a{display:inline-flex;align-items:center;gap:5px;color:#85602f;font-size:12px;text-decoration:none}.sl-module-embed iframe{width:100%;flex:1;min-height:70vh;border:0;background:#fff}`}</style></main>;
  }
  return <main className="sl-module-state"><h1>{product.name}</h1><p>This API product is registered. It does not have a browser interface.</p><p>Contact Savitri Livings Admin for the approved integration contract.</p></main>;
}
