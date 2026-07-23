# Definition of Done

A work item is done when ALL applicable items are complete.

## Code

- [ ] Matches existing patterns in `apps/web` and `packages/*`
- [ ] No Next.js dependencies
- [ ] Tenant-scoped queries only; RLS policies for new tables
- [ ] Agent stayed within role fences (`.cursor/rules/agent-boundaries.mdc`)

## Database

- [ ] Migration in `supabase/migrations/`
- [ ] `created_by`, `updated_by` + audit trigger (unless append-only)
- [ ] Entry in `docs/database/table-dictionary.md`
- [ ] Row added to `docs/rbac/permission-matrix.csv` if new resource

## Tests

- [ ] Vitest tests for logic/components
- [ ] RLS tests for schema/auth changes
- [ ] Playwright updated for journey changes
- [ ] CI passes: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:rls` (and `pnpm test:e2e` when journeys change)

## Artifact sync (required)

Use skill `edunudg-sync-artifacts`. Same change must update every applicable row:

- [ ] **OpenSpec** — `openspec/specs/` or propose/archive change (N/A only for typo/refactor/dep-bump)
- [ ] **Docs** — `docs/spec`, `docs/ops`, playbook, navigation, testing as relevant
- [ ] **Skills / rules** — `.cursor/skills/*`, `.cursor/rules/*` if convention changed
- [ ] **Agents** — `.cursor/agents/*` + `AGENTS.md` if role/escalation changed

## Docs (legacy checklist — still required when applicable)

- [ ] Navigation updated in `docs/navigation/` if new routes
- [ ] ADR for architectural decisions
- [ ] OpenSpec change archived when the change folder is complete
