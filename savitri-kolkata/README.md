# Savitri Livings — Kolkata Local Commerce

A separate, lightweight Vite + vanilla JavaScript frontend for Kolkata discovery and customer acquisition. It consumes the existing Savitri Livings product, settings, leads, partner, checkout and platform analytics services; it does not add a new store backend or payment system.

## Local development

```sh
npm install
npm run dev
```

The local frontend runs at `http://localhost:5181`. The existing backend CORS list includes this development origin.

## Vercel deployment

Create a Vercel project with this folder as its **Root Directory**. Use `npm run build` and output directory `dist`. `vercel.json` provides client-side routes for QR, campaign, product and localized SEO URLs. Add these environment variables in Vercel:

- `VITE_API_URL=https://home-decor-0rfj.onrender.com`
- `VITE_STORE_URL=https://home-decor-n2z6.vercel.app` (change if the existing Savitri storefront domain differs)
- `VITE_SITE_URL=https://<your-final-kolkata-domain>` for canonical SEO links
- `VITE_PLATFORM_PUBLIC_KEY=<public key for app_savitri_livings>` to enable consent-based browser acquisition events

After deployment, add the final Kolkata site hostname to the `app_savitri_livings` allowed domains in Admin → Platform Apps. Set the same origin as Render's `KOLKATA_COMMERCE_URL` environment variable and redeploy the existing backend. The backend CORS policy also permits registered application domains. Never put a secret API key in this frontend.

The static build pre-renders distinct title/description and useful introductory text for the Kolkata/area SEO URLs. The final canonical hostname is intentionally configured at deploy time instead of guessing a production domain.

## Live integrations

- Products, inventory, category, sale pricing, images, seasonal/featured flags and Meesho links come from `GET /api/products`.
- WhatsApp number and social identity use `GET /api/settings`; area delivery/pickup is confirmed by message because current settings do not define Kolkata-specific promises.
- “View & add to bag” opens the existing Savitri product/cart flow. Orders and payment continue through the existing backend.
- Drop-alert enquiries use the existing lead model and Admin CRM. The explicit contact consent is recorded with the lead. Community requests use lead records tagged `kolkata-local` and `community-pop-up`; partner applications use the existing Partner Business pipeline and retain their consent record.
- Checkout records source/campaign/medium/referral/local area on the existing order. Once an order is marked paid, the existing platform event registry receives purchase and, when attributed, referral-conversion events.
- Landing, location, product, WhatsApp, lead, community, partner and share interactions go to the existing platform event API only when a Savitri Livings public platform key is configured **and** the visitor opts into optional analytics.

No fake reviews, product counts, rewards, local delivery SLAs or marketing ROI are shown. There is no referral payout system configured; referral links carry a code for eventual order attribution only.
