# EduNudg Agent Playbook

Instructions for humans and AI agents working on EduNudg.

## Read first

1. [Definition of Done](./definition-of-done.md)
2. [Forbidden Patterns](./forbidden-patterns.md)
3. [Modular architecture](./modular-architecture.md) — theme, services, flags, one-feature-per-folder
4. [AGENTS.md](../../AGENTS.md) at repo root
5. [Spec index](../spec/README.md) — franchise/student journey FRs

## Frontend docs

- [Marketing landing pages](../frontend/marketing-landing.md) — platform / brand / center public `/` theme
- [Abacus Classic theme](../frontend/abacus-classic.md) — brand marketing theme variant
- [UI shell standards](../spec/ui-shell-standards.md) — backend KPI grid, forms, accessibility

## Operations

- [Runbook](../ops/runbook.md) — local URLs (port 9000)
- [Platform admin portal handoff](../ops/platform-admin-portal-handoff.md) — cross-host support login
- [Test users](../ops/test-users.md) — seeded accounts and troubleshooting

## Project stack

- **Frontend**: Vite + React + React Router (SPA)
- **Backend**: Supabase (Postgres, Auth, RLS, Storage, Edge Functions)
- **Deploy**: Vercel (static SPA + rewrites)
- **Local dev**: http://localhost:9000 (`pnpm dev`, port fixed via `--strictPort`)

## Skills (`.cursor/skills/`)

Use the skill matching your task before writing code.

## Phases

- **MVP (Phase 1)**: Platform, Brand, Center portals (Tiers 1–3)
- **Later**: Student quest portal, Parent cognitive radar, full AI copilot
