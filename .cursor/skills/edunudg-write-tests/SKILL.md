---
name: edunudg-write-tests
description: Write tests for EduNudg features and bugfixes. Required for every PR.
---

# Write Tests

| Change | Tests |
|--------|-------|
| `packages/*` logic | Vitest `*.test.ts` |
| React component | Vitest + `@testing-library/react` |
| User journey | Playwright `e2e/*.spec.ts` |
| Migration / RLS | `supabase/tests/rls_*.sql` |
| Bug fix | `regression_*` test |

## Commands

```bash
pnpm test
pnpm test:rls
pnpm test:e2e
```

If package tests fail with missing `vitest/vitest.mjs`, run `pnpm install` (see `assert-workspace-test-bins.mjs`).

Use **Vitest ≥4** (matches CI Node 24). Mock constructors with `class`, not arrow `vi.fn(() => …)` — Vitest 4 rejects arrow mocks used with `new` (e.g. `IntersectionObserver`). Auth login tests that render `RequireMembership` must mock `@/lib/supabase` (center operational status).

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
