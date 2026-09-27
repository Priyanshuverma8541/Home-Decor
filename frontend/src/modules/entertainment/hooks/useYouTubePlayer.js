import { useCallback, useEffect, useRef } from "react";

const ensureYouTubeApi = () => new Promise((resolve, reject) => {
  if (window.YT && window.YT.Player) {
    resolve();
    return;
  }

  const existing = document.querySelector("script[src='https://www.youtube.com/iframe_api']");
  if (existing) {
    const interval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(interval);
        resolve();
      }
    }, 250);
    return;
  }

  const script = document.createElement("script");
  script.src = "https://www.youtube.com/iframe_api";
  script.async = true;
  script.onload = () => {
    const interval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(interval);
        resolve();
      }
    }, 250);
  };
  script.onerror = () => reject(new Error("Failed to load YouTube IFrame API"));
  document.body.appendChild(script);
});

export default function useYouTubePlayer(videoId, onStateChange) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!videoId) return undefined;

    let isMounted = true;

    ensureYouTubeApi()
      .then(() => {
        if (!isMounted || !containerRef.current) return;

        if (playerRef.current) {
          playerRef.current.loadVideoById(videoId);
          return;
        }

        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            autoplay: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            controls: 1,
          },
          events: {
            onReady: (event) => {
              event.target.setVolume(80);
            },
            onStateChange: (event) => {
              onStateChange?.(event.data);
            },
            onError: (event) => {
              console.error("YouTube player error:", event.data);
            },
          },
        });
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      isMounted = false;
      destroyPlayer();
    };
  }, [destroyPlayer, onStateChange, videoId]);

  const methods = {
    playVideo: () => playerRef.current?.playVideo?.(),
    pauseVideo: () => playerRef.current?.pauseVideo?.(),
    stopVideo: () => playerRef.current?.stopVideo?.(),
    seekTo: (time, allowSeekAhead = true) => playerRef.current?.seekTo?.(time, allowSeekAhead),
    mute: () => playerRef.current?.mute?.(),
    unMute: () => playerRef.current?.unMute?.(),
    isMuted: () => Boolean(playerRef.current?.isMuted?.()),
    setVolume: (volume) => playerRef.current?.setVolume?.(volume),
    getVolume: () => playerRef.current?.getVolume?.() ?? 80,
    getPlayerState: () => playerRef.current?.getPlayerState?.() ?? -1,
    getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
    getDuration: () => playerRef.current?.getDuration?.() ?? 0,
    cueVideoById: (id) => playerRef.current?.cueVideoById?.(id),
    loadVideoById: (id) => playerRef.current?.loadVideoById?.(id),
    destroy: destroyPlayer,
  };

  return { containerRef, methods };
}
