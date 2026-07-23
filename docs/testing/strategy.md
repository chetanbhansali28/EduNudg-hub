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
| Staff login accessible names | `LoginPage.test.tsx` (`regression_primary_submit_accessible_name_is_exact_log_in`), `e2e/platform-smoke.spec.ts` |
| Agent guardrails / artifact sync | `regression_agentGuardrails.test.ts` |
| Brand success stories page | `BrandSuccessStoriesPage.test.tsx` |
| Workspace package type exports | `regression_workspacePackageExports.test.ts` |

### Playwright / Testing Library accessible names

Role queries use **substring** matching by default in Playwright. When multiple controls share a prefix (e.g. `Log in` vs `Log in with Google`), always pass **`exact: true`** (or a regex anchored to the full string). See OpenSpec [`staff-login`](../../openspec/specs/staff-login/spec.md).

## CI

- `pnpm test`
- `pnpm test:rls`
- `pnpm test:e2e` (preview/dev on port **9000**)
- `pnpm audit:schema`

## Local dev

- `pnpm dev` → http://localhost:9000 (strict port, see `apps/web/vite.config.ts`)

Coverage: ≥80% on `packages/*`.
