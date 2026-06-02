# Test users

## Quick steps

1. Apply schema: `supabase db push`
2. Run [`supabase/seed/test-users.sql`](../../supabase/seed/test-users.sql) in **SQL Editor** (brand, center, domains, auth users)
3. Copy [`apps/web/.env.example`](../../apps/web/.env.example) → `apps/web/.env` with your Supabase **Project URL** and **anon** key
4. `pnpm dev` → open **http://localhost:9000/login** and sign in

**Password for all seeded accounts:** `admin`

## Accounts

| Persona | Email | Role | Where to log in |
|---------|-------|------|-----------------|
| Platform admin | `admin@edunudg.com` | `platform_super_admin` | http://localhost:9000/login → redirects to `/admin` |
| Franchisor (brand) | `owner@edunudg.com` | `brand_owner` | http://abacusworld.localhost:9000/login |
| Franchise (center) | `center@edunudg.com` | `center_owner` | http://koramangala.abacusworld.localhost:9000/login |
| Student | `student@edunudg.com` | *(auth only)* | Learn portal UI is Phase 2 |

Student **data** (enrollment at Koramangala) is visible when logged in as **center** or **brand** under Students.

Add to `/etc/hosts` if needed:

```
127.0.0.1 abacusworld.localhost koramangala.abacusworld.localhost
```

Optional: run [`supabase/seed/seed.sql`](../../supabase/seed/seed.sql) first for subscription plans (not required for login).

## Alternative: Dashboard + SQL (no auth insert)

If `test-users.sql` fails on `auth.users` (schema drift):

1. **Authentication → Users → Add user** — create each email with password `admin`
2. Copy each user's UUID from the dashboard
3. Run only the `profiles` + `memberships` sections from `test-users.sql`, replacing UUIDs

Or use CLI:

```bash
supabase auth admin create-user --email admin@edunudg.com --password 'admin' --email-confirm
```

Then insert memberships with the returned user id.

## Remove test users

```sql
DELETE FROM public.student_enrollments WHERE student_id = 'e0000000-0000-4000-8000-000000000001';
DELETE FROM public.students WHERE id = 'e0000000-0000-4000-8000-000000000001';
DELETE FROM public.memberships WHERE user_id::text LIKE 'f0000000-0000-4000-8000-%';
DELETE FROM public.profiles WHERE id::text LIKE 'f0000000-0000-4000-8000-%';
DELETE FROM auth.identities WHERE user_id::text LIKE 'f0000000-0000-4000-8000-%';
DELETE FROM auth.users WHERE email LIKE '%@edunudg.com';
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Sign in succeeds but page stays on `/login` | Fixed in app: redirects to `/admin` (platform) or `/` (brand/center). Restart `pnpm dev`. |
| `ERR_NAME_NOT_RESOLVED` / `your_project_ref.supabase.co` | Set real `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `apps/web/.env`, restart dev server |
| Login "Invalid credentials" | Re-run `test-users.sql` or reset password in Dashboard; use `admin@edunudg.com` / `admin` |
| No data after login | Check `memberships.status = 'active'` |
| Brand/center portal wrong | Use subdomain hosts above; run `test-users.sql` for `domain_mappings` |
