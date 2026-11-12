# Savitri Livings Portfolio Builder

The Portfolio Builder is a free Savitri Livings tool at `/portfolio-builder` and is also linked from Development. Drafts and publishing use the existing Savitri Livings backend and MongoDB. The builder includes a personal portfolio starter for Priyanshu Verma and reusable content blocks for other creators.

## Savitri Pages publishing

Clicking Publish creates or updates a `Page` record through the existing MongoDB-backed Savitri Pages system, with no checkout or payment configuration. The public URL is `https://home-decor-inky.vercel.app/p/<slug>`. The page is listed under **Admin → Savitri Pages**, where it can be previewed, edited, measured, unpublished, or archived. The same frontend deployment serves all portfolio pages; each portfolio does not create a separate hosting project.

The portfolio page uses the shared page renderer and supports the existing Savitri Pages blocks plus portfolio project cards and skill chips. Enquiry forms use the existing page-form and lead workflows. The public content comes from the creator’s profile; the optional public email and editor token remain in the builder record.

## Gemini

Gemini calls happen only on the backend. Configure these variables on the Savitri Livings Render service:

- `GEMINI_API_KEY` — the Google Generative Language API key (never put it in Vite/frontend settings).
- `GEMINI_MODEL=gemini-3.8-flash` — the currently recommended model for this app.

If Gemini reports an unavailable model, check `GEMINI_MODEL`; if it reports a rejected key, check the key and ensure the Generative Language API is enabled in its Google project. After changing Render variables, redeploy the backend.

## Production publishing

The publisher uses the existing Savitri Livings backend and page records. No payment credentials or portfolio-specific enable flag are needed. Optionally set the public origin:

- `SAVITRI_PAGES_ORIGIN=https://home-decor-inky.vercel.app` (optional while using the default URL).

No Vercel token is required for portfolio publishing.
