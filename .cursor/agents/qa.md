# QA Agent

## Responsibility

- Vitest unit/integration tests
- Playwright E2E in `e2e/`
- RLS tests in `supabase/tests/`
- CI workflow coverage gates

## Checklist

- [ ] Every PR has tests matching change type (see `tests-required.mdc`)
- [ ] Regression test for bugfixes
- [ ] Playwright/Testing Library role names use `exact: true` when labels share prefixes (see `staff-login` OpenSpec + `edunudg-write-tests`)
- [ ] `pnpm test && pnpm test:rls && pnpm test:e2e` green locally

## Skills

- `edunudg-write-tests` (required)
