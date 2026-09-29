# SavitriBridge

A standalone Web Push notification and engagement platform: an admin dashboard for creating projects, managing
subscribers, and sending real, trackable Web Push campaigns to any number of external websites — the first being
Savitri Livings (https://home-decor-inky.vercel.app/).

## What's in this repo

```
backend/    Node.js + Express + MongoDB API (admin + public), VAPID web-push sending, scheduler
frontend/   Vanilla HTML/CSS/JS admin dashboard, demo page, and the reusable push-client.js + sw.js
docs/       API reference and the future server/SFMC integration design (not yet implemented)
```

## Quick start (local)

```bash
# 1. Backend
cd backend
cp ../.env.example .env         # fill in MONGO_URI at minimum; see comments in the file
npm install
npm run generate-vapid          # copy the two printed keys into .env
npm run dev                     # http://localhost:5000

# 2. Frontend (any static file server)
cd ../frontend
python3 -m http.server 5500     # http://localhost:5500
# edit js/config.js if your backend isn't on localhost:5000
```

Open `http://localhost:5500/login.html`, sign in with `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` from your
`.env`, then change the password from Settings. Create a project, add `http://localhost:5500` to its allowed
origins, then open `demo.html` to test real push end-to-end (click **Enable Notifications**, then from
**Subscribers** in the dashboard use **Send test push**).

## Deployment

See the in-app **Guide** page (`frontend/guide.html`, section "Deployment") for the full walkthrough — Render for
the backend, Vercel (or any static host) for the frontend, MongoDB Atlas, and Cloudinary for media.

**Never regenerate VAPID keys on a live deployment** — every existing browser subscription would stop receiving
push and every subscriber would need to re-subscribe.

## Connecting another website (e.g. Savitri Livings)

1. Create a project in the dashboard, e.g. "Savitri Livings", with allowed origin
   `https://home-decor-inky.vercel.app`.
2. Copy `frontend/js/push-client.js` and `frontend/sw.js` into that site (sw.js at the site's root).
3. Add the snippet from the dashboard's **Integration** page (pre-filled with that project's public ID and API
   URL — contains no secrets).

Full details, troubleshooting, and the Salesforce Marketing Cloud roadmap: `frontend/guide.html` and
`docs/SFMC_FUTURE_INTEGRATION.md`.

## Security notes

- Push endpoints/encryption keys are stored server-side only and never returned by any API, export, or log.
- Campaign target URLs and media must be valid http(s) URLs on a project's allowed origins.
- Admin roles (Super Admin / Admin / Marketer / Viewer) are enforced on the backend, not just hidden in the UI.
- `.env` is never committed (see `.gitignore`); only `.env.example` (no real values) is.
