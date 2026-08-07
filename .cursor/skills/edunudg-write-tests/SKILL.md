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

**E2E brand cleanup:** any test that approves a platform brand signup must call `cleanupEphemeralE2EBrand` (see `e2e/helpers/brandCleanup.ts`) so `/admin/brands` and `/admin/audit` do not accumulate `E2E Brand …` / `e2e-brand-…` rows. Prefer hard-delete via `hardDeleteEphemeralE2EBrandsViaSql` / `purge_ephemeral_e2e_brands()` (brands, signups, and matching `platform_audit_logs` — not soft archive). Matchers: `e2eEphemeralBrand.ts`.

**E2E student lead cleanup:** any test that creates a student lead (brand Path A, center Path B, manual entry, merge, stale) must use `makeE2ELeadFields` and call `cleanupEphemeralE2ELead` in `finally` (plus suite `afterAll` sweep). Hard-delete via `hardDeleteEphemeralE2ELeadsViaSql` / `purge_ephemeral_e2e_leads()` so brand and center `/app/leads` (e.g. Koramangala) do not accumulate garbage. Matchers: `e2eEphemeralLead.ts`.

Platform brand settings: theme/name/status saves must not call `brand-owner-credentials` unless login fields were intentionally edited (`BrandEditForm` `loginFieldsTouched` + `shouldSyncBrandOwnerCredentials`).

Franchise CSV import: validate client-side then `import_franchise_centers` RPC — see `docs/ops/franchise-center-csv-import.md`.

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
