import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Play } from "lucide-react";
import { entertainmentAPI } from "../services/entertainmentApi.js";
import { useEntertainment } from "../../../context/EntertainmentContext.jsx";

export default function EntertainmentSearch() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "Bollywood songs");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { playTrack } = useEntertainment();

  useEffect(() => {
    const term = searchParams.get("q") || "Bollywood songs";
    setQuery(term);
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await entertainmentAPI.search(term);
        setItems(data.items || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [searchParams]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data } = await entertainmentAPI.search(query);
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem 7rem" }}>
      <p className="section-tag">Search</p>
      <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)", color: "#38250f", marginBottom: 18 }}>Bollywood music search</h1>

      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid rgba(157,106,39,.15)", borderRadius: 16, background: "rgba(255,255,255,.9)", padding: "0.75rem 0.9rem" }}>
          <Search size={18} color="#8c7258" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Arijit Singh, 90s Bollywood songs..." style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16 }} />
          <button className="btn-terra" onClick={handleSearch}>Search</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 18 }}>
        {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 18 }} />)
          : items.map((track) => (
            <div key={`${track.youtubeVideoId}-${track.title}`} className="card" style={{ overflow: "hidden" }}>
              <img src={track.thumbnail || `https://img.youtube.com/vi/${track.youtubeVideoId}/hqdefault.jpg`} alt={track.title} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover" }} />
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 11, color: "#8d5d23", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>{track.category || "Bollywood"}</div>
                <h3 style={{ margin: "0.35rem 0", fontSize: "1.2rem", color: "#38250f" }}>{track.title}</h3>
                <div style={{ color: "#5c4a32", fontSize: 13, marginBottom: 12 }}>{track.channelName || "YouTube"}</div>
                <button className="btn-outline" onClick={() => playTrack(track, items)} style={{ padding: "0 0.9rem", minHeight: 38 }}><Play size={14} /> Play</button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
