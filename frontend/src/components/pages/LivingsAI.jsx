import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUp, BookOpen, Bot, ChevronRight, CircleHelp, ExternalLink, Sparkles, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { livingsAIAPI } from "../../services/api.js";
import "./LivingsAI.css";

const suggestions = [
  "What can I do on Savitri Livings?",
  "Help me understand this page",
  "Where can I find my orders?",
  "What tools are available for developers?",
];

function pageName(path) {
  const routes = [
    [/^\/$/, "Savitri Livings home"], [/^\/shop/, "Shop"], [/^\/product/, "Product details"],
    [/^\/cart/, "Cart"], [/^\/account/, "My Account"], [/^\/marketplace/, "Marketplace"],
    [/^\/ecosystem/, "Ecosystem"], [/^\/growth-livings/, "Growth Livings"], [/^\/development/, "Development"],
    [/^\/tools\/developer-zone\/checklist/, "SFMC Checklist Editor"], [/^\/tools\/developer-zone/, "Developer Zone"],
    [/^\/partner-with-us/, "Partner with Us"], [/^\/faqs/, "FAQs"], [/^\/contact/, "Contact"],
  ];
  return routes.find(([pattern]) => pattern.test(path || "/"))?.[1] || "Savitri Livings platform";
}

function ReferenceList({ references = [] }) {
  if (!references.length) return null;
  return <div className="livings-ai-sources"><span><BookOpen size={13}/>Sources</span>{references.map((source) => (
    source.sourceUrl?.startsWith("/")
      ? <Link key={source.id} to={source.sourceUrl}>{source.sourceLabel || source.title}<ChevronRight size={12}/></Link>
      : source.sourceUrl?.startsWith("https://")
        ? <a key={source.id} href={source.sourceUrl} target="_blank" rel="noreferrer">{source.sourceLabel || source.title}<ExternalLink size={12}/></a>
        : <span key={source.id}>{source.sourceLabel || source.title}</span>
  ))}</div>;
}

export default function LivingsAI() {
  const location = useLocation();
  const { user } = useAuth();
  const fromPath = location.state?.from || new URLSearchParams(location.search).get("from") || "/";
  const currentPage = useMemo(() => pageName(fromPath), [fromPath]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const audience = user?.role === "admin" ? "Savitri Livings team" : user?.role === "vendor" ? "Partner" : user ? "Customer" : "Guest";

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, sending]);

  const send = async (event, suggestedText) => {
    event?.preventDefault();
    const prompt = (suggestedText ?? input).trim();
    if (!prompt || sending) return;
    const history = messages.slice(-6).map((item) => ({ role: item.role === "assistant" ? "model" : "user", text: item.text }));
    setInput(""); setError(""); setSending(true);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: prompt }]);
    try {
      const { data } = await livingsAIAPI.chat({ message: prompt, history, pagePath: fromPath });
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: data.answer, references: data.references || [] }]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "LivingsAI could not connect. Please try again.");
    } finally { setSending(false); }
  };

  return <main className="livings-ai-page">
    <div className="livings-ai-shell">
      <header className="livings-ai-heading">
        <div className="livings-ai-orb"><Sparkles size={27}/></div>
        <div><span className="livings-ai-eyebrow">SAVITRI LIVINGS · AI GUIDE</span><h1>LivingsAI</h1><p>One helpful guide for the Savitri Livings platform.</p></div>
        <div className="livings-ai-audience"><span className="livings-ai-live-dot"/>Gemini · {audience}</div>
      </header>

      <section className="livings-ai-workspace" aria-label="LivingsAI conversation">
        <div className="livings-ai-context"><div><CircleHelp size={16}/><span>Page context</span></div><b>{currentPage}</b><small>LivingsAI uses this page name to tailor its guidance. It does not receive your private page records.</small></div>
        <div className="livings-ai-conversation" aria-live="polite">
          {!messages.length ? <div className="livings-ai-welcome"><div className="livings-ai-welcome-icon"><Bot size={24}/></div><h2>What would you like to know?</h2><p>Ask about Savitri Livings, find a feature, or get help understanding the page you came from.</p><div className="livings-ai-suggestions">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={(event) => send(event, suggestion)} disabled={sending}>{suggestion}<ArrowUp size={14}/></button>)}</div></div> : <div className="livings-ai-message-list">{messages.map((message) => <article key={message.id} className={`livings-ai-message is-${message.role}`}><div className="livings-ai-avatar">{message.role === "assistant" ? <Sparkles size={15}/> : user?.fullName?.[0] || "Y"}</div><div className="livings-ai-message-body"><span className="livings-ai-message-name">{message.role === "assistant" ? "LivingsAI" : user?.fullName || "You"}</span><p>{message.text}</p><ReferenceList references={message.references}/></div></article>)}{sending && <article className="livings-ai-message is-assistant"><div className="livings-ai-avatar"><Sparkles size={15}/></div><div className="livings-ai-message-body"><span className="livings-ai-message-name">LivingsAI</span><div className="livings-ai-typing"><i/><i/><i/></div></div></article>}<div ref={endRef}/></div>}
        </div>
        <div className="livings-ai-composer-area">
          {error && <p className="livings-ai-error" role="alert">{error}</p>}
          <form className="livings-ai-composer" onSubmit={send}><textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Ask LivingsAI anything about Savitri Livings…" aria-label="Message LivingsAI" maxLength={1800} rows={2}/><button type="submit" aria-label="Send message" disabled={!input.trim() || sending}><ArrowUp size={18}/></button></form>
          <div className="livings-ai-composer-meta"><span>Enter to send · Shift + Enter for a new line</span><button type="button" onClick={() => { setMessages([]); setError(""); setInput(""); inputRef.current?.focus(); }} disabled={!messages.length || sending}><Trash2 size={13}/>New conversation</button></div>
        </div>
      </section>
      <footer className="livings-ai-footer">Answers are generated by Gemini and grounded in Savitri Livings information. LivingsAI may be wrong; verify important details with the relevant team or page.</footer>
    </div>
  </main>;
}
