import { useRef, useEffect, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, X } from "lucide-react";
import { useEntertainment } from "../../../context/EntertainmentContext.jsx";
import YouTubePlayer from "./YouTubePlayer.jsx";

export default function MiniPlayer() {
  const playerRef = useRef(null);
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    playNext,
    playPrevious,
    togglePlay,
    toggleFavorite,
    favorites,
    setPlaybackMeta,
  } = useEntertainment();
  const [hiddenTrackId, setHiddenTrackId] = useState(null);

  useEffect(() => {
    if (!currentTrack) return;
    if (playerRef.current) {
      if (isPlaying) playerRef.current.playVideo?.();
      else playerRef.current.pauseVideo?.();
    }
  }, [currentTrack, isPlaying]);

  if (!currentTrack || hiddenTrackId === currentTrack.youtubeVideoId) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const isFavorite = favorites.some((item) => item.youtubeVideoId === currentTrack.youtubeVideoId);

  const handleTogglePlay = () => {
    if (isPlaying) {
      playerRef.current?.pauseVideo?.();
    } else {
      playerRef.current?.playVideo?.();
    }
    togglePlay();
  };

  const handleMute = () => {
    const nextMuted = !muted;
    playerRef.current?.[nextMuted ? "mute" : "unMute"]?.();
    setPlaybackMeta({ currentTime, duration, volume, muted: nextMuted });
  };

  return (
    <div style={{ position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 120, background: "rgba(30, 20, 12, 0.96)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, boxShadow: "0 25px 60px rgba(0,0,0,0.35)", backdropFilter: "blur(12px)", overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setHiddenTrackId(currentTrack.youtubeVideoId)}
        aria-label="Hide music player"
        title="Hide music player"
        style={{ ...buttonStyle, position: "absolute", top: 8, right: 8, zIndex: 1, width: 28, height: 28, background: "rgba(255,255,255,0.12)" }}
      >
        <X size={15} />
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.3fr)", gap: 12, padding: "40px 12px 12px", alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <YouTubePlayer
            ref={playerRef}
            videoId={currentTrack.youtubeVideoId}
            compact
            onStateChange={(state) => {
              if (state === 1) {
                setPlaybackMeta({ currentTime: 0, duration: 0, volume, muted });
              }
            }}
            title={currentTrack.title}
          />
        </div>

        <div style={{ minWidth: 0, color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "#f4ce7c", textTransform: "uppercase", letterSpacing: "0.12em" }}>{currentTrack.category || "Bollywood"}</div>
              <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{currentTrack.channelName || "YouTube"}</div>
            </div>
            <button
              onClick={() => toggleFavorite(currentTrack)}
              style={{ background: "transparent", border: "none", color: isFavorite ? "#ff7a7a" : "rgba(255,255,255,0.8)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}
              aria-label="Favorite song"
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, justifyContent: "center" }}>
            <button onClick={playPrevious} style={{ ...buttonStyle }}><SkipBack size={16} /></button>
            <button onClick={handleTogglePlay} style={{ ...buttonStyle, width: 42, height: 42, background: "rgba(244,206,124,.18)" }}>{isPlaying ? <Pause size={18} /> : <Play size={18} />}</button>
            <button onClick={playNext} style={{ ...buttonStyle }}><SkipForward size={16} /></button>
            <button onClick={handleMute} style={{ ...buttonStyle }}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ height: 4, background: "rgba(255,255,255,0.12)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, Math.max(0, progress))}%`, height: "100%", background: "linear-gradient(90deg, #f4ce7c, #d88f4a)", borderRadius: 999 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.68)", fontSize: 10, marginTop: 4 }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const buttonStyle = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
