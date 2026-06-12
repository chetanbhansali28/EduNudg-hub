# OpenSpec — EduNudg

Behavioral specifications and change workflow for EduNudg. Reference docs (RPC catalog, ERD, runbooks) remain in [`docs/`](../docs/).

## Layout

| Path | Purpose |
|------|---------|
| `specs/<capability>/spec.md` | Source of truth — what the system should do (GIVEN/WHEN/THEN) |
| `changes/` | Active proposals (proposal, design, tasks, delta specs) |
| `changes/archive/` | Completed changes (audit history) |

## Workflow

1. **Propose** — `/opsx:propose "your idea"` in Cursor (or `openspec new change <name>`)
2. **Implement** — `/opsx:apply` with `edunudg-*` skills
3. **Archive** — `/opsx:archive` merges deltas into `specs/`

## CLI

```bash
pnpm openspec:update          # refresh Cursor slash commands
pnpm exec openspec list       # active changes
pnpm exec openspec validate --all --strict
pnpm exec openspec archive <change> -y
```

Requires **Node.js ≥ 20.19**. Opt out of telemetry: `OPENSPEC_TELEMETRY=0` or `DO_NOT_TRACK=1`.

## Capabilities (baseline)

- `platform-brand-onboarding` — EduNudg B2B brand signup and approval
- `franchise-applications` — franchise inquiry → center provisioning
- `student-leads` — brand/center lead pipeline, SLA, convert
- `center-public-profile` — franchise public profile settings and landing

See [`docs/spec/README.md`](../docs/spec/README.md) for what lives in OpenSpec vs `docs/`.
