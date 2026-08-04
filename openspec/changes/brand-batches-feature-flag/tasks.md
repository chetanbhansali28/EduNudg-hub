## 1. Client flag + admin UI

- [x] 1.1 Add `batches: false` to `FEATURE_FLAG_DEFAULTS` and tests
- [x] 1.2 Add Batches to `BRAND_FEATURE_TOGGLES` + card test
- [x] 1.3 Gate center nav (`CENTER_FEATURE_FLAGS`) + `FeatureFlagRoute` on `/app/batches`
- [x] 1.4 Hide center dashboard batch links and student join surfaces when off

## 2. Backend full gate

- [x] 2.1 Migration: `brand_feature_enabled` defaults `batches` to false
- [x] 2.2 Guard batch RPCs; RLS on `batches`; RLS SQL test

## 3. Docs / sync

- [x] 3.1 Update `docs/spec/feature-flags.md` and `navigation-spec.md`
- [x] 3.2 Keep OpenSpec change artifacts in sync
