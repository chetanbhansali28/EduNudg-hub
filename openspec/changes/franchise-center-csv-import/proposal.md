# Franchise center CSV import

## What & why

Platform admins onboarding a brand (e.g. Abacus World) need to bulk-create franchise centers with center portal hostnames. Today creation is one-by-one via franchise inquiry approval. CSV import on `/admin/brands/:slug` mirrors approval side effects with strict validation and no raw file storage.

## Security

- Parse CSV in browser; send JSON rows only to RPC
- Max 2 MB / 500 rows; reject binary files
- Neutralize CSV formula-injection prefixes client + server
- Parameterized RPC; no dynamic SQL
- Auth: `is_platform_admin()` OR `has_brand_access(brand_id)`
- Respect `max_franchise_centers`; audit log on success

## Design

- UI: `FranchiseCenterImportDialog` on `BrandDetailPage`
- Lib: `franchiseCenterImportHelpers.ts`, `franchiseCenterImportApi.ts`
- DB: `067_import_franchise_centers.sql`

## Tasks

- [x] Migration + RLS smoke test
- [x] Import helpers + Vitest (incl. regression security cases)
- [x] Import dialog + brand detail wiring
- [x] OpenSpec spec
