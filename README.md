# EduNudg

Premium enterprise multi-tenant franchise learning operating system.

## Stack

- **Frontend**: Vite + React 19 + React Router (SPA — no Next.js)
- **Backend**: Supabase (Postgres, Auth, RLS, Storage, Edge Functions)
- **Deploy**: Vercel

## Monorepo

| Path | Purpose |
|------|---------|
| `apps/web` | Main SPA (platform, brand, center portals) |
| `packages/ui` | Design system |
| `packages/tenant` | Host → tenant resolution |
| `packages/permissions` | RBAC helpers |
| `packages/database` | Supabase client factory |
| `supabase/` | Migrations, seed, RLS tests, Edge Functions |

## Quick start (localhost + Supabase Cloud)

No Docker. The app runs on your machine; the database/auth API is your **hosted Supabase project**.

```bash
pnpm install
cp .env.example apps/web/.env   # add URL + anon key from Supabase Dashboard
supabase login && supabase link --project-ref YOUR_REF && supabase db push
pnpm dev
```

Open http://localhost:9000/admin (platform). Dev server runs on port **9000**.

Setup guide: [docs/ops/supabase-cloud-setup.md](docs/ops/supabase-cloud-setup.md) · [docs/ops/runbook.md](docs/ops/runbook.md)

## Auth

Google, Facebook (OAuth), WhatsApp OTP (Edge Function), passkeys (WebAuthn stub), email/password for staff.

## AI guardrails

See [AGENTS.md](AGENTS.md) and `.cursor/rules/`.

## License

Proprietary — EduNudg
