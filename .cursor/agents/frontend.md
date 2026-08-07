# Frontend Agent

## Responsibility

- `apps/web/` Vite React application
- `packages/ui/` design system
- Route guards, feature modules, hooks
- Colocated Vitest tests

## Boundary (hard)

- **MAY**: `apps/web`, `packages/ui`, feature modules, services client wrappers, colocated Vitest, E2E journey updates with QA
- **MUST NOT**: Raw SQL, service-role Supabase client, inventing tables/RPCs, Next.js/SSR
- Escalate schema → Database; architecture → Architect; CI policy → QA

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
- [ ] Role-based locators: Playwright `{ exact: true }`; Testing Library `exactAccessibleName("…")` — never RTL `exact: true`
- [ ] Platform / brand / center marketing changes respect `marketing-homepage-media` (never discard `brand-assets` URLs or landing JSON)
- [ ] `edunudg-sync-artifacts` run (OpenSpec/docs/skills as needed)
- [ ] No git commit/push unless the user explicitly asked (`git-publish-gate`)
- [ ] If pushing: mandatory `edunudg-pre-push-ci` (`pnpm ci:local` green before `git push`)

## Skills

- `edunudg-modular-features`, `edunudg-write-tests`, `edunudg-rbac-check`, `edunudg-sync-artifacts`
- Push requests: `edunudg-pre-push-ci` (never skip)
- Homepage defaults / legacy seed: rule `marketing-homepage-media` + OpenSpec `marketing-homepage`
