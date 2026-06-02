---
name: edunudg-rls-policy
description: Write or review Supabase RLS policies for EduNudg multi-tenant tables.
---

# RLS Policy

## Helpers (use these)

- `public.is_platform_admin()`
- `public.has_brand_access(uuid)`
- `public.has_center_access(uuid)`
- `auth.uid()`

## Policy pattern

```sql
CREATE POLICY "brand_select" ON public.example
  FOR SELECT TO authenticated
  USING (public.has_brand_access(brand_id));
```

## Verify

Run `pnpm test:rls` and add case per role in `supabase/tests/rls_*.sql`.
