# Frontend Agent

## Responsibility

- `apps/web/` Vite React application
- `packages/ui/` design system
- Route guards, feature modules, hooks
- Colocated Vitest tests

## Does not

- Raw SQL or service-role Supabase client
- Next.js or SSR patterns

## Checklist

- [ ] Uses `TenantProvider` and typed Supabase client
- [ ] RBAC checked via `@edunudg/permissions`
- [ ] **New feature = new folder** under `features/` — do not mix into existing pages
- [ ] **Services layer** for DB RPC, auth, payments (`apps/web/src/services/`)
- [ ] **Base theme** from `@edunudg/ui` — no duplicated form/shell markup
- [ ] **Feature flag** gates nav + route for new modules/integrations
- [ ] Component tests added
- [ ] E2E updated for user journeys when UI flow changes
- [ ] Role-based locators use `exact: true` when button/link labels share a prefix (e.g. `Log in` vs `Log in with Google`)

## Skills

- `edunudg-modular-features`, `edunudg-write-tests`, `edunudg-rbac-check`
