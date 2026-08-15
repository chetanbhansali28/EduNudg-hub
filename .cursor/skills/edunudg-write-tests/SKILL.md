---
name: edunudg-write-tests
description: Write tests for EduNudg features and bugfixes. Required for every PR.
---

# Write Tests

| Change | Tests |
|--------|-------|
| `packages/*` logic | Vitest `*.test.ts` |
| React component | Vitest + `@testing-library/react` |
| User journey | Playwright `e2e/*.spec.ts` — tag with UAT IDs (`E2E-01`, …); see `docs/testing/uat-scenarios.md` |
| Migration / RLS | `supabase/tests/rls_*.sql` |
| Bug fix | `regression_*` test |

Use portal helpers in `e2e/helpers/portal.ts` (CI overrides; `E2E_USE_LOCAL_HOSTS=1` for subdomains). Skip OAuth/payment live flows. Golden paths require Supabase env.

## Commands

```bash
pnpm test
pnpm test:rls
pnpm test:e2e
```

If package tests fail with missing `vitest/vitest.mjs`, run `pnpm install` (see `assert-workspace-test-bins.mjs`).

Use **Vitest ≥4** (matches CI Node 24). Mock constructors with `class`, not arrow `vi.fn(() => …)` — Vitest 4 rejects arrow mocks used with `new` (e.g. `IntersectionObserver`). Auth login tests that render `RequireMembership` must mock `@/lib/supabase` (center operational status).

When mocking `@/lib/homepageApi`, use `importOriginal` and spread `...actual` so query-key constants (`MARKETING_HOMEPAGE_CONFIG_QUERY_KEY`, `MARKETING_PUBLIC_BUNDLE_QUERY_KEY`) remain defined. Never reuse the config-only key for `{ config, legalPages }` bundles — see `openspec/specs/marketing-homepage/spec.md`.

**Platform homepage media:** never treat customized `platform_settings.marketing_homepage` as legacy solely due to Novu `bgGradient` / `themeNote`. `isLegacyPlatformHomepageSeed` must return false when enterprise blocks or `brand-assets` URLs exist (`hasCustomMarketingMedia`). Same rule for brand `landing` / center `center_landing` — use `marketingMediaGuard` (`preserveCustomMarketingMediaUrls` on save; never drop `row.landing` on fallbacks). Rule: `marketing-homepage-media`. Regressions: `regression_homepageLegacySeedKeepsBrandAssets`, `regression_tenantMarketingContentPreservesBrandAssets`.

Spark Academy / Abacus Classic public lead forms live in modals — Playwright helpers: `e2e/helpers/leadModals.ts` (dialog-scoped fills; deep links `#enroll`, `#enroll-student`, `#register`, `#apply`). Mapping: `resolveLeadModalKind.ts`; hash open: `LeadModalHashOpener`. Center Path B passes `centerSlug` so enroll submits `submitCenterStudentRegistration`.

**E2E brand cleanup:** any test that approves a platform brand signup must call `cleanupEphemeralE2EBrand` (see `e2e/helpers/brandCleanup.ts`) so `/admin/brands`, `/admin/subscriptions`, and `/admin/audit` do not accumulate `E2E Brand …` rows. Prefer hard-delete via `hardDeleteEphemeralE2EBrands` (SQL or platform RPC `purge_ephemeral_e2e_brands`) — removes brands, `brand_subscriptions`, signups, and audit logs (not soft archive). Matchers: `e2eEphemeralBrand.ts`.

**E2E student lead cleanup:** any test that creates a student lead (brand Path A, center Path B, manual entry, merge, stale) must use `makeE2ELeadFields` and call `cleanupEphemeralE2ELead` in `finally` (plus suite `afterAll` + Playwright `globalTeardown`). Hard-delete via `hardDeleteEphemeralE2ELeads` — SQL when `DATABASE_URL` is set, otherwise `purge_ephemeral_e2e_leads` / `purge_ephemeral_e2e_leads_for_brand` RPC using seed platform/brand login (never no-op when Supabase anon env is present). Matchers: `e2eEphemeralLead.ts`.

Platform brand settings: theme/name/status saves must not call `brand-owner-credentials` unless login fields were intentionally edited (`BrandEditForm` `loginFieldsTouched` + `shouldSyncBrandOwnerCredentials`).

Brand franchise centers: profile/photo saves must not call `center-owner-credentials` unless Franchise Identity login email/password were intentionally edited (`CenterDetailPanel` `loginFieldsTouched` + `shouldSyncCenterOwnerCredentials`). Brand `/app/centers` launches View Frontend/View Backend; disable/enable uses `set_franchise_center_status`; delete uses `soft_delete_franchise_center`. Soft-deleted centers remain on Franchise Applications under the **Deleted** tab (`regression_deleted_converted_inquiry_uses_deleted_tab`, `regression_deleted_franchise_tab_separates_soft_deleted_centers`) — do not drop inquiry history. **Deleted** is the last filter tab; **All applications** lists deleted inquiries after live rows (`regression_deleted_franchise_inquiries_sort_to_bottom_of_all`, `regression_deleted_franchise_appears_last_on_all_applications`).

Franchise CSV import: platform `/admin/brands/:slug` and brand `/app/centers` share `FranchiseCenterImportDialog`; required CSV columns are `name` and `city`; slug is derived from name (`deriveFranchiseCenterSlug` + RPC) then `import_franchise_centers` (`is_platform_admin` or `has_brand_access`) — see `docs/ops/franchise-center-csv-import.md`.

Center public footer social: `regression_center_landing_footer_ignores_brand_social_connect` and `regression_center_social_links_map_youtube_and_whatsapp` — icons use franchise `social_links` (including YouTube), not brand `social_connect`.

Center public footer contact: `regression_center_footer_contact_uses_franchise_profile_not_brand_hq`, `regression_center_footer_replaces_brand_head_office_with_franchise_contact`, `regression_center_footer_uses_franchise_phone_not_placeholder`, `regression_novu_center_footer_shows_franchise_contact_not_presence` — Novu / Abacus / Spark overlay Franchise Management address and phone.

Center public footer name: `regression_center_footer_replaces_sample_center_placeholder_with_franchise_name` and `regression_center_public_footer_uses_franchise_name_not_sample_center` — never show editor placeholder **Sample Center** on a live center host.

Center public nav lockup: `regression_franchise_frontend_nav_highlights_logo_and_name` — franchise frontend enlarges brand logo and site name (`--franchise` nav modifier).

Curriculum course banner: `regression_curriculum_banner_shows_upload_size_hint` and `regression_curriculum_banner_rejects_images_over_5mb` — dropzone shows formats, 5 MB max, 1280×720; oversized images rejected.

Manual student lead: `regression_manual_brand_student_matches_public_enroll_fields` and `regression_manual_center_student_matches_public_register_fields` — Add Lead is a modal (`ed-import-dialog`), same pattern as Add Franchise.

Coverage target: ≥80% on `packages/*`.

## Before finish

Run skill **`edunudg-sync-artifacts`**: update OpenSpec, docs, tests, skills/rules, and agent briefs for the change type. Standing rules: `artifact-sync`, `agent-boundaries`.

## Accessible name queries (Playwright vs Testing Library)

Both need **exact** matching when labels share a prefix (`Log in` vs `Log in with Google`), but the APIs differ:

| Library | Exact match |
|---------|-------------|
| **Playwright** (`e2e/`) | `{ name: "Log in", exact: true }` |
| **Testing Library** (Vitest) | `{ name: exactAccessibleName("Log in") }` → `/^Log in$/` |

**Never** pass `{ exact: true }` to Testing Library `getByRole` — it is not on `ByRoleOptions` and **fails `pnpm typecheck`**. Helper: `apps/web/src/test/exactAccessibleName.ts`.

Spec: `openspec/specs/staff-login/spec.md`. Regressions: `e2e/platform-smoke.spec.ts`, `apps/web/src/test/exactAccessibleName.test.ts`.
