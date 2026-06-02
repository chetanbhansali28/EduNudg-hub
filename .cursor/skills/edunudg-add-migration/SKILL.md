---
name: edunudg-add-migration
description: Add or change Supabase database schema for EduNudg. Use when creating tables, columns, indexes, or enums.
---

# Add Migration

## Steps

1. Read `supabase/migrations/000_audit_standard.sql` for audit helpers.
2. Create `supabase/migrations/NNN_short_name.sql`.
3. Include `brand_id` / `center_id` per tenant scope.
4. Add `created_by`, `updated_by`, trigger `set_row_audit()` for mutable tables.
5. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + policies using `is_platform_admin()`, `has_brand_access()`, `has_center_access()`.
6. Update `docs/database/table-dictionary.md`.
7. Add RLS test in `supabase/tests/`.
8. Run `supabase db push` against linked Supabase Cloud project (no Docker).

## Forbidden

- Tables without RLS
- Mutable tables without audit columns
