# Franchise center CSV import

Platform admins and brand staff bulk-onboard franchise centers from a CSV template:

- **Platform** — **Platform → Brands → Edit** (`/admin/brands/:slug`) → Franchise centers → **Import Franchise**
- **Brand** — **Franchise Management** (`/app/centers`) → **Import Franchise**

Both surfaces use the same dialog, client validation, and RPC.

## Spec

Canonical behavior: [`openspec/specs/franchise-center-csv-import/spec.md`](../../openspec/specs/franchise-center-csv-import/spec.md).

## Flow

1. Download the CSV template (headers include `name`, `city`, plus optional profile columns). The franchise URL slug is created from **name** — do not ask for `center_slug`.
2. Fill rows locally; SPA validates file type (`.csv`), size (≤ 2 MB), and rejects binary content.
3. Preview valid vs invalid rows in the import dialog.
4. Confirm → RPC `import_franchise_centers(p_brand_id, p_rows)` provisions centers + hostnames.
5. Platform audit log records `import_franchise_centers` for the brand.

## Security notes

- Prefer parameterized JSON rows via the RPC — do not build dynamic SQL from CSV cells.
- Client validation is UX only; the RPC enforces auth (`is_platform_admin()` or `has_brand_access(p_brand_id)`) and tenant scope.
- Center staff cannot create centers (`centers.create` is platform + brand owner/admin only).
- UI: `FranchiseCenterImportDialog` + helpers in `apps/web/src/lib/franchiseCenterImport*`.

## Tests

- Vitest: `FranchiseCenterImportDialog.test.tsx`, `franchiseCenterImportHelpers.test.ts`
- Brand detail regressions on `/admin/brands/:slug` including `regression_brand_detail_paginates_centers_and_domains`
- Brand Franchise Management regression: `regression_brand_centers_shows_franchise_csv_import`

## Related

- [Platform brand onboarding journey](../journeys/platform-brand-onboarding.md)
- [Brand operator journey](../journeys/brand-operator.md)
- [OpenSpec platform-brand-onboarding](../../openspec/specs/platform-brand-onboarding/spec.md)
- [OpenSpec franchise-center-management](../../openspec/specs/franchise-center-management/spec.md)
