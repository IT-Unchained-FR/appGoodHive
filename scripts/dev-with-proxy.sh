#!/bin/bash
set -euo pipefail

PROXY_PORT=5433
INSTANCE="goodhive-1706112296263:europe-west9:goodhive-prod-db"
PROXY_BIN="./cloud_sql_proxy"

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

is_listening() {
  if has_cmd lsof; then
    lsof -iTCP:${PROXY_PORT} -sTCP:LISTEN -P -n >/dev/null 2>&1
  else
    nc -z 127.0.0.1 "${PROXY_PORT}" >/dev/null 2>&1
  fi
}

STARTED_PROXY=0

if is_listening; then
  echo "✅ Cloud SQL proxy already listening on 127.0.0.1:${PROXY_PORT}"
else
  echo "🚀 Starting Cloud SQL proxy..."
  "${PROXY_BIN}" -instances="${INSTANCE}=tcp:${PROXY_PORT}" &
  PROXY_PID=$!
  STARTED_PROXY=1
  echo "🔧 Proxy PID: ${PROXY_PID}"

  for _ in {1..30}; do
    if is_listening; then
      echo "✅ Proxy ready on 127.0.0.1:${PROXY_PORT}"
      break
    fi
    sleep 0.3
  done

  if ! is_listening; then
    echo "❌ Proxy failed to start."
    kill "${PROXY_PID}" >/dev/null 2>&1 || true
    exit 1
  fi
fi

cleanup() {
  if [ "${STARTED_PROXY}" -eq 1 ] && [ -n "${PROXY_PID:-}" ]; then
    echo "🛑 Stopping proxy..."
    kill "${PROXY_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup INT TERM EXIT

echo "🚀 Starting Next dev server..."
env -u DATABASE_URL pnpm dev
