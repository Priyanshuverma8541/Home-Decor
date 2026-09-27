const express = require("express");
const axios = require("axios");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const EntertainmentContent = require("../models/EntertainmentContent");

const FALLBACK_CONTENT = [
  { title: "Arijit Singh - Tum Hi Ho", youtubeVideoId: "r6qFjqQGVr0", thumbnail: "https://img.youtube.com/vi/r6qFjqQGVr0/hqdefault.jpg", channelName: "Shree Productions", category: "romantic", language: "Hindi" },
  { title: "Shreya Ghoshal - Deewani Mastani", youtubeVideoId: "uL6X2V4nGvQ", thumbnail: "https://img.youtube.com/vi/uL6X2V4nGvQ/hqdefault.jpg", channelName: "Bollywood Classics", category: "romantic", language: "Hindi" },
  { title: "90s Bollywood Hits Mix", youtubeVideoId: "dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", channelName: "Retro Bollywood", category: "90s", language: "Hindi" },
  { title: "Bollywood Party Songs", youtubeVideoId: "tAGnKpE4NCI", thumbnail: "https://img.youtube.com/vi/tAGnKpE4NCI/hqdefault.jpg", channelName: "Party Beats", category: "party", language: "Hindi" },
  { title: "Arijit Singh Live Collection", youtubeVideoId: "vT4W3mSc-r0", thumbnail: "https://img.youtube.com/vi/vT4W3mSc-r0/hqdefault.jpg", channelName: "Music Vault", category: "trending", language: "Hindi" },
  { title: "Hindi Sad Songs", youtubeVideoId: "4Hh1_OaNCeY", thumbnail: "https://img.youtube.com/vi/4Hh1_OaNCeY/hqdefault.jpg", channelName: "Melody Zone", category: "sad", language: "Hindi" },
  { title: "Bollywood Classics", youtubeVideoId: "XxXxXxXxXxX", thumbnail: "https://img.youtube.com/vi/XxXxXxXxXxX/hqdefault.jpg", channelName: "Cinema Archive", category: "classics", language: "Hindi" },
];

const normalizeItem = (item, fallbackCategory = "Bollywood") => ({
  id: item._id || item.youtubeVideoId || item.id,
  title: item.title || "Bollywood Song",
  youtubeVideoId: item.youtubeVideoId || item.videoId || item.id || "",
  thumbnail: item.thumbnail || `https://img.youtube.com/vi/${item.youtubeVideoId || item.videoId || "dQw4w9WgXcQ"}/hqdefault.jpg`,
  channelName: item.channelName || "YouTube",
  category: item.category || fallbackCategory,
  language: item.language || "Hindi",
  type: item.type || "music",
  featured: Boolean(item.featured),
  source: item.source || "youtube",
});

const youtubeSearchItems = async (query) => {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return FALLBACK_CONTENT.filter((item) => {
    const haystack = `${item.title} ${item.category} ${item.channelName}`.toLowerCase();
    return haystack.includes((query || "bollywood").toLowerCase());
  });

  const url = "https://www.googleapis.com/youtube/v3/search";
  const { data } = await axios.get(url, {
    params: {
      part: "snippet",
      q: `${query || "Bollywood Hindi songs"} official music`,
      type: "video",
      maxResults: 10,
      key,
      videoEmbeddable: true,
      safeSearch: "moderate",
    },
    timeout: 10000,
  });

  return (data.items || []).map((item) => ({
    title: item.snippet?.title || "Bollywood Song",
    youtubeVideoId: item.id?.videoId || "",
    thumbnail: item.snippet?.thumbnails?.high?.url || `https://img.youtube.com/vi/${item.id?.videoId}/hqdefault.jpg`,
    channelName: item.snippet?.channelTitle || "YouTube",
    category: "Bollywood",
    language: "Hindi",
  })).filter((item) => item.youtubeVideoId && item.youtubeVideoId.length > 0);
};

router.get("/search", async (req, res) => {
  try {
    const query = String(req.query.q || "Bollywood songs");
    const items = await youtubeSearchItems(query);
    res.json({ success: true, query, items: items.map((item) => normalizeItem(item, "Bollywood")) });
  } catch (error) {
    console.error("Entertainment search failed:", error.message);
    res.json({ success: true, query: req.query.q || "Bollywood songs", items: FALLBACK_CONTENT.map((item) => normalizeItem(item, item.category || "Bollywood")) });
  }
});

router.get("/featured", async (req, res) => {
  try {
    const items = await EntertainmentContent.find({ isPublished: true, featured: true }).limit(8).lean();
    const payload = items.length ? items.map((item) => normalizeItem(item, item.category || "Bollywood")) : FALLBACK_CONTENT.slice(0, 6).map((item) => normalizeItem(item, item.category || "Bollywood"));
    res.json({ success: true, items: payload });
  } catch (error) {
    res.json({ success: true, items: FALLBACK_CONTENT.slice(0, 6).map((item) => normalizeItem(item, item.category || "Bollywood")) });
  }
});

router.get("/trending", async (req, res) => {
  try {
    const items = await youtubeSearchItems("trending bollywood songs");
    res.json({ success: true, items: items.map((item) => normalizeItem(item, "trending")) });
  } catch (error) {
    res.json({ success: true, items: FALLBACK_CONTENT.slice(0, 4).map((item) => normalizeItem(item, item.category || "Bollywood")) });
  }
});

router.get("/category/:slug", async (req, res) => {
  const { slug } = req.params;
  const fallback = FALLBACK_CONTENT.filter((item) => {
    const normalized = (item.category || "Bollywood").toLowerCase();
    return normalized.includes(slug.toLowerCase()) || slug.toLowerCase() === "all";
  });

  try {
    const content = await EntertainmentContent.find({ isPublished: true, category: new RegExp(slug, "i") }).limit(12).lean();
    const items = content.length ? content.map((item) => normalizeItem(item, item.category || slug)) : fallback.map((item) => normalizeItem(item, item.category || slug));
    res.json({ success: true, category: slug, items });
  } catch (error) {
    res.json({ success: true, category: slug, items: fallback.map((item) => normalizeItem(item, item.category || slug)) });
  }
});

router.get("/content", async (req, res) => {
  try {
    const content = await EntertainmentContent.find({ isPublished: true }).sort({ featured: -1, createdAt: -1 }).limit(30).lean();
    res.json({ success: true, items: content.map((item) => normalizeItem(item, item.category || "Bollywood")) });
  } catch (error) {
    res.json({ success: true, items: FALLBACK_CONTENT.map((item) => normalizeItem(item, item.category || "Bollywood")) });
  }
});

router.post("/content", protect, adminOnly, async (req, res) => {
  try {
    const payload = {
      title: req.body.title,
      type: req.body.type || "music",
      source: "youtube",
      youtubeVideoId: req.body.youtubeVideoId,
      thumbnail: req.body.thumbnail || `https://img.youtube.com/vi/${req.body.youtubeVideoId}/hqdefault.jpg`,
      channelName: req.body.channelName || "YouTube",
      category: req.body.category || "Bollywood",
      language: req.body.language || "Hindi",
      duration: Number(req.body.duration || 0),
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      isPublished: req.body.isPublished !== false,
      featured: Boolean(req.body.featured),
      associatedProducts: req.body.associatedProducts || [],
    };

    const item = await EntertainmentContent.create(payload);
    res.status(201).json({ success: true, item: normalizeItem(item, item.category || "Bollywood") });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Unable to save entertainment content" });
  }
});

module.exports = router;
