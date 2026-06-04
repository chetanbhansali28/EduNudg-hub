# EduNudg — Agent Orchestration

Read this file before any implementation work. EduNudg is a **TypeScript + React (Vite SPA) + Supabase** multi-tenant franchise learning OS. **Next.js is forbidden.**

## Mandatory read order

1. [`docs/agent-playbook/README.md`](docs/agent-playbook/README.md)
2. [`docs/agent-playbook/definition-of-done.md`](docs/agent-playbook/definition-of-done.md)
3. [`docs/agent-playbook/forbidden-patterns.md`](docs/agent-playbook/forbidden-patterns.md)
4. Relevant `.cursor/rules/*.mdc` (always apply)
5. Task-specific `.cursor/skills/*/SKILL.md`
6. [`docs/agent-playbook/modular-architecture.md`](docs/agent-playbook/modular-architecture.md) — theme, services, feature modules, flags
7. Journey specs: [`docs/spec/README.md`](docs/spec/README.md)

## Agent roles

| Agent | Brief | Scope |
|-------|-------|-------|
| [Architect](.cursor/agents/architect.md) | ADRs, tenant boundaries, package structure | No UI code |
| [Database](.cursor/agents/database.md) | Migrations, RLS, audit triggers | Must run `supabase/tests` |
| [Frontend](.cursor/agents/frontend.md) | React components, routes, hooks | Typed Supabase client only |
| [QA](.cursor/agents/qa.md) | Vitest, Playwright, RLS tests | Blocks merge without tests |

## Escalation

1. Schema change → Database agent + `edunudg-add-migration` skill
2. New screen → Frontend + `edunudg-rbac-check` skill
3. Auth change → `edunudg-auth-provider` skill
4. Any feature → `edunudg-write-tests` skill (required)
5. New screen / integration / payment → `edunudg-modular-features` skill (required)
5. New screen / integration / payment flow → `edunudg-modular-features` skill (required)

## Local dev

- `pnpm dev` serves the SPA at **http://localhost:9000** (port 9000 is fixed; do not use 5173).
- Database/auth: **Supabase Cloud** via `apps/web/.env` — no Docker, no `supabase start`. See `docs/ops/supabase-cloud-setup.md`.

## Vibe-coding anti-patterns

- Inventing tables not in [`docs/database/erd.mmd`](docs/database/erd.mmd)
- Skipping tests or RLS policies
- Adding Next.js, Remix, or server components
- Using service role key in browser bundle
- Queries without `brand_id` / `center_id` scope
