#!/usr/bin/env bash
# Delegates to Node runner (no psql required). Keeps bash entry for docs/CI compatibility.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec node "$ROOT/scripts/run-rls-tests.mjs"
