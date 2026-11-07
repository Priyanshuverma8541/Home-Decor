# Portfolio Studio

Portfolio Studio is part of the Savitri Livings frontend at `/portfolio-builder`. Its Growth Livings card and the homepage's Portfolio AI Builder carousel item open the same experience. Savitri Livings Admin manages orders under **Growth Livings → Portfolio websites**.

## Existing infrastructure used

- MongoDB stores private drafts, payment status, and Vercel deployment details.
- The Savitri Livings backend calls Gemini with its server-side `GEMINI_API_KEY`; the browser never receives that key.
- Razorpay creates an INR 99 order on the server. The backend verifies the checkout signature and confirms a captured payment before publishing.
- Vercel receives a generated static portfolio under a unique project name based on the name selected by the customer.

The builder creates a private draft while the user edits. Public contact details are optional and appear on a published site only if the user enters them. The owner edit token is returned once and stored in that browser; Admin never receives it.

## Required production environment

Set these on the Savitri Livings Render backend:

- `GEMINI_API_KEY` and `GEMINI_MODEL` for Gemini writing help.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` for checkout. Test-mode credentials do not collect real payments; switch to live-mode credentials before charging customers.
- `VERCEL_TOKEN` for deployments, and `VERCEL_TEAM_ID` if the Vercel project belongs to a team.
- `PORTFOLIO_BUILDER_URL` set to the exact deployed Portfolio Studio origin for CORS.
- Keep `PORTFOLIO_PUBLISHING_ENABLED=false` and `PORTFOLIO_LIVE_PAYMENTS_ENABLED=false` until the hosting plan and live Razorpay credentials are ready. Only set each to `true` after its connection is verified.

Set the Savitri frontend's existing `VITE_API_URL` to the backend origin. Do not add server credentials to frontend environment variables.

Commercial hosting: Vercel restricts its Hobby plan to personal, non-commercial use. A paid website publishing service needs an account/plan that permits commercial deployments. Confirm the hosting account before enabling paid publishing.
