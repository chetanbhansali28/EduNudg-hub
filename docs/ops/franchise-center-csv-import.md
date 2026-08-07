# Franchise center CSV import

Platform admins bulk-onboard franchise centers for a brand from a CSV template on **Platform → Brands → Edit** (`/admin/brands/:slug`) → Franchise centers → **Import CSV**.

## Spec

Canonical behavior: [`openspec/specs/franchise-center-csv-import/spec.md`](../../openspec/specs/franchise-center-csv-import/spec.md).

## Flow

1. Download the CSV template (headers include `center_slug`, `name`, `city`, plus optional profile columns).
2. Fill rows locally; SPA validates file type (`.csv`), size (≤ 2 MB), and rejects binary content.
3. Preview valid vs invalid rows in the import dialog.
4. Confirm → RPC `import_franchise_centers(p_brand_id, p_rows)` provisions centers + hostnames.
5. Platform audit log records `import_franchise_centers` for the brand.

## Security notes

- Prefer parameterized JSON rows via the RPC — do not build dynamic SQL from CSV cells.
- Client validation is UX only; the RPC enforces auth (platform admin) and tenant scope.
- UI: `FranchiseCenterImportDialog` + helpers in `apps/web/src/lib/franchiseCenterImport*`.

## Tests

- Vitest: `FranchiseCenterImportDialog.test.tsx`, `franchiseCenterImportHelpers.test.ts`
- Brand detail regressions on `/admin/brands/:slug`

## Related

- [Platform brand onboarding journey](../journeys/platform-brand-onboarding.md)
- [OpenSpec platform-brand-onboarding](../../openspec/specs/platform-brand-onboarding/spec.md)
