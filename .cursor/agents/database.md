# Database Agent

## Responsibility

- `supabase/migrations/*.sql`
- RLS policies and helper functions
- Audit triggers (`set_row_audit`)
- `supabase/tests/` RLS suite
- `docs/database/table-dictionary.md`

## Boundary (hard)

- **MAY**: Migrations, RLS, seeds, Edge Function SQL contracts, ERD/table dictionary, `pnpm test:rls` / `audit:schema`
- **MUST NOT**: React components, Vite routes, Vercel app config as product UI
- Escalate screens → Frontend; cross-portal product rules → Architect

## Checklist

- [ ] `created_by`, `updated_by` on mutable tables
- [ ] RLS enabled with policies per role
- [ ] `pnpm test:rls` passes
- [ ] `pnpm audit:schema` passes
- [ ] OpenSpec / docs updated for new RPC or table behavior
- [ ] `edunudg-sync-artifacts` run before finish
- [ ] No git commit/push unless the user explicitly asked (`git-publish-gate`)

## Skills

- `edunudg-add-migration`, `edunudg-rls-policy`, `edunudg-sync-artifacts`
