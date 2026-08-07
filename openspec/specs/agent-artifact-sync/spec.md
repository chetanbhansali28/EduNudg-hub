# Agent Artifact Sync

EduNudg agents SHALL keep behavioral specs, documentation, tests, Cursor skills/rules, and agent briefs aligned whenever they change product or process behavior.

## Requirements

### Requirement: Sync surface is mandatory for non-trivial changes

When an agent or human changes behavior, UX, schema, RPC/RLS, routing, auth, CI, or agent process, they SHALL update every applicable artifact in the sync matrix in the same change.

#### Scenario: Behavior change updates OpenSpec and tests

- **GIVEN** a change that alters expected system behavior
- **WHEN** the change is marked done
- **THEN** `openspec/specs/` (or an archived change delta) reflects the new GIVEN/WHEN/THEN
- **AND** automated tests cover the behavior (including `regression_*` for bugfixes)

#### Scenario: Process change updates skills and agent briefs

- **GIVEN** a change to how agents must work (conventions, locators, boundaries)
- **WHEN** the change is marked done
- **THEN** the relevant `.cursor/skills/*/SKILL.md` and/or `.cursor/rules/*.mdc` are updated
- **AND** `.cursor/agents/*.md` and `AGENTS.md` are updated if role scope changed

#### Scenario: Trivial exempt change

- **GIVEN** a typo-only, pure refactor with zero behavior change, or dependency-bump-only change
- **WHEN** the change is marked done
- **THEN** OpenSpec updates MAY be skipped
- **AND** the exemption is noted in the PR or commit message

### Requirement: Agent role boundaries are enforced

Agents SHALL NOT cross hard role fences defined in `.cursor/rules/agent-boundaries.mdc` and `.cursor/agents/*`. Cross-cutting work SHALL escalate per `AGENTS.md`.

#### Scenario: Frontend does not invent schema

- **GIVEN** a UI feature needing a new table or RPC
- **WHEN** Frontend implements the screen
- **THEN** Database agent (or migration skill) owns the schema/RLS
- **AND** Frontend consumes typed client/RPC only after migrations exist

### Requirement: Sync is proactive (no permission ask)

Agents SHALL update applicable sync-matrix artifacts in the same turn as the code change. Agents SHALL NOT ask the user whether to update specs, docs, tests, skills, rules, or agents, and SHALL NOT leave sync as an optional follow-up.

#### Scenario: Agent does not offer optional docs

- **GIVEN** a behavior change is implemented
- **WHEN** the agent finishes the turn
- **THEN** OpenSpec/docs/tests (as applicable) are already updated
- **AND** the agent does not ask “want me to update the docs?”

### Requirement: Sync skill is used before finish

Agents SHALL run the `edunudg-sync-artifacts` checklist before declaring a work item done.

#### Scenario: Finish gate

- **GIVEN** implementation appears complete
- **WHEN** the agent prepares the final response or PR
- **THEN** the sync checklist has been applied
- **AND** Definition of Done sync section is satisfied

### Requirement: GitHub publish requires explicit user request

Agents SHALL NOT run `git push` or otherwise publish to GitHub unless the user explicitly asks. Agents SHALL NOT `git commit` unless the user explicitly asks to commit. Completing sync or fixing CI does not grant publish permission.

#### Scenario: Local finish without push

- **GIVEN** a change is complete locally and artifacts are synced
- **WHEN** the user has not asked to commit or push
- **THEN** the agent leaves changes local only
- **AND** informs the user that commit/push awaits their explicit request

### Requirement: Push runs local CI with auto-fix before publish

When the user explicitly asks to push to GitHub, the agent SHALL run `pnpm ci:local` (mirror of GitHub Actions CI), automatically fix failures, re-run until green, and only then push. The agent SHALL NOT push while local CI is failing. The repository git `pre-push` hook SHALL also run `pnpm ci:local` (or accept a recent green stamp for the same HEAD) before allowing the push.

#### Scenario: Push request with failing typecheck

- **GIVEN** the user asked to push
- **AND** `pnpm ci:local` fails at typecheck
- **WHEN** the agent responds
- **THEN** the agent fixes the type errors (and syncs artifacts if needed)
- **AND** re-runs local CI until it passes
- **AND** pushes only after `pnpm ci:local` succeeds

#### Scenario: Git hook blocks push without local CI

- **GIVEN** a developer or agent runs `git push`
- **AND** there is no recent green `ci:local` stamp for the current HEAD
- **WHEN** the pre-push hook runs
- **THEN** `pnpm ci:local` executes
- **AND** the push is aborted if local CI fails

#### Scenario: Hard blocker

- **GIVEN** the user asked to push
- **AND** a failure cannot be fixed without secrets or a human product decision
- **WHEN** the agent cannot make CI green
- **THEN** the agent does not push
- **AND** reports the blocker and attempted fixes
