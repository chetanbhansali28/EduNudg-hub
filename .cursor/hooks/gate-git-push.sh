#!/usr/bin/env bash
# Remind/block agent git push until local CI guidance is acknowledged.
# Mechanical enforcement still lives in .githooks/pre-push.
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
  printf '%s\n' '{"permission":"ask","user_message":"Push with SKIP_CI_LOCAL=1 bypasses local CI. Confirm only for emergencies.","agent_message":"SKIP_CI_LOCAL bypass requested — confirm with the user before proceeding."}'
  exit 0
fi

# Allow: the git pre-push hook runs pnpm ci:local. Agents should still prefer
# running ci:local first (writes stamp) so push is fast.
printf '%s\n' '{"permission":"allow","agent_message":"git push is gated by .githooks/pre-push (pnpm ci:local). Prefer running pnpm ci:local first (edunudg-pre-push-ci) so the stamp skips a duplicate run."}'
exit 0
