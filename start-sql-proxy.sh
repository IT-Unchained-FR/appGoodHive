#!/bin/bash

# GoodHive Cloud SQL Auth Proxy Startup Script
# This script starts the Cloud SQL Auth Proxy for secure database access
# No more IP whitelisting needed!

echo "🚀 Starting Cloud SQL Auth Proxy for GoodHive..."

PROXY_BIN="${CLOUD_SQL_PROXY_BIN:-}"

if [ -z "${PROXY_BIN}" ]; then
  if [ -x "./cloud_sql_proxy" ]; then
    PROXY_BIN="./cloud_sql_proxy"
  elif command -v cloud-sql-proxy >/dev/null 2>&1; then
    PROXY_BIN="$(command -v cloud-sql-proxy)"
  elif command -v cloud_sql_proxy >/dev/null 2>&1; then
    PROXY_BIN="$(command -v cloud_sql_proxy)"
  else
    echo "❌ Cloud SQL Auth Proxy not found."
    echo "   Install it, or set CLOUD_SQL_PROXY_BIN=/path/to/cloud-sql-proxy."
    exit 1
  fi
fi

# Kill any existing proxy processes
pkill -f cloud_sql_proxy

# Start the proxy in background on port 5433 to avoid conflicts
"${PROXY_BIN}" -instances=goodhive-1706112296263:europe-west9:goodhive-prod-db=tcp:5433 &

PROXY_PID=$!
echo "✅ Cloud SQL Auth Proxy started (PID: $PROXY_PID)"
echo "📡 Database accessible at: 127.0.0.1:5433"
echo "🔒 Secure connection via Google Cloud authentication"
echo ""
echo "To stop the proxy: pkill -f cloud_sql_proxy"
echo "To check status: ps aux | grep cloud_sql_proxy"
echo ""
echo "Now you can run: pnpm dev"
