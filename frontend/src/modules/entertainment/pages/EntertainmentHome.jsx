import { useEffect, useMemo, useState } from "react";
import { Search, TrendingUp, Music2, Heart, Clock3, PlayCircle, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { entertainmentAPI } from "../services/entertainmentApi.js";
import { useEntertainment } from "../../../context/EntertainmentContext.jsx";

const categories = [
  { key: "trending", label: "🔥 Trending Bollywood", icon: TrendingUp },
  { key: "romantic", label: "❤️ Romantic Bollywood", icon: Heart },
  { key: "90s", label: "🎸 90s Bollywood", icon: Music2 },
  { key: "arijit", label: "🎶 Arijit Singh", icon: Sparkles },
  { key: "party", label: "💃 Bollywood Party", icon: Music2 },
  { key: "sad", label: "🌙 Late Night Bollywood", icon: Clock3 },
];

export default function EntertainmentHome() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, favorites, playlists, toggleFavorite } = useEntertainment();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = slug
          ? await entertainmentAPI.category(slug)
          : await entertainmentAPI.featured();
        setItems(data.items || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  const itemsToShow = useMemo(() => items.slice(0, 8), [items]);

  const handleSearch = async (value) => {
    const term = value.trim();
    if (!term) {
      const { data } = await entertainmentAPI.featured();
      setItems(data.items || []);
      return;
    }
    const { data } = await entertainmentAPI.search(term);
    setItems(data.items || []);
    navigate(`/entertainment/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "2rem 1rem 8rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        <div>
          <p className="section-tag">Entertainment</p>
          <h1 style={{ fontSize: "clamp(2.3rem,4vw,4rem)", color: "#38250f", margin: 0 }}>Bollywood Music & More</h1>
        </div>
      </div>

      <div className="card" style={{ padding: "1rem 1rem 1.25rem", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid rgba(157,106,39,.18)", borderRadius: 16, background: "rgba(255,255,255,.85)", padding: "0.7rem 0.9rem" }}>
          <Search size={18} color="#8c7258" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(query); }}
            placeholder="Search Bollywood songs"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16, color: "#38250f" }}
          />
          <button className="btn-terra" onClick={() => handleSearch(query)}>Search</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 30 }}>
        {categories.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => navigate(`/entertainment/category/${key}`)}
            style={{ background: "white", border: "1px solid rgba(157,106,39,.15)", borderRadius: 18, padding: "1rem 0.85rem", textAlign: "left", cursor: "pointer", color: "#38250f", boxShadow: "0 10px 28px rgba(157,106,39,.07)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
              <Icon size={18} color="#8d5d23" />
              {label}
            </div>
          </button>
        ))}
      </div>

      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "2rem", color: "#38250f", margin: 0 }}>Trending Bollywood</h2>
          <button className="btn-outline" onClick={() => navigate("/entertainment/category/trending")}>View all</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px,1fr))", gap: 18 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 230, borderRadius: 18 }} />
            ))
          ) : (
            itemsToShow.map((track) => (
              <article key={track.youtubeVideoId || track.id} className="card" style={{ overflow: "hidden" }}>
                <div style={{ position: "relative" }}>
                  <img src={track.thumbnail || `https://img.youtube.com/vi/${track.youtubeVideoId}/hqdefault.jpg`} alt={track.title} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover" }} />
                  <button onClick={() => playTrack(track, itemsToShow)} style={{ position: "absolute", right: 12, bottom: 12, width: 42, height: 42, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.72)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <PlayCircle size={32} />
                  </button>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ color: "#8d5d23", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>{track.category || "Bollywood"}</div>
                  <h3 style={{ margin: "0.35rem 0", fontSize: "1.35rem", color: "#38250f" }}>{track.title}</h3>
                  <div style={{ color: "#5c4a32", fontSize: 13 }}>{track.channelName || "YouTube"}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 12 }}>
                    <button className="btn-outline" onClick={() => playTrack(track, itemsToShow)} style={{ padding: "0 0.9rem", minHeight: 38 }}>Play</button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(track)}
                      style={{ fontSize: 12, color: favorites.some((item) => item.youtubeVideoId === track.youtubeVideoId) ? "#b91c1c" : "#8c7258", border: "none", background: "transparent", cursor: "pointer", fontWeight: 700 }}
                    >
                      {favorites.some((item) => item.youtubeVideoId === track.youtubeVideoId) ? "Saved" : "Favorite"}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 18 }}>
        <div className="card" style={{ padding: 20 }}>
          <p className="section-tag">Your Playlists</p>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.8rem", color: "#38250f" }}>{playlists.length}</h3>
          <p style={{ color: "#5c4a32", margin: 0 }}>Curated Bollywood playlists for every mood.</p>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <p className="section-tag">Favorites</p>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.8rem", color: "#38250f" }}>{favorites.length}</h3>
          <p style={{ color: "#5c4a32", margin: 0 }}>Your most-loved tracks keep following you.</p>
        </div>
      </section>
    </div>
  );
}
