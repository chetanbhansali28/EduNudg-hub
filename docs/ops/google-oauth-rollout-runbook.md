# Google OAuth rollout runbook

Internal guide for enabling Google sign-in per portal persona. Covers **which tables gate access**, **how to provision users**, and **test checklists**.

Related: [supabase-cloud-setup.md](./supabase-cloud-setup.md) (Supabase + Google Cloud config), [test-users.md](./test-users.md) (seed accounts), [auth-providers.md](../architecture/auth-providers.md).

---

## 1. Two-step model

| Step | Question | Tables / config |
|------|----------|-----------------|
| **Authentication** | Who is this person? | `auth.users`, `auth.identities` (Supabase Auth) |
| **Authorization** | Allowed on **this** portal host? | `memberships` (staff) or `students` / `parents` (learn/parents) |

Google completes step 1 only. Step 2 requires a row in the correct table **before or after** first Google sign-in (same email).

Login button visibility: `platform_settings` key `integrations` → `auth_google` (UI toggle at `/admin/settings`).

Portal host resolution: `domain_mappings` (+ `brands` / `franchise_centers` context).

---

## 2. Access tables by portal

| Portal | Login host (dev) | Opens | Authorization table(s) | Key condition |
|--------|------------------|-------|------------------------|---------------|
| Platform admin | `localhost:9000/login` | `/admin` | **`memberships`** | `scope_type = 'platform'`, `status = 'active'` |
| Brand staff | `{brand}.localhost:9000/login` | `/app` | **`memberships`** | `scope_type = 'brand'` + matching `brand_id`, **or** platform scope |
| Center staff | `{center}.{brand}.localhost:9000/login` | `/app` | **`memberships`** | `scope_type = 'center'` + matching `center_id`, **or** brand/platform oversight |
| Student (learn) | `learn.{brand}.localhost:9000/login` | `/` | **`students`**, **`student_enrollments`** | `students.user_id = auth.uid()`, active enrollment (RPC gate) |
| Parents | `parents.{brand}.localhost:9000/login` | `/` | **`parents`**, **`parent_student_links`** | `parents.user_id = auth.uid()` (portal future) |

**Not used for allow/deny on login:** `profiles` (display only). **After center login:** `franchise_centers.status` must be `active` (suspended center blocked).

---

## 3. Rollout phases

| Phase | Persona | Provision first? | Google on |
|-------|---------|------------------|-----------|
| **0** | Infra | Supabase + Google Cloud + `/admin/settings` toggles | — |
| **1** | Platform admin | `memberships` (platform scope) | `localhost:9000/login` |
| **2** | Brand owner/admin | Platform → Brands → login email (`brand-owner-credentials`) | `{brand}.localhost:9000/login` |
| **3** | Center owner/staff | Brand → Center → Franchise Identity (`center-owner-credentials`) | `{center}.{brand}.localhost:9000/login` |
| **4** | Platform admin cross-portal | Existing platform `memberships` or `platform-portal-handoff` | Brand/center hosts |
| **5** | Students | `invite_student_portal_access` / link `students.user_id` | Defer until invite flow tested |
| **6** | Parents | `parents.user_id` + links | Defer (portal not fully live) |

**Rule:** Google never auto-creates `memberships`. Provision the row (or use seed / Edge Function) first, then user signs in with Google using **the same email**.

---

## 4. SQL — grant platform admin after Google sign-in

Use when someone already signed in with Google once (user exists in `auth.users`) but has no access.

### 4.1 Find the auth user

Run in **Supabase SQL Editor**:

```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'nilgattani@gmail.com';
```

If no row: ask them to complete **Log in with Google** once on `http://localhost:9000/login`, then re-run.

### 4.2 Ensure profile + platform membership

Replace `USER_UUID_HERE` with the `id` from step 4.1.

```sql
-- Profile (optional but recommended)
INSERT INTO public.profiles (id, email, full_name)
VALUES (
  'USER_UUID_HERE',
  'nilgattani@gmail.com',
  'Nilesh Gattani'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
  updated_at = now();

-- Platform admin access
INSERT INTO public.memberships (
  user_id,
  scope_type,
  brand_id,
  center_id,
  role_key,
  status,
  accepted_at
)
VALUES (
  'USER_UUID_HERE',
  'platform',
  NULL,
  NULL,
  'platform_super_admin',
  'active',
  now()
);
```

For read-only ops access use `platform_ops` instead of `platform_super_admin`.

### 4.3 Verify

```sql
SELECT m.id, m.scope_type, m.role_key, m.status, u.email
FROM public.memberships m
JOIN auth.users u ON u.id = m.user_id
WHERE u.email = 'nilgattani@gmail.com';
```

Expected: one row with `scope_type = platform`, `status = active`.

---

## 5. SQL — audit queries

### Who can access the platform portal?

```sql
SELECT u.email, m.role_key, m.status, m.accepted_at
FROM public.memberships m
JOIN auth.users u ON u.id = m.user_id
WHERE m.scope_type = 'platform'
ORDER BY u.email;
```

### Who can access a specific brand?

```sql
SELECT u.email, m.scope_type, m.role_key, m.status, b.slug AS brand_slug
FROM public.memberships m
JOIN auth.users u ON u.id = m.user_id
LEFT JOIN public.brands b ON b.id = m.brand_id
WHERE m.brand_id = (SELECT id FROM public.brands WHERE slug = 'abacusworld' LIMIT 1)
   OR m.scope_type = 'platform'
ORDER BY m.scope_type, u.email;
```

### Student portal link (learn)

```sql
SELECT s.id, s.full_name, s.login_email, s.user_id, u.email AS auth_email
FROM public.students s
LEFT JOIN auth.users u ON u.id = s.user_id
WHERE s.brand_id = (SELECT id FROM public.brands WHERE slug = 'abacusworld' LIMIT 1)
  AND s.deleted_at IS NULL;
```

### Integration toggles (Google visible on login?)

```sql
SELECT value -> 'auth_google' AS auth_google,
       value -> 'auth_facebook' AS auth_facebook,
       value -> 'auth_email' AS auth_email
FROM public.platform_settings
WHERE key = 'integrations';
```

---

## 6. Provision brand / center (preferred over raw SQL)

| Persona | UI path | Edge Function | Creates |
|---------|---------|---------------|---------|
| Brand owner | Platform → **Brands** → Edit → Login email + password | `brand-owner-credentials` | `auth.users` + `memberships` (brand) |
| Center owner | Brand → **Centers** → Franchise Identity → Login email | `center-owner-credentials` | `auth.users` + `memberships` (center) |

After provisioning with email `owner@example.com`, the user may sign in with **the same email** via Google (Supabase links identity).

Deploy functions if not already:

```bash
pnpm dlx supabase functions deploy brand-owner-credentials
pnpm dlx supabase functions deploy center-owner-credentials
```

---

## 7. Test checklists

### Phase 0 — Infrastructure

- [ ] Supabase → **Providers → Google** enabled with Client ID/Secret
- [ ] Supabase → **URL configuration**: Site URL `http://localhost:9000`, Redirect URLs `http://localhost:9000/**`
- [ ] Google Cloud → redirect URI only `https://YOUR_REF.supabase.co/auth/v1/callback`
- [ ] `/admin/settings` → **Google SSO** ON → Save
- [ ] `/login` shows **Log in with Google**

### Phase 1 — Platform admin

**User:** `admin@edunudg.com` (seed) or Gmail with platform `memberships` row.

- [ ] Open `http://localhost:9000/login`
- [ ] Click **Log in with Google** → Google account picker
- [ ] Return to app with session (hash may flash briefly)
- [ ] Land on **`/admin`** (or see not-authorized message if no membership — then run §4 SQL)
- [ ] Command Center loads; no “access denied” on `/admin/settings`

**Unauthorized test:** Gmail with **no** `memberships` row → must **not** reach `/admin`; should see not-authorized messaging (after app redirect fix) or stay off admin routes.

### Phase 2 — Brand admin

**User:** `owner@edunudg.com` / seed, or brand provisioned email.

- [ ] Open `http://abacusworld.localhost:9000/login`
- [ ] Google sign-in with brand owner email
- [ ] Land on **`/app`** (brand dashboard)
- [ ] Wrong host test: same user on `localhost:9000/login` → platform membership only; without platform row → not authorized

### Phase 3 — Center staff

**User:** `center@edunudg.com` / seed, or center provisioned email.

- [ ] Open `http://koramangala.abacusworld.localhost:9000/login`
- [ ] Google sign-in
- [ ] Land on **`/app`** (center dashboard)
- [ ] Brand admin on same center host → also allowed (brand oversight)

### Phase 4 — Platform admin cross-portal

- [ ] As `admin@edunudg.com`, open `/admin/brands`
- [ ] **Brand backend** → opens `{brand}.localhost:9000/app` signed in
- [ ] Or: platform admin Google on `{brand}.localhost:9000/login` → `/app` via platform `memberships`

### Phase 5 — Student (when enabled)

- [ ] Student row has `user_id` linked for brand
- [ ] Active `student_enrollments` row
- [ ] `http://learn.abacusworld.localhost:9000/login` → dashboard data loads (RPCs succeed)

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Unsupported provider: provider is not enabled` | Google off in Supabase | Enable provider in Dashboard |
| Lands on `/` with `#access_token=...`, no admin | OAuth `redirectTo` is origin root; no membership check on `/` | Use `/login` or `/admin` manually; grant `memberships` (§4); pending app redirect fix |
| Signed in but `/admin` loops to login | No platform `memberships` | §4 SQL or seed |
| Google OK on brand host, access denied | No brand `memberships` for that `brand_id` | Brand-owner credentials on platform |
| Email/password works, Google doesn’t | Different email on Google vs provisioned login | Use same email or link identity in Supabase Auth → Users |
| `memberships.status = invited` | Not accepted | Set `status = 'active'`, `accepted_at = now()` |

---

## 9. App behavior (implemented)

| Behavior | Status |
|----------|--------|
| OAuth `redirectTo` → `/login` (keeps safe `?next=`) | Done — `buildStaffOAuthRedirectUrl` |
| Legacy OAuth hash on `/` → redirect to `/login` | Done — `OAuthReturnRedirect` |
| Unauthorized message + auto sign-out | Done — inline error on `/login` |
| `?next=` open-redirect hardening | Done — `isSafeInternalPath` rejects `//` and absolute URLs |
| Student Google on learn | Deferred — RPC gate only |

Track regressions: `regression_google_oauth_uses_login_redirect_url`, `regression_oauth_hash_on_homepage_redirects_to_login`.

---

## 10. Quick reference

```
Authentication  → auth.users (+ auth.identities for Google link)
Staff access    → memberships (user_id + scope_type + brand_id/center_id + status=active)
Student access  → students.user_id + student_enrollments (RPC)
Parent access   → parents.user_id + parent_student_links
Which portal?   → domain_mappings.hostname
Show Google?    → platform_settings.integrations.auth_google
```
