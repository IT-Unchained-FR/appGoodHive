#!/bin/bash
set -euo pipefail

# Starts the Next.js standalone server against the dev DB (direct IP, no Cloud SQL proxy).
# Reads DATABASE_URL and DATABASE_URL_RAG_CHATBOT from .env.local or .env.

load_var() {
  local target="$1"
  for path in ".env.local" ".env"; do
    [ -f "$path" ] || continue
    while IFS= read -r line || [ -n "$line" ]; do
      line="${line#"${line%%[![:space:]]*}"}"
      [[ -z "$line" || "$line" == \#* ]] && continue
      if [[ "$line" == "${target}="* ]]; then
        local val="${line#*=}"
        val="${val%\"}"
        val="${val#\"}"
        val="${val%\'}"
        val="${val#\'}"
        printf '%s' "$val"
        return 0
      fi
    done < "$path"
  done
  return 1
}

DATABASE_URL="$(load_var DATABASE_URL)" || { echo "❌ DATABASE_URL not found in .env.local or .env"; exit 1; }
DATABASE_URL_RAG_CHATBOT="$(load_var DATABASE_URL_RAG_CHATBOT 2>/dev/null)" || DATABASE_URL_RAG_CHATBOT="$DATABASE_URL"

if [ -z "$DATABASE_URL_RAG_CHATBOT" ]; then
  echo "⚠️  DATABASE_URL_RAG_CHATBOT not set; using DATABASE_URL for RAG chatbot"
  DATABASE_URL_RAG_CHATBOT="$DATABASE_URL"
fi

if [ ! -f ".next/standalone/server.js" ]; then
  echo "❌ Missing .next/standalone/server.js — run 'pnpm build' first."
  exit 1
fi

echo "📦 Syncing standalone static assets..."
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete ".next/static/" ".next/standalone/.next/static/"
else
  rm -rf ".next/standalone/.next/static"
  cp -R ".next/static" ".next/standalone/.next/static"
fi

if [ -d "public" ]; then
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "public/" ".next/standalone/public/"
  else
    rm -rf ".next/standalone/public"
    cp -R "public" ".next/standalone/public"
  fi
fi

PORT="${PORT:-3000}"
GOODHIVE_BASE_URL="${GOODHIVE_BASE_URL:-http://localhost:${PORT}}"

echo "🚀 Starting Next standalone server on port ${PORT} → dev DB"
echo "   DATABASE_URL=${DATABASE_URL}"

PORT="$PORT" \
  GOODHIVE_BASE_URL="$GOODHIVE_BASE_URL" \
  DATABASE_URL="$DATABASE_URL" \
  DATABASE_URL_RAG_CHATBOT="$DATABASE_URL_RAG_CHATBOT" \
  node .next/standalone/server.js
