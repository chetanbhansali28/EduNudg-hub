# EduNudg

Premium enterprise multi-tenant franchise learning operating system.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React 19 + React Router (SPA — **no Next.js**) |
| Backend | Supabase (Postgres, Auth, RLS, Storage, Edge Functions) |
| Deploy | Vercel (GitHub Actions CD — see [runbook](docs/ops/runbook.md#deploy-github-actions-cd)) |

## Monorepo

| Path | Purpose |
|------|---------|
| `apps/web` | Main SPA (platform, brand, center portals) |
| `packages/ui` | Design system |
| `packages/tenant` | Host → tenant resolution |
| `packages/permissions` | RBAC helpers |
| `packages/database` | Supabase client factory |
| `supabase/` | Migrations, seed, RLS tests, Edge Functions |

---

## Prerequisites

| Tool | Version |
|------|---------|
| [Node.js](https://nodejs.org/) | **20.x** |
| [pnpm](https://pnpm.io/) | **9.x** — `corepack enable && corepack prepare pnpm@9.15.0 --activate` |

The shared Supabase project (schema, seed data, auth) is already provisioned. No Docker or local database required.

---

## Get started

### 1. Clone and install

```bash
git clone <repo-url> edunudg
cd edunudg
pnpm install
```

### 2. Local environment

Obtain `apps/web/.env` from your team’s shared secrets store. **Do not commit** this file.

If you only have the template, copy it and ask a teammate for the values:

```bash
cp apps/web/.env.example apps/web/.env
```

Restart the dev server after any `.env` change.

### 3. Run the app

```bash
pnpm dev
```

Open **http://localhost:9000** — dev server is fixed on port **9000**.

Platform work (marketing site, admin, login) runs on `localhost` out of the box. Brand and center portals use host-based routing; see the [ops runbook](docs/ops/runbook.md) when you need those surfaces locally.

---

## Local URLs (platform)

| URL | Portal |
|-----|--------|
| http://localhost:9000/ | Marketing homepage |
| http://localhost:9000/login | Staff login |
| http://localhost:9000/admin | Platform app |

Test accounts and brand/center URLs: [docs/ops/test-users.md](docs/ops/test-users.md) · [docs/ops/runbook.md](docs/ops/runbook.md)

---

## Commands

```bash
pnpm dev          # Dev server → http://localhost:9000
pnpm build        # Production build
pnpm typecheck    # TypeScript (all packages)
pnpm test         # Vitest unit/component tests
pnpm test:e2e     # Playwright (run pnpm build first)
```

When you change the database schema:

```bash
pnpm db:push      # Apply new migrations to the linked Supabase project
pnpm test:rls     # RLS SQL tests — see ops runbook for local setup
```

Deploy Edge Functions (WhatsApp OTP, passkeys):

```bash
pnpm functions:deploy
```

---

## Architecture notes

- **No Docker** — the SPA talks to hosted Supabase; RLS enforces tenant boundaries.
- **No Next.js** — Vite SPA only; server logic lives in Supabase (RLS, triggers, Edge Functions).

---

## Docs

| Topic | Link |
|-------|------|
| Test users & portal URLs | [docs/ops/test-users.md](docs/ops/test-users.md) |
| Ops runbook | [docs/ops/runbook.md](docs/ops/runbook.md) |
| Greenfield Supabase setup | [docs/ops/supabase-cloud-setup.md](docs/ops/supabase-cloud-setup.md) |
| Agent / AI guidelines | [AGENTS.md](AGENTS.md) |
| Definition of done | [docs/agent-playbook/definition-of-done.md](docs/agent-playbook/definition-of-done.md) |

## Auth

Google, Facebook (OAuth), WhatsApp OTP (Edge Function), passkeys (WebAuthn stub), email/password for staff.

## License

Proprietary — EduNudg
