# GangaBhog standalone storefront

This folder contains the GangaBhog Vite frontend for independent deployment. In Vercel, set the project root directory to `gangabhog`; install with `npm install` and build with `npm run build`.

The included `.env` has public frontend configuration only. Set `VITE_API_URL` to the deployed Savitri Livings backend when deploying. MongoDB, JWT, Cloudinary, payment, and other server secrets must stay in the Savitri backend environment; Vite embeds every `VITE_*` value into public browser assets.

Client dashboard access is served by the Savitri admin at `/login?mode=business`. The Savitri super admin selects a business in **Client Stores**, sets a one-time setup code, and shares it with that business. First-time users create their own password at `/business/setup`. Client sessions are tenant-scoped by the backend.
