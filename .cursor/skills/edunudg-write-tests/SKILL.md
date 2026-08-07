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

Spark Academy / Abacus Classic public lead forms live in modals — Playwright helpers: `e2e/helpers/leadModals.ts` (dialog-scoped fills; deep links `#enroll`, `#enroll-student`, `#register`, `#apply`). Mapping: `resolveLeadModalKind.ts`; hash open: `LeadModalHashOpener`. Center Path B passes `centerSlug` so enroll submits `submitCenterStudentRegistration`.

Platform brand settings: theme/name/status saves must not call `brand-owner-credentials` unless login fields changed (`BrandEditForm` `credentialsChanged`).

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
