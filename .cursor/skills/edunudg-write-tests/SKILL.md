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

Coverage target: ≥80% on `packages/*`.

## Before finish

Run skill **`edunudg-sync-artifacts`**: update OpenSpec, docs, tests, skills/rules, and agent briefs for the change type. Standing rules: `artifact-sync`, `agent-boundaries`.

## Accessible name queries (Playwright / Testing Library)

Playwright `getByRole(..., { name })` uses **substring** matching unless `exact: true`.

- Primary staff login submit: `getByRole("button", { name: "Log in", exact: true })`
- OAuth: full label, e.g. `{ name: "Log in with Google", exact: true }`
- Never query bare `"Log in"` without `exact` when OAuth buttons are on the page — CI will fail with a strict-mode multiple-match error

Spec: `openspec/specs/staff-login/spec.md`. Regression: `e2e/platform-smoke.spec.ts` → `regression_login_primary_submit_name_is_exact_not_oauth`.
