# BuildHub in Savitri Livings

BuildHub is served by the existing Savitri Livings frontend, backend, Admin login, MongoDB connection, and Cloudinary configuration. It does not need a separate Render API, database, or Admin account.

## Experiences

- Public page: `/buildhub` on the Savitri Livings frontend.
- Savitri Admin: `/buildhub` after the existing Admin login.
- Backend API: `/api/buildhub` on the existing Savitri Livings backend.
- Public functions: student and business catalogue, category/search filters, project details, project enquiries, UPI order creation, coupon validation, order lookup, and WhatsApp payment follow-up.
- Admin functions: dashboard, catalogue creation/edit/publish/hide/archive, image upload, pricing, coupons and site settings, payment review, fulfillment details, enquiries, notes, follow-up dates, and CSV order export.

BuildHub documents use dedicated `SavitriBuildHub*` collections inside the existing `MONGO_URI` database. Admin operations use Savitri Livings' current JWT and `adminOnly` middleware. Project thumbnails and gallery images use the existing Cloudinary configuration. Email confirmation and notifications are best-effort and use the backend's optional `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` settings.

## Existing BuildHub database data

The old BuildHub README describes a separate MongoDB database. The integrated system intentionally does not connect to that database at runtime. If that deployment contains projects, orders, enquiries, or settings that should be kept, export/import them once before using the integrated Admin:

1. Set `BUILDHUB_MONGO_URI` to the legacy BuildHub database and `MONGO_URI` to the Savitri Livings database in a trusted local environment.
2. From `backend`, run `node scripts/migrateBuildHubData.js` once.
3. The importer preserves source document IDs and inserts only missing IDs; it does not overwrite Savitri Livings records.
4. Remove `BUILDHUB_MONGO_URI` after the import. Never add either URI to source control.

The migration is not run automatically. That avoids copying data to the wrong production database. The integrated site can be deployed independently of the legacy BuildHub folder; configure the existing Savitri frontend and backend deployments as usual.
