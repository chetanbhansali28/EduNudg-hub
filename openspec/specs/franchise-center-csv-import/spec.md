# franchise-center-csv-import Specification

## Purpose

Platform admins and brand staff (owner/admin) bulk-onboard franchise centers for a brand from a CSV template, provisioning center records and center portal hostnames safely. Platform UI is `/admin/brands/:slug`; brand UI is `/app/centers`.

## Related

- Platform brand onboarding: `openspec/specs/platform-brand-onboarding/spec.md`
- Franchise center management: `openspec/specs/franchise-center-management/spec.md`
- Franchise inquiry approval (single-center path): `approve_franchise_inquiry` RPC
- Platform data export center columns: `apps/web/src/lib/platformDataExportHelpers.ts`

## Requirements

### Requirement: CSV template download

Platform admins and brand staff SHALL download a franchise center import template from the import dialog.

#### Scenario: Download template

- **GIVEN** platform admin is on `/admin/brands/:slug` or brand staff is on `/app/centers`
- **WHEN** they open **Import Franchise** and click **Download template**
- **THEN** the browser downloads a CSV with headers `name`, `city`, and optional profile columns plus one sample row
- **AND** the template SHALL NOT include `center_slug`

### Requirement: Auto-generated center URL

The system SHALL create `franchise_centers.slug` from the franchise **name** (slugified). Callers SHALL NOT be required to supply `center_slug`.

#### Scenario: Slug from name

- **GIVEN** a CSV row with name `Andheri West` and city `Mumbai`
- **WHEN** the row is imported
- **THEN** the stored slug is `andheri-west`
- **AND** the center hostname is `{slug}.{brand_slug}.localhost`

#### Scenario: Unique suffix on collision

- **WHEN** the derived slug already exists for the brand or earlier in the same file
- **THEN** the system stores `andheri-west-2` (then `-3`, …)
- **AND** does not ask the user to type a slug

#### Scenario: Legacy CSV with center_slug column

- **WHEN** an older file still includes a `center_slug` column
- **THEN** that column is ignored
- **AND** the slug is still derived from `name`

### Requirement: Client-side CSV validation

The SPA SHALL parse CSV files locally, enforce limits, and preview rows before import.

#### Scenario: Reject invalid file type

- **WHEN** the user selects a non-`.csv` file or a file larger than 2 MB
- **THEN** the UI shows an error and does not call the server

#### Scenario: Reject binary content

- **WHEN** the selected file contains null bytes in the first 8 KB
- **THEN** the UI rejects it as binary and does not call the server

#### Scenario: Preview valid and invalid rows

- **WHEN** the user selects a valid CSV with required columns
- **THEN** the UI shows a preview table with per-row validation errors
- **AND** only rows without client validation errors are eligible for import

#### Scenario: Sanitize formula injection

- **WHEN** a cell begins with `=`, `+`, `-`, `@`, or tab
- **THEN** the client neutralizes the leading character before validation and RPC submission

### Requirement: Secure bulk import RPC

The system SHALL create franchise centers via `import_franchise_centers(p_brand_id, p_rows)` using parameterized JSON rows only.

#### Scenario: Authorized import

- **GIVEN** caller is platform admin or has brand access for `p_brand_id` (`brand_owner` / `brand_admin`)
- **WHEN** valid rows are submitted
- **THEN** each row inserts an `active` `franchise_centers` record with slug derived from name
- **AND** inserts a primary `domain_mappings` row with hostname `{derived_slug}.{brand_slug}.localhost` and `portal_type = center`
- **AND** optionally inserts a `center_owner` membership invite when `owner_email` matches an auth user

#### Scenario: Reject unauthorized caller

- **WHEN** caller lacks platform admin and brand access
- **THEN** the RPC raises `Not authorized`

#### Scenario: Reject SQL injection payloads

- **WHEN** row text contains SQL metacharacters or script tags
- **THEN** values are stored as plain text via bound parameters
- **AND** no dynamic SQL is constructed from user input

#### Scenario: Enforce subscription center limit

- **WHEN** `brand_settings.features.max_franchise_centers` would be exceeded
- **THEN** remaining rows fail with `Brand franchise center limit reached`

#### Scenario: Partial success

- **WHEN** some rows fail validation or hit duplicate slugs
- **THEN** valid rows are still created
- **AND** the RPC returns `{ created: [...], errors: [...] }`

#### Scenario: Audit successful import

- **WHEN** at least one center is created
- **THEN** `log_platform_audit` records `import_franchise_centers` for the brand

### Requirement: Import UI on brand detail

Platform admins SHALL import centers from the Franchise centers card on `/admin/brands/:slug`.

#### Scenario: Open import dialog

- **WHEN** platform admin clicks **Import Franchise** on the Franchise centers card
- **THEN** a modal opens with template download, file picker, preview, and import action

#### Scenario: Refresh list after import

- **WHEN** import creates one or more centers
- **THEN** the Franchise centers list and domain mappings refresh without a full page reload

### Requirement: Import UI on brand franchise management

Brand staff with `centers.create` (`brand_owner`, `brand_admin`) SHALL import centers from Franchise Management at `/app/centers` using the same CSV dialog and `import_franchise_centers` RPC as platform admins.

#### Scenario: Open import dialog from brand portal

- **GIVEN** brand owner or brand admin is on `/app/centers`
- **WHEN** they click **Import Franchise**
- **THEN** a modal opens with template download, file picker, preview, and import action
- **AND** confirmed rows call `import_franchise_centers` for the current brand only

#### Scenario: Refresh brand directory after import

- **WHEN** import creates one or more centers
- **THEN** the Franchise Management directory refreshes without a full page reload
