const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const http = require("node:http");
const dns = require("node:dns").promises;
const axios = require("axios");
const { Readable } = require("node:stream");
const mediaRoutes = require("../routes/mediaDownloader");

test("inspect reports direct media and download streams a real attachment response", async (t) => {
  const originalLookup = dns.lookup;
  const originalRequest = axios.request;
  const originalGet = axios.get;
  const originalKey = process.env.YOUTUBE_API_KEY;
  dns.lookup = async () => [{ address: "93.184.216.34", family: 4 }];
  process.env.YOUTUBE_API_KEY = "test-only-server-key";
  axios.get = async () => ({ data: { items: [{ snippet: { title: "Creator's public video", thumbnails: { default: { url: "https://i.ytimg.com/vi/sample/default.jpg" } } }, contentDetails: { duration: "PT1M2S" } }] } });
  axios.request = async ({ method, url, httpsAgent }) => ({
    status: method === "HEAD" && url.includes("range-only") ? 405 : method === "GET" && url.includes("range-only") ? 206 : 200,
    headers: url.includes("range-only") ? { "content-type": "video/mp4", "content-length": method === "HEAD" ? "0" : "1", "content-range": "bytes 0-0/11" } : { "content-type": "video/mp4", "content-length": "11" },
    data: method === "GET" ? Readable.from(Buffer.from("hello-world")) : undefined,
    config: {},
    _mediaAgent: httpsAgent,
  });
  const app = express(); app.use(express.json()); app.use("/", mediaRoutes);
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    dns.lookup = originalLookup; axios.request = originalRequest; axios.get = originalGet;
    if (originalKey === undefined) delete process.env.YOUTUBE_API_KEY; else process.env.YOUTUBE_API_KEY = originalKey;
    await new Promise(resolve => server.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const inspect = await fetch(`${base}/inspect`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: "https://media.example/video.mp4" }) });
  assert.equal(inspect.status, 200);
  const inspectBody = await inspect.json();
  assert.equal(inspectBody.item.downloadAvailable, true);
  assert.equal(inspectBody.item.mimeType, "video/mp4");
  assert.equal(inspectBody.item.size, 11);

  const rangeInspect = await fetch(`${base}/inspect`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: "https://media.example/range-only.mp4" }) });
  assert.equal(rangeInspect.status, 200);
  assert.equal((await rangeInspect.json()).item.size, 11);

  const youtubeInspect = await fetch(`${base}/inspect`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: "https://youtu.be/dQw4w9WgXcQ" }) });
  assert.equal(youtubeInspect.status, 200);
  const youtubeItem = (await youtubeInspect.json()).item;
  assert.equal(youtubeItem.title, "Creator's public video");
  assert.equal(youtubeItem.duration, "PT1M2S");
  assert.equal(youtubeItem.downloadAvailable, false);

  const download = await fetch(`${base}/download?url=${encodeURIComponent("https://media.example/video.mp4")}`);
  assert.equal(download.status, 200);
  assert.match(download.headers.get("content-disposition"), /attachment/);
  assert.equal(await download.text(), "hello-world");

  const denied = await fetch(`${base}/download?url=${encodeURIComponent("https://www.youtube.com/watch?v=dQw4w9WgXcQ")}`);
  assert.equal(denied.status, 422);
});
