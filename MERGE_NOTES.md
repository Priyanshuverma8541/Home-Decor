# Savitri Livings + Thikana integration

The primary `frontend`, `backend`, and `admin` applications are now the single product. The old `03_full stack` and `thikana` folders are retained as source archives and are not runtime dependencies.

## New user paths

- `/marketplace` — Thikana discovery and search.
- `/marketplace/listing/:id` — listing detail.
- `/marketplace/sell` — existing Savitri account becomes a seller and submits listings.
- Admin `/marketplace` — listing approval/rejection, featuring, statistics, and category management.

## First deployment

1. Deploy the current root `frontend`, `backend`, and `admin` folders as the only three services.
2. Set the frontend and admin deployment URLs in the backend's `CLIENT_URL` and `ADMIN_URL`; add the final Vercel origins to the allow list if they differ.
3. Run `npm run seed:jewellery` and `npm run seed:marketplace` from `backend` once after `MONGO_URI` is configured. This adds the initial Savitri Jewellers catalogue and marketplace categories. You can then edit each product from Admin → Products.
4. Make at least one existing account an `admin` in MongoDB before using the moderation panel.

The marketplace deliberately uses `MarketplaceListing` and `MarketplaceCategory` collections. It does not alter existing product, order, cart, or customer records.
