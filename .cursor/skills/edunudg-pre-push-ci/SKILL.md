---
name: edunudg-pre-push-ci
description: Before git push, run the full local CI mirror (pnpm ci:local), auto-fix failures, re-run until green, then push only if the user explicitly asked. Use whenever the user requests push, commit-and-push, or publish to GitHub.
---

# Pre-push local CI

Triggered when the user **explicitly** asks to push / commit-and-push / publish to GitHub. Combines with `git-publish-gate`.

## Order (mandatory)

1. Ensure working tree is what the user wants published (commit first **only if** they also asked to commit).
2. Run **`pnpm ci:local`** (mirrors `.github/workflows/ci.yml`: install → audit:schema → build → typecheck → test → test:rls → playwright chromium → test:e2e).
3. On **any** failure:
   - Diagnose the failing step
   - **Automatically fix** the code/tests/config
   - Re-run `edunudg-sync-artifacts` if behavior/docs/skills changed while fixing
   - Re-run **`pnpm ci:local`** (or at least the failed step, then a full `ci:local` before push)
   - Repeat until green **or** blocked (missing secrets, needs human decision)
4. Push **only after** `pnpm ci:local` exits 0.
5. If blocked, **do not push**; report the blocker and what was tried.

## Flags (rare)

- `--skip-rls` only if RLS cannot run (no DB password) **and** the user accepts that risk in the same message; still say so clearly.
- `--skip-e2e` only if the user explicitly allows skipping e2e in that message.

Default: run the full suite (no skips).

## Auto-fix expectations

| Failure | Typical fix |
|---------|-------------|
| typecheck / TS | Fix types, package exports, tsconfig paths |
| unit tests | Fix code or update tests; add `regression_*` for bugs |
| e2e | Fix locators (`exact: true`), UI, or app bugs |
| audit:schema | Align migrations / dictionary |
| test:rls | Fix policies or document missing `DATABASE_URL` / `SUPABASE_DB_PASSWORD` |

Do not “fix” by deleting tests or weakening assertions unless the user asks.

## Related

- Rule: `git-publish-gate`
- Skill: `edunudg-sync-artifacts`
- Script: `pnpm ci:local` → `scripts/ci-local.mjs`
