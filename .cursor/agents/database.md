# Database Agent

## Responsibility

- `supabase/migrations/*.sql`
- RLS policies and helper functions
- Audit triggers (`set_row_audit`)
- `supabase/tests/` RLS suite
- `docs/database/table-dictionary.md`

## Checklist

- [ ] `created_by`, `updated_by` on mutable tables
- [ ] RLS enabled with policies per role
- [ ] `pnpm test:rls` passes
- [ ] `pnpm audit:schema` passes
