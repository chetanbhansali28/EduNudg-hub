## Context

Centers are provisioned via `approve_franchise_inquiry`. Brand staff need one place to manage franchise profile, curriculum versions, and lifecycle without deleting records.

## Goals

- Master-detail UI aligned with franchise applications and student leads pipelines
- Reversible suspend blocks center staff `/app` and public registration (already gated on `active`)
- Brand assigns published curriculum versions per center; batches and enrollments must respect pins
- Slug immutable after provisioning

## Non-Goals

- Student learn portal behavior when franchise suspended (TODO)
- Operator email/WhatsApp on suspend
- `closed` permanent end-of-life UI
- Subscription `max_franchise_centers` enforcement

## Decisions

### D1 — Suspend semantics

`set_franchise_center_status` allows `active` ↔ `suspended` only from brand UI. Memberships are not revoked; `assert_center_operational` gates center-staff RPCs. Brand staff bypass via `has_brand_access`.

### D2 — Curriculum versions

`center_curriculum_enablement` replaces program-only checks in `assert_center_curriculum_authorized`. On sync, auto-derive `center_program_enablement` rows from enabled versions' programs. Block removal when active batches reference version.

### D3 — Slug

Read-only in brand UI; never sent in update payloads.

### D4 — Deep link

`/app/centers?center={slug}` replaces separate detail route.

## Risks

- Existing centers with program enablement but no version rows need migration backfill from program enablement → all published versions for those programs.
