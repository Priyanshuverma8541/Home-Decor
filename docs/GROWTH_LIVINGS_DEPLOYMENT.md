# Growth Livings rollout

## Independent Vercel projects

Create two Vercel projects from the existing `savitri-livings` repository:

| Project | Vercel root directory | Build command | Output |
| --- | --- | --- | --- |
| Archana portfolio | `resume/Archana-Singh/Archana-Portfolio` | `npm run build` | `dist` |
| Trust Them | `trust-them` | `npm run build` | `dist` |

Set `VITE_API_URL` in both projects to `https://home-decor-0rfj.onrender.com` (or the current Savitri backend origin). The frontend URLs are configured after Vercel assigns them; no custom domain is assumed.

## Backend CORS

Add the two exact Vercel origin URLs, comma-separated, to the existing Render backend variable `GROWTH_ALLOWED_ORIGINS`. Example format: `https://portfolio-project.vercel.app,https://trust-them-project.vercel.app`. The backend reads this setting in `backend/index.js` and normalizes trailing slashes. Do not paste paths into the values.

## Admin setup

Deploy the existing admin with the backend changes, sign in through the existing Savitri admin account, and open **Growth Livings**. Configure each independent Vercel URL in Overview and mark its product active when ready. Add company and opportunity records from verified business information only. There are no seeded companies, job posts, application counts or testimonials.

## Archana portfolio privacy

The portfolio project returns a generic private page until `/api/growth-livings/public/portfolio/archana-singh` confirms both Admin publication and candidate approval. Keep the Vercel URL unlisted until the résumé has been received, the profile has been reviewed by Archana, and she approves publication through her linked Savitri Livings account. `robots.txt` disallows indexing while private.

When the résumé is provided, Admin can store verified public profile content and a resume URL in the private draft. Avoid putting phone, personal email, address, or other private details in the public profile JSON.

## Shared data and consent

Trust Them uses the existing `/api/auth` registration/login, the same JWT token (`sl_token`), the centralized MongoDB connection, Admin authorization, and Cloudinary credentials. Candidate visibility is private by default. An application requires an explicit consent checkbox before the backend stores it, and the admin application list marks that consent timestamp.
