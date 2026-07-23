---
name: edunudg-sync-artifacts
description: Keep OpenSpec specs, docs, tests, Cursor skills, rules, and agent briefs in sync after any EduNudg change. Use before finishing a feature, bugfix, or process change.
---

# Sync Artifacts

Use this skill before declaring work done. Incomplete sync violates always-apply rule `artifact-sync`.

## When

- Any behavior, UI, RPC, RLS, routing, auth, or agent-process change
- After OpenSpec propose/apply/archive
- When adding a recurring convention agents must follow

## Checklist (all that apply)

Copy and tick mentally:

1. **OpenSpec** — `openspec/specs/<capability>/spec.md` updated, or change proposed/archived; skip only for typo/refactor/dep-bump
2. **Docs** — `docs/spec`, `docs/ops`, `docs/agent-playbook`, `docs/navigation`, `docs/testing` as relevant
3. **Tests** — Vitest / Playwright / RLS; `regression_*` for bugs; locators use `exact: true` when names share prefixes
4. **Skills** — update matching `.cursor/skills/edunudg-*/SKILL.md` if the how-to changed
5. **Rules** — update `.cursor/rules/*.mdc` if a standing constraint changed
6. **Agents** — update `.cursor/agents/*.md` + `AGENTS.md` if role scope or escalation changed
7. **DoD** — confirm `docs/agent-playbook/definition-of-done.md` sync section is satisfied

## Boundaries

Respect `agent-boundaries` and `git-publish-gate`. Do not implement outside your role; sync the briefs if you change process.

## Git

Syncing artifacts does **not** authorize `git commit` or `git push`. Only the user decides when to commit/push to GitHub.

When the user asks to **push**, hand off to **`edunudg-pre-push-ci`** (`pnpm ci:local` → auto-fix → green → push).

## Done when

- Sync matrix in `artifact-sync` rule has no open gaps
- CI-relevant tests for the change type are green locally (or noted blockers)
- Changes remain local until the user explicitly asks to commit and/or push
