import { useState } from "react";
import { ArrowDownToLine, ArrowRight, Check, Clipboard, ExternalLink, FileVideo2, Image as ImageIcon, Link2, LoaderCircle, Music2, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import toast from "react-hot-toast";
import { mediaDownloaderAPI } from "../../services/api.js";
import "./MediaDownloader.css";

const PLATFORM_NAMES = ["Instagram", "Facebook", "TikTok", "YouTube", "X", "Vimeo", "Dailymotion"];

function sizeLabel(bytes) {
  if (bytes == null) return "Size not provided by source";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function durationLabel(value) {
  const match = String(value || "").match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return value;
  const hours = Number(match[1] || 0); const minutes = Number(match[2] || 0); const seconds = Number(match[3] || 0);
  return [hours, minutes, seconds].filter((part, index) => part || index > 0).map(part => String(part).padStart(2, "0")).join(":");
}

function safeFilename(disposition, fallback) {
  const match = String(disposition || "").match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  const raw = (match?.[1] || match?.[2] || fallback).replace(/^"|"$/g, "");
  try { return decodeURIComponent(raw); } catch { return raw; }
}

function MediaPreview({ item }) {
  if (item.kind === "embed" && item.previewUrl) return <iframe className="smd-player" src={item.previewUrl} title={`${item.platformName} official player`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />;
  if (item.kind === "file" && item.mimeType?.startsWith("image/")) return <img className="smd-preview-image" src={item.previewUrl} alt={item.filename || "Media preview"} />;
  if (item.kind === "file" && item.mimeType?.startsWith("video/")) return <video className="smd-preview-video" src={item.previewUrl} controls playsInline preload="metadata" />;
  if (item.kind === "file" && item.mimeType?.startsWith("audio/")) return <div className="smd-audio-preview"><Music2 size={35}/><audio src={item.previewUrl} controls preload="metadata" /></div>;
  return <div className="smd-source-preview"><span className="smd-source-icon"><Link2 size={25}/></span><strong>{item.platformName}</strong><span>Continue on the original service</span><a href={item.originalUrl} target="_blank" rel="noopener noreferrer">Open source <ExternalLink size={14}/></a></div>;
}

export default function MediaDownloader() {
  const [url, setUrl] = useState("");
  const [item, setItem] = useState(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [allowUse, setAllowUse] = useState(false);

  const reset = () => { setUrl(""); setItem(null); setProgress(null); setAllowUse(false); };

  const paste = async () => {
    try {
      const value = await navigator.clipboard.readText();
      if (!value) { toast.error("Your clipboard is empty."); return; }
      setUrl(value.trim()); setItem(null); setAllowUse(false);
    } catch { toast.error("Clipboard access is unavailable. Paste the link into the field."); }
  };

  const inspect = async (event) => {
    event?.preventDefault();
    if (!url.trim()) { toast.error("Paste a media link first."); return; }
    setChecking(true); setItem(null); setProgress(null); setAllowUse(false);
    try {
      const response = await mediaDownloaderAPI.inspect(url.trim());
      setItem(response.data.item);
    } catch (error) {
      toast.error(error.response?.data?.message || "We could not check that link. Try a direct HTTPS media file URL.");
    } finally { setChecking(false); }
  };

  const download = async () => {
    if (!item?.downloadAvailable || !allowUse) return;
    setDownloading(true); setProgress(0);
    try {
      const response = await mediaDownloaderAPI.download(item.originalUrl, (event) => {
        if (event.total) setProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        else setProgress(null);
      });
      const blob = response.data;
      if (!(blob instanceof Blob) || !blob.size) throw new Error("The source returned an empty file.");
      if (blob.type.includes("application/json")) {
        const errorData = await blob.text().then((text) => JSON.parse(text)).catch(() => ({}));
        throw new Error(errorData.message || "The download could not be started.");
      }
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = safeFilename(response.headers?.["content-disposition"], item.filename || "savitri-media");
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      setProgress(100); toast.success("Your file is ready.");
    } catch (error) {
      let message = error.response?.data?.message || error.message || "Download failed. Please try again.";
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text().catch(() => "");
        try { message = JSON.parse(text).message || message; } catch { /* keep the fallback */ }
      }
      toast.error(message); setProgress(null);
    } finally { setDownloading(false); }
  };

  const kindIcon = item?.mimeType?.startsWith("image/") ? ImageIcon : item?.mimeType?.startsWith("audio/") ? Music2 : FileVideo2;
  const KindIcon = kindIcon;

  return <main className="smd-page">
    <div className="smd-glow smd-glow-one"/><div className="smd-glow smd-glow-two"/>
    <header className="smd-heading"><span className="smd-eyebrow"><ArrowDownToLine size={14}/> SAVITRI LIVINGS · MEDIA TOOLS</span><h1>Savitri Media <em>Downloader</em></h1><p>Download direct media files you can access and have permission to use. Paste a link to check what this source supports.</p></header>

    <section className="smd-workspace" aria-label="Media downloader">
      <form className="smd-link-form" onSubmit={inspect}>
        <label htmlFor="smd-url">Media link</label>
        <div className="smd-input-wrap"><Link2 size={19} aria-hidden="true"/><input id="smd-url" type="url" inputMode="url" autoComplete="url" placeholder="Paste a direct media file or supported platform link…" value={url} onChange={(event) => { setUrl(event.target.value); setItem(null); setAllowUse(false); }} maxLength={4096} required/><button type="button" className="smd-paste" onClick={paste}><Clipboard size={16}/><span>Paste</span></button></div>
        <div className="smd-form-actions"><button className="smd-check-button" type="submit" disabled={checking || !url.trim()}>{checking ? <><LoaderCircle className="smd-spin" size={17}/> Checking link…</> : <>Check media <ArrowRight size={16}/></>}</button><button type="button" className="smd-clear-button" onClick={reset} disabled={checking || downloading}><RotateCcw size={15}/> Clear</button></div>
      </form>

      {checking && <div className="smd-state smd-loading" role="status"><LoaderCircle className="smd-spin" size={23}/><div><strong>Checking this source</strong><span>We’re validating the link and checking available file details.</span></div></div>}

      {item && <section className="smd-result" aria-live="polite">
        <div className="smd-result-head"><div><span className="smd-eyebrow">SOURCE CHECKED</span><h2>{item.title || item.filename || item.platformName}</h2><p>{item.message}</p></div><span className={`smd-badge ${item.downloadAvailable ? "smd-badge-ready" : "smd-badge-view"}`}>{item.downloadAvailable ? <><Check size={13}/> Download ready</> : <><ExternalLink size={13}/> Preview / source</>}</span></div>
        <MediaPreview item={item}/>
        <div className="smd-file-details"><div><span>Source</span><strong>{item.platformName}</strong></div>{item.duration && <div><span>Duration</span><strong>{durationLabel(item.duration)}</strong></div>}{item.downloadAvailable && <><div><span>Format</span><strong><KindIcon size={14}/> {item.extension.toUpperCase()}</strong></div><div><span>File size</span><strong>{sizeLabel(item.size)}</strong></div><div><span>Quality</span><strong>Original source</strong></div></>}</div>
        {item.downloadAvailable ? <div className="smd-download-panel"><label className="smd-rights"><input type="checkbox" checked={allowUse} onChange={(event) => setAllowUse(event.target.checked)}/><span>I own this media or have permission to download and use it.</span></label><button type="button" className="smd-download-button" onClick={download} disabled={!allowUse || downloading}>{downloading ? <><LoaderCircle className="smd-spin" size={17}/> Downloading…</> : <><ArrowDownToLine size={17}/> Download original file</>}</button>{downloading && <div className="smd-progress" role="status" aria-label={progress == null ? "Download in progress" : `Download ${progress}%`}><div className={progress == null ? "smd-indeterminate" : ""} style={progress == null ? undefined : { width: `${progress}%` }}/>{progress != null && <span>{progress}%</span>}</div>}<small>Direct HTTPS files only · Maximum file size {Math.round((item.maxBytes || 104857600) / 1048576)} MB · Files are streamed and not stored by Savitri.</small></div> : <a className="smd-original-link" href={item.originalUrl} target="_blank" rel="noopener noreferrer">Open in {item.platformName} <ExternalLink size={15}/></a>}
      </section>}

      {!item && !checking && <div className="smd-empty"><span><ArrowDownToLine size={22}/></span><strong>Paste a link to get started</strong><p>We’ll identify the source and show only actions that are actually supported.</p></div>}
    </section>

    <section className="smd-platforms"><div className="smd-section-title"><span className="smd-eyebrow">SOURCE SUPPORT</span><h2>Clear about what works.</h2><p>No fake download options: each source is identified and reports its actual capability.</p></div><div className="smd-platform-grid">{PLATFORM_NAMES.map((name) => <div className="smd-platform" key={name}><span className="smd-dot"/><div><strong>{name}</strong><small>{name === "YouTube" || name === "TikTok" ? "Official player preview · no file download" : "Source link only · no media extraction"}</small></div></div>)}<div className="smd-platform smd-platform-direct"><span className="smd-dot"/><div><strong>Direct HTTPS media files</strong><small>Original file download · image, audio, or video · 100 MB limit</small></div></div></div></section>

    <section className="smd-safety"><ShieldCheck size={20}/><div><strong>Respect creators and source permissions</strong><p>We do not bypass DRM, private-account restrictions, paywalls, or platform controls. Social platform links are never extracted. Download only content you own or are authorized to use.</p></div></section>
    <section className="smd-how"><div><span className="smd-eyebrow">HOW IT WORKS</span><h2>Three simple steps</h2></div><ol><li><b>01</b><span>Paste a public direct HTTPS media link or a supported social link.</span></li><li><b>02</b><span>We check source type and show a preview when an official player is available.</span></li><li><b>03</b><span>For direct files, choose Download to receive the original media.</span></li></ol></section>
    <p className="smd-footnote"><TriangleAlert size={14}/> Media from social platforms can be viewed on its original service. Downloads are limited to directly accessible files and remain subject to the source’s permissions and terms.</p>
  </main>;
}
