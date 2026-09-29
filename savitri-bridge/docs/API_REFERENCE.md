# SavitriBridge API reference (v1)

Base URLs: `{PUBLIC_API_URL}/api/v1/admin` (dashboard, JWT) and `{PUBLIC_API_URL}/api/v1/public` (websites, no auth
header — protected by origin allow-list, rate limits and per-subscriber tokens instead).

Every response is `{ "success": true, "data": ... }` or `{ "success": false, "error": { "code", "message" } }`.
List endpoints add `"meta": { "page", "limit", "total", "pages" }`.

## Admin API (selected)
- `POST /auth/login` `{ email, password }` → `{ token, admin }`
- `GET /auth/me`, `POST /auth/change-password`
- `GET/POST /projects`, `GET/PUT /projects/:id`, `PATCH /projects/:id/status`
- `GET /subscribers`, `GET /subscribers/:subscriberId`, `POST /subscribers/:subscriberId/test-push`,
  `POST /subscribers/:subscriberId/{disable,enable}`, `DELETE /subscribers/:subscriberId`
- `GET/POST /campaigns`, `GET/PUT /campaigns/:id`, `DELETE /campaigns/:id`, `POST /campaigns/estimate`,
  `POST /campaigns/:id/{send,schedule,cancel,duplicate}`, `GET /campaigns/:id/attempts`
- `GET/POST /templates`, `GET/PUT /templates/:id`, `PATCH /templates/:id/toggle`, `POST /templates/:id/duplicate`,
  `DELETE /templates/:id`
- `POST /uploads/image?kind=icons|badges|images` (multipart field `file`, ≤3MB, PNG/JPEG/WebP)
- `GET /analytics/overview`, `GET /analytics/report?from&to&interval&projectId`
- `GET /logs/audit`, `GET /logs/failures`
- `GET /exports/{subscribers,campaigns,campaign-performance,push-failures,click-tracking}.csv`
- `GET/POST /admins` (Super Admin only), `PATCH /admins/:id`, `POST /admins/:id/reset-password`
- `GET /settings`

## Public API (called by push-client.js)
- `GET /config/:publicProjectId` → `{ vapidPublicKey, projectName }`
- `POST /subscribe` `{ publicProjectId, subscription, device, subscriberId?, token? }` → `{ subscriberId, token }`
- `POST /status`, `POST /metadata`, `POST /unsubscribe` — all take `{ subscriberId, token, ... }`
- `POST /location` `{ subscriberId, token, latitude, longitude, accuracy? }`
- `POST /location-permission` `{ subscriberId, token, permission }`
- `POST /click` `{ sendId, clickToken }` — called by the Service Worker only

Full request/response shapes are enforced by `backend/validators/schemas.js` (Zod) — read it alongside this file
for exact field constraints.
