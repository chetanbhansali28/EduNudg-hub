---
name: edunudg-pre-push-ci
description: >-
  REQUIRED before every git push. Run the full local CI mirror (pnpm ci:local),
  auto-fix failures, re-run until green, then push only if the user explicitly
  asked. Use whenever the user requests push, commit-and-push, or publish to
  GitHub. Cursor gate-git-push denies push without a green stamp; .githooks/pre-push
  is the backup enforcer.
---

# Pre-push local CI (mandatory)

Triggered when the user **explicitly** asks to push / commit-and-push / publish to GitHub.

**Non-negotiable:** never call `git push` until `pnpm ci:local` has exited 0 for the **current HEAD**. Cursor **`.cursor/hooks/gate-git-push.sh`** **denies** push without a recent green stamp. Git **`.githooks/pre-push`** is the backup mechanical gate.

## Order (mandatory — do not reorder or skip)

1. Ensure working tree matches what the user wants published.
2. **Commit first** only if the user also asked to commit (commit changes HEAD and invalidates any prior stamp).
3. Run **`pnpm ci:local` as its own shell command** (not chained after `git push`).
   - Mirrors `.github/workflows/ci.yml`: install → audit:schema → build → typecheck → test → test:rls → playwright chromium → test:e2e.
   - On success, writes `.git/edunudg-ci-local.ok` so Cursor + git hooks accept push for ~30 minutes on the same HEAD.
4. On **any** failure:
   - Diagnose the failing step
   - **Automatically fix** the code/tests/config (do not ask whether to fix)
   - Re-run `edunudg-sync-artifacts` if behavior/docs/skills changed while fixing
   - Re-run **`pnpm ci:local`** until green **or** blocked (missing secrets, needs human decision)
5. Only after exit 0: `git push` (only the refs the user asked for).
6. If blocked, **do not push**; report the blocker and what was tried.

## Hard rules

- **Never** run `git push` as the first step of a push request.
- **Never** `git commit && git push` (or any chain) without a successful `pnpm ci:local` **after** the commit and **before** the push.
- **Never** assume a prior session’s CI run still counts — stamp must match **current HEAD**.
- **Never** invent `SKIP_CI_LOCAL=1` — only if the user explicitly approved an emergency bypass in that message.
- **Ask whether to run local CI?** No — always run it.

## Flags (rare)

- `--skip-rls` only if RLS cannot run (no DB password) **and** the user accepts that risk in the same message; still say so clearly.
- `--skip-e2e` only if the user explicitly allows skipping e2e in that message.
- `SKIP_CI_LOCAL=1` on `git push` only for user-approved emergencies (Cursor asks; hook bypasses).

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

- Rule: `git-publish-gate` (alwaysApply)
- Skill: `edunudg-sync-artifacts`
- Script: `pnpm ci:local` → `scripts/ci-local.mjs`
- Cursor gate: `.cursor/hooks.json` → `.cursor/hooks/gate-git-push.sh` (**deny** without stamp; **ask** for `SKIP_CI_LOCAL=1`)
- Git hook: `.githooks/pre-push` (install: `pnpm hooks:install` / `prepare`)
