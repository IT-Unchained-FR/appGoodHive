#!/bin/bash
set -euo pipefail

PROXY_PORT_MAIN=5433
PROXY_PORT_RAG=5434
INSTANCE_MAIN="${CLOUD_SQL_CONNECTION_NAME:-goodhive-1706112296263:europe-west9:goodhive-prod-db}"
INSTANCE_RAG="${CLOUD_SQL_CONNECTION_NAME_RAG_CHATBOT:-$INSTANCE_MAIN}"
PROXY_BIN="./cloud_sql_proxy"

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

is_listening() {
  local port="$1"
  if has_cmd lsof; then
    lsof -iTCP:${port} -sTCP:LISTEN -P -n >/dev/null 2>&1
  else
    nc -z 127.0.0.1 "${port}" >/dev/null 2>&1
  fi
}

build_local_url() {
  local key="$1"
  local port="$2"
  python3 - <<'PY'
import os
from urllib.parse import urlparse, parse_qsl, urlencode

key = os.environ.get("ENV_KEY")
port = os.environ.get("ENV_PORT")
if not key or not port:
    raise SystemExit(1)

def load_var(target):
    for path in (".env.local", ".env"):
        if not os.path.exists(path):
            continue
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if line.startswith(target + "="):
                    _, _, value = line.partition("=")
                    return value.strip().strip("\"").strip("\'")
    return ""

url = load_var(key)
if not url:
    raise SystemExit(2)

parsed = urlparse(url)
user = parsed.username or ""
password = parsed.password or ""
creds = ""
if user:
    creds = user
    if password:
        creds += ":" + password
    creds += "@"

query = [(k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True) if k not in {"schema", "sslmode"}]
query.append(("sslmode", "disable"))
netloc = f"{creds}127.0.0.1:{port}"
rebuilt = parsed._replace(netloc=netloc, query=urlencode(query)).geturl()
print(rebuilt)
PY
}

STARTED_MAIN=0
STARTED_RAG=0

if is_listening "${PROXY_PORT_MAIN}"; then
  echo "✅ Cloud SQL proxy already listening on 127.0.0.1:${PROXY_PORT_MAIN}"
else
  echo "🚀 Starting Cloud SQL proxy (main DB)..."
  "${PROXY_BIN}" -instances="${INSTANCE_MAIN}=tcp:${PROXY_PORT_MAIN}" &
  PROXY_PID_MAIN=$!
  STARTED_MAIN=1
  echo "🔧 Main proxy PID: ${PROXY_PID_MAIN}"
fi

if is_listening "${PROXY_PORT_RAG}"; then
  echo "✅ Cloud SQL proxy already listening on 127.0.0.1:${PROXY_PORT_RAG}"
else
  echo "🚀 Starting Cloud SQL proxy (RAG DB)..."
  "${PROXY_BIN}" -instances="${INSTANCE_RAG}=tcp:${PROXY_PORT_RAG}" &
  PROXY_PID_RAG=$!
  STARTED_RAG=1
  echo "🔧 RAG proxy PID: ${PROXY_PID_RAG}"
fi

for _ in {1..30}; do
  if is_listening "${PROXY_PORT_MAIN}" && is_listening "${PROXY_PORT_RAG}"; then
    echo "✅ Proxies ready on 127.0.0.1:${PROXY_PORT_MAIN} and 127.0.0.1:${PROXY_PORT_RAG}"
    break
  fi
  sleep 0.3
  done

if ! is_listening "${PROXY_PORT_MAIN}" || ! is_listening "${PROXY_PORT_RAG}"; then
  echo "❌ Proxy failed to start."
  if [ "${STARTED_MAIN}" -eq 1 ] && [ -n "${PROXY_PID_MAIN:-}" ]; then
    kill "${PROXY_PID_MAIN}" >/dev/null 2>&1 || true
  fi
  if [ "${STARTED_RAG}" -eq 1 ] && [ -n "${PROXY_PID_RAG:-}" ]; then
    kill "${PROXY_PID_RAG}" >/dev/null 2>&1 || true
  fi
  exit 1
fi

cleanup() {
  if [ "${STARTED_MAIN}" -eq 1 ] && [ -n "${PROXY_PID_MAIN:-}" ]; then
    echo "🛑 Stopping main proxy..."
    kill "${PROXY_PID_MAIN}" >/dev/null 2>&1 || true
  fi
  if [ "${STARTED_RAG}" -eq 1 ] && [ -n "${PROXY_PID_RAG:-}" ]; then
    echo "🛑 Stopping RAG proxy..."
    kill "${PROXY_PID_RAG}" >/dev/null 2>&1 || true
  fi
}

trap cleanup INT TERM EXIT

export ENV_KEY="DATABASE_URL"
export ENV_PORT="${PROXY_PORT_MAIN}"
DATABASE_URL=$(build_local_url "${ENV_KEY}" "${ENV_PORT}") || DATABASE_URL=""

export ENV_KEY="DATABASE_URL_RAG_CHATBOT"
export ENV_PORT="${PROXY_PORT_RAG}"
DATABASE_URL_RAG_CHATBOT=$(build_local_url "${ENV_KEY}" "${ENV_PORT}") || DATABASE_URL_RAG_CHATBOT=""

if [ -z "${DATABASE_URL}" ]; then
  echo "❌ DATABASE_URL is not set in .env/.env.local"
  exit 1
fi

if [ -z "${DATABASE_URL_RAG_CHATBOT}" ]; then
  echo "⚠️ DATABASE_URL_RAG_CHATBOT not found; using DATABASE_URL for RAG chatbot"
  DATABASE_URL_RAG_CHATBOT="${DATABASE_URL}"
fi

echo "🚀 Starting Next dev server..."
DATABASE_URL="${DATABASE_URL}" DATABASE_URL_RAG_CHATBOT="${DATABASE_URL_RAG_CHATBOT}" pnpm dev
