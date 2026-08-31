#!/usr/bin/env bash
# Unified portfolio verification: run every architecture and product gate, then
# report the complete failure set instead of hiding later drift behind the first
# red command.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

export FP_PROJECT_ROOT="$PROJECT_ROOT"
export FP_SOURCE_ROOT="$PROJECT_ROOT/src"

echo "=== portfolio verification suite ==="

STATUS=0
FAILED_CHECKS=()

run_check() {
  local label="$1"
  shift
  echo "-> Running ${label}..."
  if "$@"; then
    echo "[pass] ${label}"
  else
    local result=$?
    echo "[fail] ${label} (exit ${result})"
    FAILED_CHECKS+=("${label}")
    STATUS=1
  fi
  echo ""
}

run_check "FP conformance checks" npm run check:fp
run_check "RTK and API-authority conformance checks" npm run check:rtk
run_check "ECS conformance checks" npm run check:ecs
run_check "feature filename contract checks" npm run check:feature-files
run_check "concern-tree fan-out checks" npm run check:fan-out
run_check "lint checks" npm run lint
run_check "TypeScript checks" npm run typecheck
run_check "unit and integration tests" npm test -- --runInBand

if (( STATUS == 0 )); then
  echo "=== All checks passed ==="
else
  echo "=== Verification completed with ${#FAILED_CHECKS[@]} failed gate(s) ==="
  for label in "${FAILED_CHECKS[@]}"; do
    echo "  - ${label}"
  done
fi

exit "$STATUS"
