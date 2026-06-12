# Definition of Done

A work item is done when ALL apply:

## Code

- [ ] Matches existing patterns in `apps/web` and `packages/*`
- [ ] No Next.js dependencies
- [ ] Tenant-scoped queries only; RLS policies for new tables

## Database

- [ ] Migration in `supabase/migrations/`
- [ ] `created_by`, `updated_by` + audit trigger (unless append-only)
- [ ] Entry in `docs/database/table-dictionary.md`
- [ ] Row added to `docs/rbac/permission-matrix.csv` if new resource

## Tests

- [ ] Vitest tests for logic/components
- [ ] RLS tests for schema/auth changes
- [ ] Playwright updated for journey changes
- [ ] CI passes: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:rls`

## Docs

- [ ] Navigation updated in `docs/navigation/` if new routes
- [ ] ADR for architectural decisions
- [ ] OpenSpec change archived (or N/A for trivial fixes); `openspec/specs/` updated if behavior changed
