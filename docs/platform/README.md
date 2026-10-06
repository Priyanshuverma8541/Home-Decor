# Savitri Platform foundation

Savitri Livings remains on its existing backend and admin. The current platform foundation adds an application registry and credential-scoped event API alongside the existing `/api/push` routes.

## Application and credential management

Admin-only routes are mounted at `/api/platform/v1/admin/applications`:

- `GET /` lists registered apps and ensures the first app (`app_savitri_livings`) is registered.
- `POST /` creates an app with an app ID, public key, status and allowed domains.
- `PATCH /:appId` updates metadata or pauses/reactivates an app. Pausing revokes its active secret keys.
- `GET /:appId/keys` lists key metadata only.
- `POST /:appId/keys` creates a scoped key and returns its secret once.
- `POST /:appId/keys/:keyId/rotate` replaces a key and revokes the old key.
- `DELETE /:appId/keys/:keyId` revokes a key.

Secret API keys use the `sk_live_` prefix and are stored as SHA-256 hashes. They have 256 bits of random entropy, so password stretching is not needed for their storage. Public keys use `pk_live_` and are constrained by registered HTTPS origins (localhost is accepted for development). Neither key grants access outside its application.

## Versioned event API

`POST /api/platform/v1/events` accepts an arbitrary event name, optional external `userId`, JSON `properties`, and optional `occurredAt`.

- Server integrations authenticate with `Authorization: Bearer sk_live_…` and an `events:write` scope.
- Browser integrations authenticate with `X-Savitri-Public-Key: pk_live_…`; the request Origin must match an allowed domain. Public keys can submit events only.
- `GET /api/platform/v1/events` requires `analytics:read` and returns events from the authenticated app only (up to 100 rows).

Event properties are limited to 10 KB. Event reads and writes always filter by the authenticated application's database ID.

## Existing notifications

The existing web-push service worker remains `frontend/public/sw.js` and `/api/push` stays compatible. Campaign dispatch has been extracted into `backend/platform/notifications/engine.js` with injected adapters. Push service acceptance is still reported as acceptance, not end-device delivery.

## Current foundation boundaries

Subscriber identity/segmentation, campaign ownership by app, API-key rate limits, webhook delivery, automation execution, a distributable browser SDK, and Salesforce connectors are later platform phases. The app registry and event API do not claim those systems exist yet. Multi-instance rate limiting must use a shared store before public API keys are exposed at high volume.