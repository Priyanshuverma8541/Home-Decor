import { forwardRef, useImperativeHandle } from "react";
import useYouTubePlayer from "../hooks/useYouTubePlayer.js";

const YouTubePlayer = forwardRef(function YouTubePlayer({ videoId, onStateChange, compact = false, title }, ref) {
  const { containerRef, methods } = useYouTubePlayer(videoId, onStateChange);

  useImperativeHandle(ref, () => methods, [methods]);

  return (
    <div style={{
      width: "100%",
      borderRadius: compact ? 16 : 20,
      overflow: "hidden",
      background: "#1a120a",
      border: "1px solid rgba(157,106,39,.2)",
      boxShadow: "0 20px 48px rgba(52,35,18,0.18)",
      minHeight: compact ? 150 : 260,
      position: "relative",
    }}>
      {!videoId ? (
        <div style={{ height: compact ? 150 : 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#8c7258", fontWeight: 600 }}>
          Select a Bollywood song to begin
        </div>
      ) : null}
      <div ref={containerRef} style={{ width: "100%", height: compact ? 150 : 260, display: videoId ? "block" : "none" }} />
      {title && (
        <div style={{ position: "absolute", left: 12, bottom: 12, right: 12, color: "white", fontWeight: 600, fontSize: 13, textShadow: "0 2px 12px rgba(0,0,0,.4)" }}>
          {title}
        </div>
      )}
    </div>
  );
});

export default YouTubePlayer;
