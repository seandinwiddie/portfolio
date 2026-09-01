#!/usr/bin/env bash
# Bind Browser Harness to the exact isolated Chrome launched by the companion
# command. Python statements arrive through the ordinary harness heredoc API.
set -euo pipefail
cd "$(dirname "$0")/../.."

ENDPOINT_FILE='browser-playtests/.runtime/browser-harness-cdp.txt'
[[ -f "$ENDPOINT_FILE" ]] || {
  printf 'browser-harness-playtest: run yarn browser:playtest:chrome first.\n' >&2
  exit 2
}
mapfile -t ENDPOINT_FACTS < "$ENDPOINT_FILE"
CDP_ENDPOINT="${ENDPOINT_FACTS[0]:-}"
PLAYTEST_RUN_ID="${ENDPOINT_FACTS[1]:-}"
[[ "$CDP_ENDPOINT" =~ ^http://127\.0\.0\.1:[1-9][0-9]{0,4}$ ]] || {
  printf 'browser-harness-playtest: invalid isolated CDP endpoint.\n' >&2
  exit 2
}
[[ "$PLAYTEST_RUN_ID" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] || {
  printf 'browser-harness-playtest: invalid playtest run identity.\n' >&2
  exit 2
}
command -v node.exe >/dev/null || {
  printf 'browser-harness-playtest: Windows node.exe is required.\n' >&2
  exit 2
}
command -v browser-harness.exe >/dev/null || {
  printf 'browser-harness-playtest: Browser Harness is not installed.\n' >&2
  exit 2
}
node.exe -e \
  "fetch(process.argv[1], { signal: AbortSignal.timeout(2000) }).then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))" \
  "$CDP_ENDPOINT/json/version" </dev/null || {
  printf 'browser-harness-playtest: isolated Chrome endpoint is not reachable.\n' >&2
  exit 1
}

export BU_CDP_URL="$CDP_ENDPOINT"
export BH_HOME
BH_HOME="$(wslpath -w "$PWD/browser-playtests/harness-runs/$PLAYTEST_RUN_ID")"
export BH_RECORD=1
export PORTFOLIO_BROWSER_PLAYTEST_RUN_ID="$PLAYTEST_RUN_ID"
export WSLENV="${WSLENV:+$WSLENV:}BU_CDP_URL:BH_HOME:BH_RECORD:PORTFOLIO_BROWSER_PLAYTEST_RUN_ID"
exec browser-harness.exe "$@"
