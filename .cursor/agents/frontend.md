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
- [ ] Component tests added
- [ ] E2E updated for user journeys when UI flow changes
