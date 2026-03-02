#!/bin/bash
set -euo pipefail

PROXY_PORT_MAIN=5433
PROXY_PORT_RAG=5434
INSTANCE_MAIN="${CLOUD_SQL_CONNECTION_NAME:-goodhive-1706112296263:europe-west9:goodhive-prod-db}"
INSTANCE_RAG="${CLOUD_SQL_CONNECTION_NAME_RAG_CHATBOT:-$INSTANCE_MAIN}"
PROXY_BIN="./cloud_sql_proxy"
SHARE_PROXY_PORT=0

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

STARTED_PROXY=0

if [ "${INSTANCE_MAIN}" = "${INSTANCE_RAG}" ]; then
  SHARE_PROXY_PORT=1
  echo "ℹ️ Main DB and RAG DB use the same Cloud SQL instance; reusing one proxy on 127.0.0.1:${PROXY_PORT_MAIN}"
fi

PORTS_TO_CHECK=("${PROXY_PORT_MAIN}")
INSTANCES_ARG="${INSTANCE_MAIN}=tcp:${PROXY_PORT_MAIN}"

if [ "${SHARE_PROXY_PORT}" -eq 0 ]; then
  PORTS_TO_CHECK+=("${PROXY_PORT_RAG}")
  INSTANCES_ARG="${INSTANCES_ARG},${INSTANCE_RAG}=tcp:${PROXY_PORT_RAG}"
fi

all_ports_listening() {
  for port in "${PORTS_TO_CHECK[@]}"; do
    if ! is_listening "${port}"; then
      return 1
    fi
  done
  return 0
}

if all_ports_listening; then
  if [ "${SHARE_PROXY_PORT}" -eq 1 ]; then
    echo "✅ Cloud SQL proxy already listening on 127.0.0.1:${PROXY_PORT_MAIN}"
  else
    echo "✅ Cloud SQL proxy already listening on 127.0.0.1:${PROXY_PORT_MAIN} and 127.0.0.1:${PROXY_PORT_RAG}"
  fi
else
  echo "🚀 Starting Cloud SQL proxy..."
  "${PROXY_BIN}" -instances="${INSTANCES_ARG}" &
  PROXY_PID=$!
  STARTED_PROXY=1
  echo "🔧 Proxy PID: ${PROXY_PID}"
fi

for _ in {1..30}; do
  if all_ports_listening; then
    if [ "${SHARE_PROXY_PORT}" -eq 1 ]; then
      echo "✅ Proxy ready on 127.0.0.1:${PROXY_PORT_MAIN} for both main and RAG databases"
    else
      echo "✅ Proxies ready on 127.0.0.1:${PROXY_PORT_MAIN} and 127.0.0.1:${PROXY_PORT_RAG}"
    fi
    break
  fi
  sleep 0.3
done

if ! all_ports_listening; then
  echo "❌ Proxy failed to start."
  if [ "${STARTED_PROXY}" -eq 1 ] && [ -n "${PROXY_PID:-}" ]; then
    kill "${PROXY_PID}" >/dev/null 2>&1 || true
  fi
  exit 1
fi

cleanup() {
  if [ "${STARTED_PROXY}" -eq 1 ] && [ -n "${PROXY_PID:-}" ]; then
    echo "🛑 Stopping Cloud SQL proxy..."
    kill "${PROXY_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup INT TERM EXIT

export ENV_KEY="DATABASE_URL"
export ENV_PORT="${PROXY_PORT_MAIN}"
DATABASE_URL=$(build_local_url "${ENV_KEY}" "${ENV_PORT}") || DATABASE_URL=""

export ENV_KEY="DATABASE_URL_RAG_CHATBOT"
if [ "${SHARE_PROXY_PORT}" -eq 1 ]; then
  export ENV_PORT="${PROXY_PORT_MAIN}"
else
  export ENV_PORT="${PROXY_PORT_RAG}"
fi
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
