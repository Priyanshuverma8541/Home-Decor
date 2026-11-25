const test = require("node:test");
const assert = require("node:assert/strict");
const { isPublicIpv4, getFileInfo, validateDirectUrl, detectPlatform } = require("../services/mediaDownloader");

test("blocks private, loopback, link-local, and reserved IPv4 ranges", () => {
  for (const address of ["0.0.0.1", "10.0.0.8", "100.64.0.1", "127.0.0.1", "169.254.1.2", "172.20.4.5", "192.168.1.1", "198.18.0.1", "203.0.113.10", "224.0.0.1", "255.255.255.255"]) {
    assert.equal(isPublicIpv4(address), false, address);
  }
  for (const address of ["1.1.1.1", "8.8.8.8", "104.18.1.1"]) assert.equal(isPublicIpv4(address), true, address);
});

test("accepts HTTPS direct media links and rejects unsafe URL forms", async () => {
  const publicResolver = async () => [{ address: "93.184.216.34", family: 4 }];
  const result = await validateDirectUrl("https://example.com/video.mp4", publicResolver);
  assert.equal(result.url.hostname, "example.com");
  await assert.rejects(validateDirectUrl("http://example.com/video.mp4"), /HTTPS/);
  await assert.rejects(validateDirectUrl("https://user:pass@example.com/video.mp4"), /HTTPS/);
  await assert.rejects(validateDirectUrl("https://localhost/video.mp4", publicResolver), /host/);
  await assert.rejects(validateDirectUrl("https://127.0.0.1/video.mp4"), /Private or reserved/);
  await assert.rejects(validateDirectUrl("https://example.com/video.mp4", async () => [{ address: "93.184.216.34", family: 4 }, { address: "10.0.0.2", family: 4 }]), /private or reserved/);
  const ipv6 = await validateDirectUrl("https://example.com/video.mp4", async () => [{ address: "2606:4700:4700::1111", family: 6 }]);
  assert.equal(ipv6.addresses[0].family, 6);
  await assert.rejects(validateDirectUrl("https://example.com/video.mp4", async () => [{ address: "fd00::1", family: 6 }]), /private or reserved/);
});

test("detects supported official previews without marking social media as downloadable", () => {
  const youtube = detectPlatform("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(youtube.platform, "youtube");
  assert.equal(youtube.kind, "embed");
  assert.equal(youtube.videoId, "dQw4w9WgXcQ");
  assert.equal(detectPlatform("https://www.tiktok.com/@creator/video/1234567890123456789").kind, "embed");
  for (const url of ["https://instagram.com/reel/abc/", "https://facebook.com/watch/123", "https://x.com/user/status/123", "https://vimeo.com/123", "https://dai.ly/abc"]) {
    assert.equal(detectPlatform(url).kind, "link", url);
  }
  assert.equal(detectPlatform("https://example.com/movie.mp4"), null);
});

test("restricts media types and extracts a safe known extension", () => {
  assert.deepEqual(getFileInfo(new URL("https://example.com/movie.mp4"), "application/octet-stream"), { extension: "mp4", mimeType: "video/mp4" });
  assert.deepEqual(getFileInfo(new URL("https://example.com/playlist.m3u8"), "application/vnd.apple.mpegurl"), { extension: "", mimeType: "application/vnd.apple.mpegurl" });
});
