const dns = require("node:dns").promises;
const net = require("node:net");
const ipaddr = require("ipaddr.js");

const DEFAULT_MAX_BYTES = 100 * 1024 * 1024;
const CONFIGURED_MAX_BYTES = Number(process.env.MEDIA_DOWNLOADER_MAX_BYTES);
const MAX_BYTES = Number.isFinite(CONFIGURED_MAX_BYTES) && CONFIGURED_MAX_BYTES > 0
  ? Math.min(CONFIGURED_MAX_BYTES, DEFAULT_MAX_BYTES)
  : DEFAULT_MAX_BYTES;
const MEDIA_TYPES = /^(video|audio|image)\//i;
const MIME_BY_EXT = {
  mp4: "video/mp4", m4v: "video/x-m4v", mov: "video/quicktime", webm: "video/webm", ogv: "video/ogg",
  mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav", ogg: "audio/ogg", aac: "audio/aac",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif",
};
const EXT_BY_MIME = Object.fromEntries(Object.entries(MIME_BY_EXT).map(([ext, mime]) => [mime, ext]));
const FILE_EXTENSIONS = new Set(Object.keys(MIME_BY_EXT));

function isPublicIpv4(address) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const n = parts.reduce((value, part) => (value << 8n) | BigInt(part), 0n);
  const ranges = [
    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
    ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16],
    ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
  ];
  return !ranges.some(([base, prefix]) => {
    const b = base.split(".").map(Number).reduce((value, part) => (value << 8n) | BigInt(part), 0n);
    const mask = ((1n << 32n) - 1n) ^ ((1n << BigInt(32 - prefix)) - 1n);
    return (n & mask) === (b & mask);
  });
}

function getFileInfo(url, contentType = "") {
  const extension = url.pathname.split("/").pop()?.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase() || "";
  const rawMime = String(contentType).split(";")[0].trim().toLowerCase();
  const mimeType = rawMime && rawMime !== "application/octet-stream" ? rawMime : (MIME_BY_EXT[extension] || rawMime);
  const finalExtension = EXT_BY_MIME[mimeType] || (FILE_EXTENSIONS.has(extension) ? extension : "");
  return { extension: finalExtension, mimeType };
}

async function validateDirectUrl(input, resolveHost = dns.lookup) {
  if (typeof input !== "string" || input.length > 4096) throw new Error("Paste a valid direct media file URL.");
  let url;
  try { url = new URL(input.trim()); } catch { throw new Error("Paste a valid direct media file URL."); }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) throw new Error("Only secure HTTPS media links are supported.");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host === "localhost") throw new Error("That host is not available for downloads.");
  if (net.isIP(host) === 4 && !isPublicIpv4(host)) throw new Error("Private or reserved network addresses are not allowed.");
  if (net.isIP(host) === 6) throw new Error("IPv6 literal URLs are not supported.");
  let addresses;
  try { addresses = net.isIP(host) ? [{ address: host, family: 4 }] : await resolveHost(host, { all: true, verbatim: true }); }
  catch { throw new Error("We could not reach that media host."); }
  if (!addresses.length || addresses.some(({ address, family }) => {
    try {
      const parsed = ipaddr.parse(address);
      if ((family === 4 && parsed.kind() !== "ipv4") || (family === 6 && parsed.kind() !== "ipv6")) return true;
      return ipaddr.process(address).range() !== "unicast";
    } catch { return true; }
  })) throw new Error("That host resolves to a private or reserved network address.");
  addresses.sort((a, b) => a.family - b.family);
  return { url, addresses };
}

function detectPlatform(input) {
  let url;
  try { url = new URL(input); } catch { return { platform: "unknown", displayName: "Unknown source", kind: "unsupported" }; }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const is = domain => host === domain || host.endsWith(`.${domain}`);
  if (is("youtube.com") || host === "youtu.be" || is("youtube-nocookie.com")) {
    const id = host === "youtu.be" ? url.pathname.split("/").filter(Boolean)[0] : (url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1]);
    if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return { platform: "youtube", displayName: "YouTube", kind: "embed", previewUrl: `https://www.youtube-nocookie.com/embed/${id}`, videoId: id };
    return { platform: "youtube", displayName: "YouTube", kind: "link" };
  }
  if (is("instagram.com")) return { platform: "instagram", displayName: "Instagram", kind: "link" };
  if (is("facebook.com") || host === "fb.watch") return { platform: "facebook", displayName: "Facebook", kind: "link" };
  if (is("tiktok.com")) {
    const id = url.pathname.match(/\/video\/(\d+)/)?.[1];
    return { platform: "tiktok", displayName: "TikTok", kind: id ? "embed" : "link", ...(id ? { previewUrl: `https://www.tiktok.com/player/v1/${id}`, videoId: id } : {}) };
  }
  if (is("x.com") || is("twitter.com")) return { platform: "x", displayName: "X", kind: "link" };
  if (is("vimeo.com")) return { platform: "vimeo", displayName: "Vimeo", kind: "link" };
  if (is("dailymotion.com") || host === "dai.ly") return { platform: "dailymotion", displayName: "Dailymotion", kind: "link" };
  return null;
}

module.exports = { MAX_BYTES, MEDIA_TYPES, MIME_BY_EXT, isPublicIpv4, getFileInfo, validateDirectUrl, detectPlatform };
