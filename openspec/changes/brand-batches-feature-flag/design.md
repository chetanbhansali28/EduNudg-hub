## Context

Brand module flags live in `brand_settings.settings.features` jsonb. Admin UI: `BrandFeatureTogglesCard`. Client: `useFeatureFlag` / `FEATURE_FLAG_DEFAULTS`. Server: `brand_feature_enabled(brand_id, key)`. Missing keys currently default to `true` in SQL except `merchandise`/`kits` → `false`.

## Goals / Non-Goals

- **Goals:** Full gate for `batches` (admin toggle + nav + route + RPC + RLS); default **off**; per-brand only.
- **Non-Goals:** Subscription-plan entitlement UI for batches; brand-portal Batches page (center-only module).

## Decisions

1. **Default off** — Client `FEATURE_FLAG_DEFAULTS.batches = false`; SQL `brand_feature_enabled` special-cases `batches` like merchandise.
2. **Full gate** — Match Student leads: `FeatureFlagRoute`, `CENTER_FEATURE_FLAGS`, RPC `feature_disabled`, RLS on `batches`.
3. **Student join** — Learn portal cannot read `brand_settings` (RLS). Gate via SECURITY DEFINER RPCs: mutations raise `feature_disabled`; `get_student_open_batches` returns `[]` when off (UI hides empty join lists).
4. **Dashboard** — Hide batch KPI / View All / batch action items when flag off (center frontend `useFeatureFlag`).

## Risks / Trade-offs

- Existing brands lose Batches until a platform admin enables the toggle — intentional per product decision (default off).
