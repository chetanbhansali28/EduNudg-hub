# Supabase Cloud Setup (no Docker)

EduNudg uses **hosted Supabase** for Postgres, Auth, RLS, and Storage. You do **not** need Docker, Kubernetes, or `supabase start`.

## 1. Create / use a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a project (or use an existing one)
3. Wait until the database is ready

## 2. Apply database schema

Install the [Supabase CLI](https://supabase.com/docs/guides/cli) (CLI only — no local containers required):

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

`YOUR_PROJECT_REF` is the subdomain in your API URL, e.g. `https://abcdefgh.supabase.co` → `abcdefgh`.

Optional seed data: open **SQL Editor** in the dashboard and run:

1. [`supabase/seed/seed.sql`](../../supabase/seed/seed.sql) — brand, center, domains  
2. [`supabase/seed/test-users.sql`](../../supabase/seed/test-users.sql) — test logins (see [test-users.md](./test-users.md))

## 3. Configure the React app

```bash
cp .env.example apps/web/.env
```

Edit `apps/web/.env` from **Project Settings → API**:

| Variable | Source |
|----------|--------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | `anon` `public` key |

## 4. Auth redirect URLs (Dashboard)

In **Authentication → URL configuration**:

| Setting | Value |
|---------|--------|
| Site URL | `http://localhost:9000` |
| Redirect URLs | `http://localhost:9000/**` |

Add production URLs when you deploy.

Google / Facebook: configure under **Authentication → Providers** in the dashboard (not required for email/password).

## 5. Run the app

```bash
pnpm install
pnpm dev
```

Open http://localhost:9000/admin

## Edge Functions

Deploy `whatsapp-otp` and `passkey-verify` (no Docker):

```bash
supabase functions deploy
```

Details: [edge-functions.md](./edge-functions.md)

## Migrations (ongoing)

```bash
supabase migration new my_change
supabase db push
```

## Optional: RLS tests against cloud DB

Set your **database password** (never commit it). No `psql` required — tests run via Node (`pg`).

**Recommended** (after `supabase link` — uses IPv4 pooler from `supabase/.temp/pooler-url`):

```bash
# .env.local at repo root
SUPABASE_DB_PASSWORD=your-database-password
pnpm test:rls
```

**Or** paste the **Session pooler** URI from **Project Settings → Database** (port **5432**, host `aws-*-*.pooler.supabase.com`):

```bash
export DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
pnpm test:rls
```

Avoid `db.[ref].supabase.co` if you see `ENOTFOUND` — that direct host is often IPv6-only. If your password contains `@`, use `SUPABASE_DB_PASSWORD` instead of a raw `DATABASE_URL`.

## What we do not use locally

- `supabase start` (requires Docker)
- `supabase db reset` against a local container
- `127.0.0.1:54321` / `54322` URLs

`supabase/config.toml` in this repo is kept for CLI metadata and optional linked-project settings only.
