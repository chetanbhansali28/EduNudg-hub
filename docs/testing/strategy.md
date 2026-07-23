# Testing Strategy

## Pyramid

| Layer | Tool |
|-------|------|
| Unit | Vitest |
| Integration | Vitest + Supabase local |
| RLS | `supabase/tests/*.sql` |
| E2E | Playwright |

## Policy

Every feature and bug fix includes tests in the same PR.

### Critical regression suites

| Area | Test file(s) |
|------|----------------|
| Platform admin cross-portal handoff | `platformAdminPortalAccess.critical.test.tsx`, `AuthHandoffPage.test.tsx`, `portalHandoffUrl.test.ts` |
| Backend KPI theme (all staff dashboards) | `backendKpiTheme.test.tsx` |
| Brand portal login / tenant scope | `LoginPage.brandPortal.test.tsx`, `resolveTenantScope.test.ts` |
| Staff login accessible names | `LoginPage.test.tsx`, `exactAccessibleName.test.ts`, `e2e/platform-smoke.spec.ts` |
| Agent guardrails / artifact sync | `regression_agentGuardrails.test.ts` |
| Brand success stories page | `BrandSuccessStoriesPage.test.tsx` |
| Workspace package type exports | `regression_workspacePackageExports.test.ts` |

## Local package tests

`pnpm test` runs `scripts/assert-workspace-test-bins.mjs` first. If `@edunudg/tenant` / `@edunudg/permissions` fail with `Cannot find module .../vitest/vitest.mjs`, the vitest symlink is broken — run **`pnpm install`** (incomplete `node_modules` after interrupted installs). Regression: `regression_workspaceVitestInstall.test.ts`.

### Playwright / Testing Library accessible names

Role name prefixes collide (`Log in` vs `Log in with Google`):

- **Playwright**: `{ name: "Log in", exact: true }`
- **Testing Library**: `{ name: exactAccessibleName("Log in") }` — **never** `{ exact: true }` (fails `tsc`)

See OpenSpec [`staff-login`](../../openspec/specs/staff-login/spec.md). Helper: `apps/web/src/test/exactAccessibleName.ts`.

## CI

- GitHub: `.github/workflows/ci.yml` — Node **24**, audit:schema, build, typecheck, test, test:rls, e2e
- Vitest **≥4** (workspace) — required for Node 24 + jsdom + React Router client navigations (AbortSignal/`undici` compatibility)
- Login portal tests that mount `RequireMembership` mock `@/lib/supabase` so center status does not hit the network
- Local mirror before push: **`pnpm ci:local`** (skill `edunudg-pre-push-ci` — auto-fix failures, then push only when green)

## Local dev

- `pnpm dev` → http://localhost:9000 (strict port, see `apps/web/vite.config.ts`)

Coverage: ≥80% on `packages/*`.
