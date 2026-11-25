const express = require("express");
const axios = require("axios");
const https = require("node:https");
const path = require("node:path");
const { Transform } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const { MAX_BYTES, MEDIA_TYPES, MIME_BY_EXT, getFileInfo, validateDirectUrl, detectPlatform } = require("../services/mediaDownloader");

const router = express.Router();
const requests = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const INSPECT_LIMIT = 30;
const DOWNLOAD_LIMIT = 5;
const MAX_REDIRECTS = 3;

function allowRequest(req, res, action) {
  const now = Date.now();
  const key = `${action}:${req.ip || req.socket.remoteAddress || "unknown"}`;
  const recent = (requests.get(key) || []).filter(time => now - time < WINDOW_MS);
  const limit = action === "download" ? DOWNLOAD_LIMIT : INSPECT_LIMIT;
  if (recent.length >= limit) {
    res.set("Retry-After", String(Math.ceil((WINDOW_MS - (now - recent[0])) / 1000)));
    res.status(429).json({ success: false, message: "You have reached the temporary download limit. Please try again later." });
    return false;
  }
  recent.push(now);
  requests.set(key, recent);
  if (requests.size > 5000) for (const [entry, times] of requests) if (!times.some(time => now - time < WINDOW_MS)) requests.delete(entry);
  return true;
}

function makePinnedAgent(url, addresses) {
  const host = url.hostname.toLowerCase();
  const lookup = (requestedHost, options, callback) => {
    if (requestedHost.toLowerCase() !== host) return callback(new Error("Unexpected network host"));
    const safe = addresses.map(({ address, family }) => ({ address, family }));
    if (options?.all) callback(null, safe);
    else callback(null, safe[0].address, safe[0].family);
  };
  return new https.Agent({ lookup, keepAlive: false, maxSockets: 1 });
}

async function requestValidated(input, method, extraHeaders = {}) {
  let current = input;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const { url, addresses } = await validateDirectUrl(current);
    const agent = makePinnedAgent(url, addresses);
    let response;
    try {
      response = await axios.request({
        url: url.toString(), method, httpsAgent: agent, proxy: false, maxRedirects: 0,
        responseType: method === "GET" ? "stream" : "json", timeout: method === "GET" ? 180000 : 20000,
        decompress: false, validateStatus: () => true,
        headers: { "User-Agent": "SavitriMediaDownloader/1.0", Accept: "video/*,audio/*,image/*,*/*;q=0.2", ...(method === "GET" ? { "Accept-Encoding": "identity" } : {}), ...extraHeaders },
      });
    } catch (error) { agent.destroy(); throw error; }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (response.data && typeof response.data.destroy === "function") response.data.destroy();
      agent.destroy();
      if (hop === MAX_REDIRECTS) throw new Error("This media link redirects too many times.");
      const location = response.headers.location;
      if (!location) throw new Error("The media host returned an invalid redirect.");
      current = new URL(location, url).toString();
      continue;
    }
    if (response.status < 200 || response.status >= 300) {
      agent.destroy();
      const error = new Error(response.status === 403 || response.status === 401 ? "This file is restricted or unavailable." : "The media host could not provide this file.");
      error.status = response.status === 404 ? 404 : 422;
      error.upstreamStatus = response.status;
      throw error;
    }
    response._mediaAgent = agent;
    response._mediaUrl = url;
    return response;
  }
  throw new Error("This media link could not be followed safely.");
}

function mediaMetadata(url, headers) {
  const contentType = headers["content-type"] || "";
  const { extension, mimeType } = getFileInfo(url, contentType);
  const contentRange = String(headers["content-range"] || "").match(/\/(\d+)$/);
  const size = contentRange ? Number(contentRange[1]) : Number(headers["content-length"]);
  if (!extension || !MEDIA_TYPES.test(mimeType)) throw new Error("This link does not point to a supported direct image, audio, or video file.");
  if (Number.isFinite(size) && size > MAX_BYTES) throw new Error(`This file exceeds the ${Math.round(MAX_BYTES / 1024 / 1024)} MB limit.`);
  let rawName = path.posix.basename(url.pathname);
  try { rawName = decodeURIComponent(rawName); } catch { /* use the encoded basename */ }
  rawName = rawName.replace(/[\u0000-\u001f\u007f"\\/]/g, "_").slice(0, 140);
  if (!rawName || !rawName.toLowerCase().endsWith(`.${extension}`)) rawName = `${rawName.replace(/\.[^.]*$/, "") || "media"}.${extension}`;
  const filename = rawName;
  return { filename, extension, mimeType, size: Number.isFinite(size) && size >= 0 ? size : null, maxBytes: MAX_BYTES };
}

async function youtubeMetadata(videoId) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return {};
  try {
    const response = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: { part: "snippet,contentDetails", id: videoId, key }, timeout: 6000, maxRedirects: 0,
    });
    const video = response.data?.items?.[0];
    if (!video) return {};
    return {
      title: String(video.snippet?.title || "").slice(0, 200),
      duration: String(video.contentDetails?.duration || "").slice(0, 32),
      thumbnailUrl: String(video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url || ""),
    };
  } catch { return {}; }
}

router.post("/inspect", async (req, res) => {
  if (!allowRequest(req, res, "inspect")) return;
  const input = typeof req.body?.url === "string" ? req.body.url.trim() : "";
  const platform = detectPlatform(input);
  if (platform) {
    const metadata = platform.platform === "youtube" && platform.videoId ? await youtubeMetadata(platform.videoId) : {};
    return res.json({ success: true, item: {
      platform: platform.platform, platformName: platform.displayName, kind: platform.kind,
      originalUrl: input, previewUrl: platform.previewUrl || "", videoId: platform.videoId || "",
      downloadAvailable: false,
      ...metadata,
      message: platform.kind === "embed" ? `${platform.displayName} preview is provided by its official embedded player. Downloads from this platform are not offered here.` : `${platform.displayName} link recognized. Use the platform’s own viewing or download options; Savitri does not extract media from this source.`,
    } });
  }
  let response;
  try {
    try { response = await requestValidated(input, "HEAD"); }
    catch (error) {
      if (![405, 501].includes(error.upstreamStatus)) throw error;
      response = await requestValidated(input, "GET", { Range: "bytes=0-0" });
    }
    const item = mediaMetadata(response._mediaUrl, response.headers);
    response.data?.destroy?.();
    response._mediaAgent?.destroy();
    return res.json({ success: true, item: {
      platform: "direct", platformName: "Direct media file", kind: "file", originalUrl: response._mediaUrl.toString(),
      previewUrl: response._mediaUrl.toString(), downloadAvailable: true, ...item,
      message: "Direct file is reachable. Download the original file in its supplied quality.",
    } });
  } catch (error) {
    response?.data?.destroy?.(); response?._mediaAgent?.destroy();
    error.response?.data?.destroy?.();
    return res.status(error.status || 422).json({ success: false, message: error.message || "This source could not be checked. Try a direct HTTPS media file link." });
  }
});

router.get("/download", async (req, res) => {
  if (!allowRequest(req, res, "download")) return;
  const input = typeof req.query.url === "string" ? req.query.url : "";
  if (detectPlatform(input)) return res.status(422).json({ success: false, message: "Downloads from social platform pages are not available. Use the platform’s own authorized download feature." });
  let response;
  try {
    response = await requestValidated(input, "GET");
    const item = mediaMetadata(response._mediaUrl, response.headers);
    const declaredLength = Number(response.headers["content-length"]);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES) throw new Error(`This file exceeds the ${Math.round(MAX_BYTES / 1024 / 1024)} MB limit.`);
    if (!response.data || typeof response.data.pipe !== "function") throw new Error("The media host returned no file data.");
    res.status(200);
    res.set({
      "Content-Type": item.mimeType,
      "Content-Disposition": `attachment; filename="${item.filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(item.filename)}`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...(Number.isFinite(declaredLength) && declaredLength >= 0 ? { "Content-Length": String(declaredLength) } : {}),
    });
    let received = 0;
    const limit = new Transform({ transform(chunk, _encoding, callback) {
      received += chunk.length;
      if (received > MAX_BYTES) return callback(new Error("This file exceeds the download size limit."));
      callback(null, chunk);
    } });
    try { await pipeline(response.data, limit, res); }
    catch (error) {
      if (!res.headersSent) res.status(502).json({ success: false, message: error.message || "The download was interrupted." });
      else res.destroy(error);
    } finally { response._mediaAgent?.destroy(); }
  } catch (error) {
    response?.data?.destroy?.(); response?._mediaAgent?.destroy();
    if (!res.headersSent) res.status(error.status || 422).json({ success: false, message: error.message || "The download could not be started." });
  }
});

module.exports = router;
