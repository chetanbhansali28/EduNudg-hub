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
| Student | `student@edunudg.com` | student (`students.user_id` linked) | http://learn.abacusworld.localhost:9000/login |

Student **learn portal** shows dashboard with curriculum ladder (3/8 levels), exams, free/paid upcoming competitions, and past results after seed + migration `048_student_learn_portal.sql`.

Student **data** (enrollment at Koramangala) is visible when logged in as **center** or **brand** under Students.

Add to `/etc/hosts` if needed:

```
127.0.0.1 abacusworld.localhost koramangala.abacusworld.localhost learn.abacusworld.localhost
```

Optional: run [`supabase/seed/seed.sql`](../../supabase/seed/seed.sql) first for subscription plans (not required for login).

## Brand login credentials (platform admin)

On **Platform → Brands**, click **Edit** (or open the brand name) to go to **brand detail** (`/admin/brands/:slug`) and set **Login email** and **Password** for the franchisor (`brand_owner`). Password is required only when creating a new login; leave it blank on edit to keep the existing password.

The brand signs in at `{slug}.localhost:9000/login` (dev) using that email and password. This provisions Supabase Auth + `memberships` via the `brand-owner-credentials` Edge Function — deploy after schema push:

```bash
pnpm dlx supabase@2.104.0 db push
pnpm dlx supabase@2.104.0 functions deploy brand-owner-credentials
```

Seeded demo brand login remains `owner@edunudg.com` / `admin` at http://abacusworld.localhost:9000/login when `test-users.sql` has been applied.

## Platform admin cross-portal handoff

As `admin@edunudg.com` on http://localhost:9000/admin/brands:

1. Click **Brand backend** on a row (or **Open** on brand detail → Domains) — should open `{slug}.localhost:9000/app` signed in as platform admin.
2. Requires Edge Function `platform-portal-handoff` deployed (see [platform-admin-portal-handoff.md](./platform-admin-portal-handoff.md)).

| Issue | Fix |
|-------|-----|
| Redirect to `localhost:3000` / connection refused | Set Supabase Site URL to `http://localhost:9000`; redeploy `platform-portal-handoff` |
| Stays on login after handoff | Check function logs; confirm `/auth/handoff?token_hash=…` URL on correct host |

## Brand marketing QA (feature phone blocks)

After editing **Brand → Marketing pages → Feature sections (phone blocks)**:

1. Remove blocks 3 & 4 (or any subset) and **Save**.
2. Open `{slug}.localhost:9000/` at desktop width (≥1024px).
3. Confirm the page loads and only your remaining blocks appear in the phone stage.

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
| Brand login not working after platform edit | Deploy `brand-owner-credentials` Edge Function; set login email + password on Brands → Edit |
| No data after login | Check `memberships.status = 'active'` |
| Brand/center portal wrong | Use subdomain hosts above; run `test-users.sql` for `domain_mappings` |
| Brand login access denied (owner) | App resolves brand via slug + `get_portal_branding`; ensure `test-users.sql` brand id matches domain slug |
| Platform admin **Open** fails | Deploy `platform-portal-handoff`; see [platform-admin-portal-handoff.md](./platform-admin-portal-handoff.md) |
