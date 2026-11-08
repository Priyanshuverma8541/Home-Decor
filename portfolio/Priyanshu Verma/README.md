# Priyanshu Verma — Portfolio

Standalone, mobile-first portfolio for deployment as its own Vercel project. The profile copy is sourced from the provided biography. The enquiry form submits to Savitri Livings' existing `POST /api/leads` endpoint; enquiries appear in the existing Leads area of Savitri Livings Admin, tagged `priyanshu-portfolio`.

## Deploy

Import this folder (`portfolio/Priyanshu Verma`) as the Vercel project root. It is a static site, so no build command or install is required. The suggested project name is `priyanshu-verma-portfolio`; Vercel will assign the available `*.vercel.app` address. After deployment, add that exact origin to the backend's `PRIYANSHU_PORTFOLIO_URL` environment variable so browser enquiries are accepted by Savitri's API.

To point the form to another Savitri backend, set `window.SAVITRI_API_URL` before `main.js` in `index.html` (or update the default URL in `main.js`). Do not put private keys in this site; it is public static content.

## Profile content and assets

- `index.html` contains the public profile and SEO metadata.
- `style.css` contains the visual system and responsive states.
- `main.js` handles navigation, modest scroll reveals, and lead submission.
- `portrait.jpeg` is Priyanshu's supplied portrait.

The portfolio uses no third-party runtime libraries. Its abstract illustrations are CSS/SVG and respect reduced-motion preferences.
