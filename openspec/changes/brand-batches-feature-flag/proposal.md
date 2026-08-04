## Why

Platform admins need per-brand control of the Batches module (same full-gate pattern as Student leads). Batches today is always available on center portals with no feature toggle.

## What Changes

- Add brand feature flag `batches` (default **off**)
- Platform admin Features card on `/admin/brands/:slug` can turn Batches ON/OFF
- When OFF: hide center nav, block `/app/batches`, reject batch RPCs, tighten `batches` RLS
- When OFF: hide center dashboard batch deep-links and student “join a batch” surfaces
- Docs, OpenSpec delta, Vitest + RLS coverage

## Capabilities

### New Capabilities

- `brand-batches-feature-flag`: Per-brand Batches module gate (admin toggle, nav/route/RPC/RLS)

### Modified Capabilities

- (none — feature-flags documented in `docs/spec/feature-flags.md`; delta lives under this change)

## Impact

- `brand_settings.settings.features.batches`
- Center portal nav/routes/dashboard; student learn join-batch UX
- RPCs: `upsert_center_batch`, `soft_delete_center_batch`, `sync_student_batch_assignments`, `join_student_batch`, `get_student_open_batches`
- RLS policy on `batches`
