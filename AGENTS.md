# EduNudg — Agent Orchestration

Read this file before any implementation work. EduNudg is a **TypeScript + React (Vite SPA) + Supabase** multi-tenant franchise learning OS. **Next.js is forbidden.**

## Mandatory read order

1. [`docs/agent-playbook/README.md`](docs/agent-playbook/README.md)
2. [`docs/agent-playbook/definition-of-done.md`](docs/agent-playbook/definition-of-done.md)
3. [`docs/agent-playbook/forbidden-patterns.md`](docs/agent-playbook/forbidden-patterns.md)
4. Relevant `.cursor/rules/*.mdc` (always apply — especially **artifact-sync** and **agent-boundaries**)
5. Task-specific `.cursor/skills/*/SKILL.md`
6. [`docs/agent-playbook/modular-architecture.md`](docs/agent-playbook/modular-architecture.md) — theme, services, feature modules, flags
7. Journey specs: [`docs/spec/README.md`](docs/spec/README.md)
8. Behavioral specs: [`openspec/specs/`](openspec/specs/) — source of truth for what the system should do (GIVEN/WHEN/THEN)
9. New features or behavior changes: start with `/opsx:propose` before coding; archive with `/opsx:archive` when done
10. Before finish: skill **`edunudg-sync-artifacts`** (specs + docs + tests + skills + agents)

## Agent roles and hard boundaries

| Agent | Brief | MAY | MUST NOT |
|-------|-------|-----|----------|
| [Architect](.cursor/agents/architect.md) | ADRs, tenant boundaries, packages | Design, flags, services shape | UI screens, SQL migrations |
| [Database](.cursor/agents/database.md) | Migrations, RLS, audit | Schema, RLS tests, table dictionary | React UI, app routing |
| [Frontend](.cursor/agents/frontend.md) | SPA, UI package, hooks | `apps/web`, colocated Vitest | Raw SQL, service-role, inventing schema |
| [QA](.cursor/agents/qa.md) | Vitest, Playwright, RLS CI | Tests, locator/a11y rules | Product UX without Frontend; schema design |

Standing rule: [`.cursor/rules/agent-boundaries.mdc`](.cursor/rules/agent-boundaries.mdc).

## Escalation

1. Schema change → Database agent + `edunudg-add-migration` skill
2. New screen → Frontend + `edunudg-rbac-check` + `edunudg-modular-features`
3. Auth change → `edunudg-auth-provider` skill
4. Any feature / bugfix → `edunudg-write-tests` (required)
5. Before done → `edunudg-sync-artifacts` (required)
6. Process/convention change → update skills, rules, and agent briefs in the same change

## Artifact sync

Do not ship code-only changes for behavior or process. Sync matrix: [`.cursor/rules/artifact-sync.mdc`](.cursor/rules/artifact-sync.mdc). Spec: [`openspec/specs/agent-artifact-sync/spec.md`](openspec/specs/agent-artifact-sync/spec.md).

## Git publish

- **Never** `git push` (or otherwise publish to GitHub) unless the user explicitly asks in that turn.
- **Never** `git commit` unless the user explicitly asks to commit.
- When the user asks to **push**: run skill **`edunudg-pre-push-ci`** — `pnpm ci:local`, auto-fix failures, re-run until green, then push.
- Rule: [`.cursor/rules/git-publish-gate.mdc`](.cursor/rules/git-publish-gate.mdc).

## Local dev

- `pnpm dev` serves the SPA at **http://localhost:9000** (port 9000 is fixed; do not use 5173).
- Database/auth: **Supabase Cloud** via `apps/web/.env` — no Docker, no `supabase start`. See `docs/ops/supabase-cloud-setup.md`.

## Vibe-coding anti-patterns

- Inventing tables not in [`docs/database/erd.mmd`](docs/database/erd.mmd)
- Skipping tests, OpenSpec, or docs “for later”
- Crossing agent role fences without escalation
- Adding Next.js, Remix, or server components
- Using service role key in browser bundle
- Queries without `brand_id` / `center_id` scope
