#!/usr/bin/env bash
# Cursor beforeShellExecution gate for `git push`.
# Denies push unless a recent green `pnpm ci:local` stamp exists for HEAD
# (agents must run edunudg-pre-push-ci first). Git `.githooks/pre-push` remains
# the final mechanical backup if this gate is bypassed.
set -euo pipefail

input="$(cat)"
command="$(printf '%s' "$input" | node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d));
  process.stdin.on("end", () => {
    try {
      const j = JSON.parse(s);
      process.stdout.write(String(j.command ?? ""));
    } catch {
      process.stdout.write("");
    }
  });
')"

# Allow non-push commands that somehow matched (defensive).
if ! [[ "$command" =~ git[[:space:]]+push ]]; then
  printf '%s\n' '{"permission":"allow"}'
  exit 0
fi

if [[ "$command" =~ SKIP_CI_LOCAL=1 ]]; then
  printf '%s\n' '{"permission":"ask","user_message":"Push with SKIP_CI_LOCAL=1 bypasses local CI. Confirm only for emergencies.","agent_message":"SKIP_CI_LOCAL bypass requested — confirm with the user before proceeding. Never invent this flag."}'
  exit 0
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$ROOT" ]]; then
  printf '%s\n' '{"permission":"deny","agent_message":"Cannot resolve git root. Run from the EduNudg-hub repo, then pnpm ci:local (edunudg-pre-push-ci) before git push."}'
  exit 0
fi

HEAD="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || true)"
STAMP="${ROOT}/.git/edunudg-ci-local.ok"
MAX_AGE_SEC="${CI_LOCAL_STAMP_MAX_AGE_SEC:-1800}"

has_valid_stamp=0
if [[ -n "$HEAD" && -f "$STAMP" ]]; then
  read -r stamp_sha stamp_ts <"$STAMP" || true
  now="$(date +%s)"
  if [[ -n "${stamp_sha:-}" && -n "${stamp_ts:-}" && "$stamp_sha" == "$HEAD" ]]; then
    age=$((now - stamp_ts))
    if (( age >= 0 && age < MAX_AGE_SEC )); then
      has_valid_stamp=1
    fi
  fi
fi

if (( has_valid_stamp == 1 )); then
  printf '%s\n' "{\"permission\":\"allow\",\"agent_message\":\"Green ci:local stamp found for ${HEAD:0:7}. Proceeding with git push (.githooks/pre-push remains backup).\"}"
  exit 0
fi

printf '%s\n' '{"permission":"deny","agent_message":"BLOCKED: no recent green pnpm ci:local stamp for current HEAD. Mandatory sequence (edunudg-pre-push-ci): (1) commit if the user asked, (2) run pnpm ci:local as its own shell command, (3) auto-fix failures and re-run until exit 0, (4) only then retry git push. Do not combine commit&&push without ci:local in between. Do not use SKIP_CI_LOCAL=1 unless the user explicitly approved an emergency bypass."}'
exit 0
