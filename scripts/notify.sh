#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/notify.sh "Title" "Message" ["alert"]
# Sends a macOS notification using terminal-notifier when available,
# falling back to osascript.

TITLE=${1:-"Codex: Notification"}
MESSAGE=${2:-""}
MODE=${3:-""}

ICON_PATH="${CODEX_NOTIFY_ICON:-$HOME/.local/share/codex/codex-notify.png}"
SENDER_ID="${CODEX_NOTIFY_SENDER:-com.goodhive.codex-notifier}"

if command -v terminal-notifier >/dev/null 2>&1; then
  if [[ "${MODE}" == "alert" ]]; then
    terminal-notifier -title "${TITLE}" -message "${MESSAGE}" -sender "${SENDER_ID}" -appIcon "${ICON_PATH}" -sound "Glass"
  else
    terminal-notifier -title "${TITLE}" -message "${MESSAGE}" -sender "${SENDER_ID}" -appIcon "${ICON_PATH}"
  fi
  exit 0
fi

/usr/bin/osascript -e "display notification \"${MESSAGE//\"/\\\\\\\"}\" with title \"${TITLE//\"/\\\\\\\"}\""
