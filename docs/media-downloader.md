# Savitri Media Downloader

## Shipped capability

The first release supports publicly reachable, direct HTTPS image, audio, and video files. It downloads the original source file, with no quality conversion, and streams it through the existing Savitri Livings backend. It does not retain media files or write them to Cloudinary/MongoDB.

YouTube and TikTok links are recognized and can use their official embedded players. Instagram, Facebook, X, Vimeo, and Dailymotion links are identified and link back to their source. Social-page extraction and downloads are intentionally not enabled. The feature does not bypass DRM, authentication, privacy restrictions, paywalls, or source platform controls. HLS playlists and media conversion are not included.

## Integration map

- Frontend route: `/media-downloader`
- Discovery: Development hub and Tools page
- Inspect endpoint: `POST /api/media-downloader/inspect` with `{ "url": "https://…" }`
- Download endpoint: `GET /api/media-downloader/download?url=…`
- Backend adapter/URL validation: `backend/services/mediaDownloader.js`
- Backend streaming and request limits: `backend/routes/mediaDownloader.js`
- No new database collection or persistent storage is used.

## Safeguards

- HTTPS only; DNS is resolved and pinned to public routable IP addresses per request.
- Local, private, reserved, and IPv6-literal destinations are rejected. Public IPv6 records for normal hostnames are supported.
- Redirects are limited to three and every redirect host is validated again.
- Only known image/audio/video MIME types and file extensions are streamed.
- Downloads are capped at 100 MiB, with byte-count enforcement even if the origin omits its size.
- In-process limits: 30 inspections and 5 downloads per client IP per 10 minutes.
- Response headers force attachment delivery, disable caching, and prevent MIME sniffing.
- The browser requires the user to confirm they own the media or have permission to use it.

## Configuration and operations

No new secret or credential is required. `MEDIA_DOWNLOADER_MAX_BYTES` in the backend environment can lower the default 100 MiB limit; values above 100 MiB are clamped. CORS already permits the Savitri Livings frontend origin.

The IP rate limiter is process-local. If the service runs multiple Render instances, use a shared Redis-backed limiter before increasing availability or traffic. Monitor egress bandwidth and tune the maximum below the platform’s request and response limits.

## Verification

Run `npm run test:media-downloader` from the backend folder. The tests cover URL parsing, private/reserved IPv4 blocking, DNS results containing a private address, supported platform detection, and media-type filtering. Run `npm run build` from the frontend folder for the production frontend build.

Direct external media requests still depend on each origin allowing public HTTPS HEAD/GET requests and supporting a recognized MIME type or extension. A host can reject the request, expire its URL, or block server-side access; in those cases the page reports the source as unavailable rather than offering a fake download.
