#!/bin/bash
set -euo pipefail

PROXY_PORT_MAIN=5433
PROXY_PORT_RAG=5434
INSTANCE_MAIN="${CLOUD_SQL_CONNECTION_NAME:-goodhive-1706112296263:europe-west9:goodhive-prod-db}"
INSTANCE_RAG="${CLOUD_SQL_CONNECTION_NAME_RAG_CHATBOT:-$INSTANCE_MAIN}"
PROXY_BIN="./cloud_sql_proxy"
SHARE_PROXY_PORT=0
PROXY_START_TIMEOUT_SECONDS="${PROXY_START_TIMEOUT_SECONDS:-30}"
DEFAULT_APP_PORT="${PORT:-3000}"
DEFAULT_CREDENTIAL_FILE="./github-actions-key.json"

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

find_listener() {
  local port="$1"
  if has_cmd lsof; then
    lsof -nP -iTCP:${port} -sTCP:LISTEN | tail -n +2 | head -n 1
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

can_connect_postgres() {
  local url="$1"
  if [ -z "${url}" ]; then
    return 1
  fi

  if has_cmd psql; then
    PGCONNECT_TIMEOUT=5 psql "${url}" -Atqc "select 1" >/dev/null 2>&1
  elif has_cmd pg_isready; then
    PGCONNECT_TIMEOUT=5 pg_isready -d "${url}" >/dev/null 2>&1
  else
    return 0
  fi
}

find_available_port() {
  local start_port="$1"
  local max_port="${2:-3010}"
  local port="${start_port}"

  while [ "${port}" -le "${max_port}" ]; do
    if ! is_listening "${port}"; then
      echo "${port}"
      return 0
    fi
    port=$((port + 1))
  done

  return 1
}

copy_dir_contents() {
  local src="$1"
  local dest="$2"

  mkdir -p "${dest}"

  if has_cmd rsync; then
    rsync -a --delete "${src}/" "${dest}/"
  else
    rm -rf "${dest}"
    mkdir -p "${dest}"
    cp -R "${src}/." "${dest}/"
  fi
}

resolve_proxy_credential_file() {
  local credential_file="${CLOUD_SQL_PROXY_CREDENTIAL_FILE:-${GOOGLE_APPLICATION_CREDENTIALS:-}}"

  if [ -z "${credential_file}" ] && [ -f "${DEFAULT_CREDENTIAL_FILE}" ]; then
    credential_file="${DEFAULT_CREDENTIAL_FILE}"
  fi

  if [ -n "${credential_file}" ]; then
    if [ ! -f "${credential_file}" ]; then
      echo "❌ Cloud SQL credential file not found: ${credential_file}" >&2
      exit 1
    fi
    export GOOGLE_APPLICATION_CREDENTIALS="${credential_file}"
    echo "🔐 Using service-account credentials from ${credential_file}" >&2
    printf '%s' "${credential_file}"
    return 0
  fi

  echo "ℹ️ No explicit Cloud SQL credential file found; falling back to gcloud/ADC auth" >&2
  printf '%s' ""
}

STARTED_PROXY=0
PROXY_CREDENTIAL_FILE="$(resolve_proxy_credential_file)"

if [ "${INSTANCE_MAIN}" = "${INSTANCE_RAG}" ]; then
  SHARE_PROXY_PORT=1
  echo "ℹ️ Main DB and RAG DB use the same Cloud SQL instance; reusing one proxy on 127.0.0.1:${PROXY_PORT_MAIN}"
fi

export ENV_KEY="DATABASE_URL"
export ENV_PORT="${PROXY_PORT_MAIN}"
DATABASE_URL=$(build_local_url "${ENV_KEY}" "${ENV_PORT}") || DATABASE_URL=""

PORTS_TO_CHECK=("${PROXY_PORT_MAIN}")
DB_URLS_TO_CHECK=("${DATABASE_URL}")
INSTANCES_ARG="${INSTANCE_MAIN}=tcp:${PROXY_PORT_MAIN}"

if [ "${SHARE_PROXY_PORT}" -eq 0 ]; then
  PORTS_TO_CHECK+=("${PROXY_PORT_RAG}")
  INSTANCES_ARG="${INSTANCES_ARG},${INSTANCE_RAG}=tcp:${PROXY_PORT_RAG}"
fi

export ENV_KEY="DATABASE_URL_RAG_CHATBOT"
if [ "${SHARE_PROXY_PORT}" -eq 1 ]; then
  export ENV_PORT="${PROXY_PORT_MAIN}"
else
  export ENV_PORT="${PROXY_PORT_RAG}"
fi
DATABASE_URL_RAG_CHATBOT=$(build_local_url "${ENV_KEY}" "${ENV_PORT}") || DATABASE_URL_RAG_CHATBOT=""

all_ports_listening() {
  for port in "${PORTS_TO_CHECK[@]}"; do
    if ! is_listening "${port}"; then
      return 1
    fi
  done
  return 0
}

if [ -n "${DATABASE_URL_RAG_CHATBOT}" ]; then
  DB_URLS_TO_CHECK+=("${DATABASE_URL_RAG_CHATBOT}")
fi

all_databases_ready() {
  local url
  for url in "${DB_URLS_TO_CHECK[@]}"; do
    if ! can_connect_postgres "${url}"; then
      return 1
    fi
  done
  return 0
}

if all_ports_listening && all_databases_ready; then
  if [ "${SHARE_PROXY_PORT}" -eq 1 ]; then
    echo "✅ Cloud SQL proxy already listening on 127.0.0.1:${PROXY_PORT_MAIN}"
  else
    echo "✅ Cloud SQL proxy already listening on 127.0.0.1:${PROXY_PORT_MAIN} and 127.0.0.1:${PROXY_PORT_RAG}"
  fi
else
  if all_ports_listening && ! all_databases_ready; then
    echo "❌ A process is listening on the Cloud SQL proxy port(s), but Postgres is not accepting connections through it."
    for port in "${PORTS_TO_CHECK[@]}"; do
      listener="$(find_listener "${port}")"
      if [ -n "${listener:-}" ]; then
        echo "   Port ${port}: ${listener}"
      fi
    done
    echo "   Stop the stale listener and run the command again."
    exit 1
  fi
  echo "🚀 Starting Cloud SQL proxy for the production build..."
  if [ -n "${PROXY_CREDENTIAL_FILE}" ]; then
    "${PROXY_BIN}" -credential_file="${PROXY_CREDENTIAL_FILE}" -instances="${INSTANCES_ARG}" &
  else
    "${PROXY_BIN}" -instances="${INSTANCES_ARG}" &
  fi
  PROXY_PID=$!
  STARTED_PROXY=1
  echo "🔧 Proxy PID: ${PROXY_PID}"
fi

ATTEMPTS=$((PROXY_START_TIMEOUT_SECONDS * 2))
for ((i = 1; i <= ATTEMPTS; i++)); do
  if all_ports_listening && all_databases_ready; then
    if [ "${SHARE_PROXY_PORT}" -eq 1 ]; then
      echo "✅ Proxy ready on 127.0.0.1:${PROXY_PORT_MAIN} for both main and RAG databases"
    else
      echo "✅ Proxies ready on 127.0.0.1:${PROXY_PORT_MAIN} and 127.0.0.1:${PROXY_PORT_RAG}"
    fi
    break
  fi
  if [ "${STARTED_PROXY}" -eq 1 ] && [ -n "${PROXY_PID:-}" ] && ! kill -0 "${PROXY_PID}" >/dev/null 2>&1; then
    echo "❌ Cloud SQL proxy exited before opening its local port."
    exit 1
  fi
  sleep 0.5
done

if ! all_ports_listening || ! all_databases_ready; then
  echo "❌ Proxy failed to start within ${PROXY_START_TIMEOUT_SECONDS}s."
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

if [ -z "${DATABASE_URL}" ]; then
  echo "❌ DATABASE_URL is not set in .env/.env.local"
  exit 1
fi

if [ -z "${DATABASE_URL_RAG_CHATBOT}" ]; then
  echo "⚠️ DATABASE_URL_RAG_CHATBOT not found; using DATABASE_URL for RAG chatbot"
  DATABASE_URL_RAG_CHATBOT="${DATABASE_URL}"
fi

if [ ! -f ".next/standalone/server.js" ]; then
  echo "❌ Missing .next/standalone/server.js. Run pnpm build first."
  exit 1
fi

if [ ! -d ".next/static" ]; then
  echo "❌ Missing .next/static. Run pnpm build first."
  exit 1
fi

echo "📦 Syncing standalone static assets..."
copy_dir_contents ".next/static" ".next/standalone/.next/static"

if [ -d "public" ]; then
  copy_dir_contents "public" ".next/standalone/public"
fi

APP_PORT="${DEFAULT_APP_PORT}"
if is_listening "${APP_PORT}"; then
  if [ -n "${PORT:-}" ]; then
    echo "❌ PORT ${APP_PORT} is already in use."
    listener="$(find_listener "${APP_PORT}")"
    if [ -n "${listener:-}" ]; then
      echo "   ${listener}"
    fi
    exit 1
  fi

  AVAILABLE_PORT="$(find_available_port 3001 3010)" || {
    echo "❌ Port 3000 is already in use and no free fallback port was found in the 3001-3010 range."
    exit 1
  }
  APP_PORT="${AVAILABLE_PORT}"
  echo "ℹ️ Port 3000 is already in use; starting Next standalone server on ${APP_PORT} instead."
fi

RUNTIME_BASE_URL="${GOODHIVE_BASE_URL:-http://localhost:3000}"
if [ "${APP_PORT}" != "3000" ] && [ "${RUNTIME_BASE_URL}" = "http://localhost:3000" ]; then
  RUNTIME_BASE_URL="http://localhost:${APP_PORT}"
fi

echo "🚀 Starting Next standalone server on port ${APP_PORT}..."
PORT="${APP_PORT}" GOODHIVE_BASE_URL="${RUNTIME_BASE_URL}" DATABASE_URL="${DATABASE_URL}" DATABASE_URL_RAG_CHATBOT="${DATABASE_URL_RAG_CHATBOT}" node .next/standalone/server.js
