# Supabase (cloud)

Schema and Edge Functions for EduNudg. **Use Supabase Cloud** — no local Docker.

| Task | Command |
|------|---------|
| Link project | `supabase link --project-ref YOUR_REF` |
| Apply migrations | `supabase db push` |
| New migration | `supabase migration new name` |
| Seed (optional) | `seed/seed.sql` then `seed/test-users.sql` in SQL Editor |
| Deploy Edge Functions | `supabase functions deploy` or `pnpm functions:deploy` |

Edge Functions guide: [docs/ops/edge-functions.md](../docs/ops/edge-functions.md)

See [docs/ops/supabase-cloud-setup.md](../docs/ops/supabase-cloud-setup.md).
