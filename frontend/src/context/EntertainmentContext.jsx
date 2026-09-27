import { createContext, useContext, useEffect, useMemo, useState } from "react";

const EntertainmentContext = createContext(null);
const STORAGE_KEY = "sl_entertainment_state";

const defaultQueue = [
  {
    id: "default-track",
    title: "Bollywood Love Song",
    youtubeVideoId: "r6qFjqQGVr0",
    thumbnail: "https://img.youtube.com/vi/r6qFjqQGVr0/hqdefault.jpg",
    channelName: "Savitri Livings",
    category: "romantic",
    language: "Hindi",
  },
];

const buildInitialState = () => ({
  currentTrack: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 80,
  muted: false,
  repeatMode: "none",
  shuffle: false,
  favorites: [],
  history: [],
  playlists: [{ id: "pl-1", name: "My Bollywood", tracks: defaultQueue.slice(0, 1) }],
});

const readInitialState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw);
    return { ...buildInitialState(), ...parsed };
  } catch {
    return buildInitialState();
  }
};

export function EntertainmentProvider({ children }) {
  const [state, setState] = useState(readInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const playTrack = (track, queueOverride = []) => {
    if (!track) return;
    setState((prev) => {
      const normalizedQueue = queueOverride.length ? queueOverride : prev.queue.length ? prev.queue : [track];
      const targetIndex = normalizedQueue.findIndex((item) => item.youtubeVideoId === track.youtubeVideoId);
      return {
        ...prev,
        currentTrack: track,
        queue: normalizedQueue,
        currentIndex: targetIndex >= 0 ? targetIndex : 0,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
        history: [track, ...prev.history.filter((item) => item.youtubeVideoId !== track.youtubeVideoId)].slice(0, 8),
      };
    });
  };

  const togglePlay = () => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const toggleFavorite = (track) => {
    if (!track) return;
    setState((prev) => {
      const exists = prev.favorites.some((item) => item.youtubeVideoId === track.youtubeVideoId);
      return {
        ...prev,
        favorites: exists ? prev.favorites.filter((item) => item.youtubeVideoId !== track.youtubeVideoId) : [track, ...prev.favorites],
      };
    });
  };

  const handlePlayerStateChange = (eventData) => {
    if (eventData === 1) {
      setState((prev) => ({ ...prev, isPlaying: true }));
      return;
    }
    if (eventData === 2 || eventData === 3 || eventData === 0) {
      setState((prev) => ({ ...prev, isPlaying: eventData === 2 ? false : eventData === 3 ? true : false }));
    }
  };

  const playNext = () => {
    setState((prev) => {
      if (!prev.queue.length) return prev;
      const currentQueue = prev.queue.length ? prev.queue : [prev.currentTrack].filter(Boolean);
      if (!currentQueue.length) return prev;

      if (prev.repeatMode === "current") {
        return { ...prev, isPlaying: true };
      }

      if (prev.shuffle) {
        let nextIndex = Math.floor(Math.random() * currentQueue.length);
        if (currentQueue.length > 1 && nextIndex === prev.currentIndex) nextIndex = (nextIndex + 1) % currentQueue.length;
        const nextTrack = currentQueue[nextIndex];
        return {
          ...prev,
          currentIndex: nextIndex,
          currentTrack: nextTrack,
          isPlaying: true,
          currentTime: 0,
          duration: 0,
          history: [nextTrack, ...prev.history.filter((item) => item.youtubeVideoId !== nextTrack.youtubeVideoId)].slice(0, 8),
        };
      }

      const nextIndex = prev.currentIndex + 1 < currentQueue.length ? prev.currentIndex + 1 : 0;
      const nextTrack = currentQueue[nextIndex];
      return {
        ...prev,
        currentIndex: nextIndex,
        currentTrack: nextTrack,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
        history: [nextTrack, ...prev.history.filter((item) => item.youtubeVideoId !== nextTrack.youtubeVideoId)].slice(0, 8),
      };
    });
  };

  const playPrevious = () => {
    setState((prev) => {
      if (!prev.queue.length) return prev;
      const nextIndex = prev.currentIndex > 0 ? prev.currentIndex - 1 : prev.queue.length - 1;
      const previousTrack = prev.queue[nextIndex];
      return {
        ...prev,
        currentIndex: nextIndex,
        currentTrack: previousTrack,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      };
    });
  };

  const addFavorite = (track) => toggleFavorite(track);

  const removeFavorite = (videoId) => {
    setState((prev) => ({ ...prev, favorites: prev.favorites.filter((item) => item.youtubeVideoId !== videoId) }));
  };

  const addToPlaylist = (playlistId, track) => {
    if (!track) return;
    setState((prev) => ({
      ...prev,
      playlists: prev.playlists.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, tracks: playlist.tracks.some((item) => item.youtubeVideoId === track.youtubeVideoId) ? playlist.tracks : [...playlist.tracks, track] }
          : playlist
      ),
    }));
  };

  const createPlaylist = (name) => {
    if (!name?.trim()) return;
    setState((prev) => ({
      ...prev,
      playlists: [...prev.playlists, { id: `pl-${Date.now()}`, name: name.trim(), tracks: [] }],
    }));
  };

  const setPlaybackMeta = ({ currentTime, duration, volume, muted }) => {
    setState((prev) => ({ ...prev, currentTime, duration, volume, muted }));
  };

  const value = useMemo(() => ({
    ...state,
    playTrack,
    togglePlay,
    toggleFavorite,
    playNext,
    playPrevious,
    addFavorite,
    removeFavorite,
    addToPlaylist,
    createPlaylist,
    setPlaybackMeta,
    handlePlayerStateChange,
    setState,
  }), [state]);

  return <EntertainmentContext.Provider value={value}>{children}</EntertainmentContext.Provider>;
}

export const useEntertainment = () => {
  const context = useContext(EntertainmentContext);
  if (!context) throw new Error("useEntertainment must be used within EntertainmentProvider");
  return context;
};
