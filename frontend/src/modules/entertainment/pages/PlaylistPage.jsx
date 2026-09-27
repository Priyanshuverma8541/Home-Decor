import { useState } from "react";
import { Play, Plus, Trash2, Music4 } from "lucide-react";
import { useEntertainment } from "../../../context/EntertainmentContext.jsx";

export default function PlaylistPage() {
  const { playlists, createPlaylist, addToPlaylist, currentTrack, playTrack } = useEntertainment();
  const [name, setName] = useState("");

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem 7rem" }}>
      <p className="section-tag">Playlists</p>
      <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)", color: "#38250f", marginBottom: 18 }}>Your Bollywood playlists</h1>

      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Create playlist" className="input" style={{ maxWidth: 280 }} />
          <button className="btn-terra" onClick={() => { createPlaylist(name); setName(""); }}>Create</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
        {playlists.map((playlist) => (
          <div key={playlist.id} className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: "#8c7258", textTransform: "uppercase", letterSpacing: "0.12em" }}>Playlist</div>
                <h3 style={{ margin: "0.25rem 0 0", color: "#38250f", fontSize: "1.7rem" }}>{playlist.name}</h3>
              </div>
              <button className="btn-outline" onClick={() => playlist.tracks.length && playTrack(playlist.tracks[0], playlist.tracks)} style={{ padding: "0 0.8rem", minHeight: 36 }}><Play size={14} /> Play</button>
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              {playlist.tracks.length ? playlist.tracks.map((track, index) => (
                <div key={`${track.youtubeVideoId}-${index}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0.55rem 0.75rem", borderRadius: 12, background: currentTrack?.youtubeVideoId === track.youtubeVideoId ? "rgba(244,206,124,0.12)" : "#fdf7ee", border: "1px solid rgba(157,106,39,.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 8, background: "#f4ce7c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#38250f" }}>{index + 1}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "#38250f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
                      <div style={{ fontSize: 12, color: "#5c4a32" }}>{track.channelName || "YouTube"}</div>
                    </div>
                  </div>
                  <button onClick={() => playTrack(track, playlist.tracks)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#8d5d23" }}><Music4 size={16} /></button>
                </div>
              )) : <div style={{ color: "#8c7258", padding: "0.7rem 0" }}>No tracks yet. Add songs from the search page.</div>}
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => addToPlaylist(playlist.id, currentTrack || { title: "Bollywood Love Song", youtubeVideoId: "r6qFjqQGVr0", thumbnail: "https://img.youtube.com/vi/r6qFjqQGVr0/hqdefault.jpg", channelName: "Savitri Livings", category: "romantic" })} className="btn-outline" style={{ padding: "0 0.8rem", minHeight: 36 }}><Plus size={14} /> Add current</button>
              <button style={{ background: "transparent", border: "none", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
