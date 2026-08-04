# brand-batches-feature-flag

Per-brand Batches module gate for center portals and student self-join.

## Requirements

### Requirement: Platform admin can toggle Batches per brand

The system SHALL expose a **Batches** toggle on the platform brand Features card. Saving SHALL persist `brand_settings.settings.features.batches` as a boolean. When the key is absent, the effective value SHALL be **false**.

#### Scenario: Admin enables Batches for one brand

- **GIVEN** platform admin is on `/admin/brands/:slug`
- **WHEN** they turn Batches ON and Save
- **THEN** that brand’s centers can use Batches
- **AND** other brands are unaffected

#### Scenario: Default is off

- **GIVEN** a brand with no `batches` key in `settings.features`
- **WHEN** feature resolution runs (client or `brand_feature_enabled`)
- **THEN** Batches is treated as disabled

### Requirement: Full gate when Batches is off

When Batches is disabled for a brand, the system SHALL hide the center Batches nav item, redirect `/app/batches` away from the module, reject batch mutations with `feature_disabled`, prevent direct table access via RLS on `batches`, and hide student self-join batch listing/actions.

#### Scenario: Center staff cannot open Batches when off

- **GIVEN** `features.batches` is false for the brand
- **WHEN** center staff navigates to `/app/batches`
- **THEN** they are redirected to `/app`
- **AND** the Batches sidebar item is not shown

#### Scenario: Batch RPC rejects when off

- **GIVEN** `features.batches` is false for the brand
- **WHEN** an authenticated caller invokes `upsert_center_batch` (or soft-delete / sync assignments / student join)
- **THEN** the RPC raises `feature_disabled`
