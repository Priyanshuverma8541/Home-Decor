# Savitri Livings Portfolio Builder

The Portfolio Builder is a Savitri Livings tool at `/portfolio-builder` and is also linked from the Tools page. Its drafts and verified ₹99 payments are stored by the existing Savitri Livings backend. The builder includes a personal portfolio starter for Priyanshu Verma and reusable content blocks for other creators.

## Savitri Pages publishing

After payment is verified, publishing creates a `Page` record through the existing MongoDB-backed Savitri Pages system. The public URL is `https://home-decor-inky.vercel.app/p/<slug>`. The page is listed under **Admin → Savitri Pages**, where it can be previewed, edited, measured, unpublished, or archived. The same frontend deployment serves all portfolio pages; each portfolio does not create a separate hosting project.

The portfolio page uses the shared page renderer and supports the existing Savitri Pages blocks plus portfolio project cards and skill chips. Enquiry forms use the existing page-form and lead workflows. The public content comes from the creator’s profile; receipt email and editor token remain private to the builder record.

## Gemini

Gemini calls happen only on the backend. Configure these variables on the Savitri Livings Render service:

- `GEMINI_API_KEY` — the Google Generative Language API key (never put it in Vite/frontend settings).
- `GEMINI_MODEL=gemini-3.8-flash` — the currently recommended model for this app.

If Gemini reports an unavailable model, check `GEMINI_MODEL`; if it reports a rejected key, check the key and ensure the Generative Language API is enabled in its Google project. After changing Render variables, redeploy the backend.

## Production publishing and payment

Set these on Render only after the Savitri Pages URL and payment configuration are confirmed:

- `SAVITRI_PAGES_ORIGIN=https://home-decor-inky.vercel.app` (optional while using the default URL).
- `PORTFOLIO_PUBLISHING_ENABLED=true` to allow paid drafts to create a published Savitri Page.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` using live-mode credentials before charging real customers.
- `PORTFOLIO_LIVE_PAYMENTS_ENABLED=true` only after live checkout and captured-payment verification are confirmed.

Test Razorpay credentials cannot collect real ₹99 payments. Keep the publish/payment flags off until the live integration is ready. No Vercel token is required for portfolio publishing.
