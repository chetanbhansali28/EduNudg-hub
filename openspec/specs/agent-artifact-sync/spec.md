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

### Requirement: Sync skill is used before finish

Agents SHALL run the `edunudg-sync-artifacts` checklist before declaring a work item done.

#### Scenario: Finish gate

- **GIVEN** implementation appears complete
- **WHEN** the agent prepares the final response or PR
- **THEN** the sync checklist has been applied
- **AND** Definition of Done sync section is satisfied
