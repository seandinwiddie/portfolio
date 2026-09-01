#!/usr/bin/env bash
# Launch the isolated Windows Chrome boundary consumed by Browser Harness.
# Keep this process open, then run `yarn browser:playtest` separately.
set -euo pipefail
cd "$(dirname "$0")/../.."

command -v node.exe >/dev/null || {
  printf 'browser-harness-chrome: Windows node.exe is required.\n' >&2
  exit 2
}

exec node.exe scripts/dev/browser-harness-chrome.mjs \
  browser-playtests/.runtime/browser-harness-cdp.txt
