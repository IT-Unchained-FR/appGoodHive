#!/bin/bash

# Script to run database migrations
# Usage: ./db/run-migrations.sh

set -e  # Exit on error

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -E '^DATABASE_URL=' | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not found in .env file"
  exit 1
fi

echo "Running database migrations..."
echo "================================"

# Run each migration
echo ""
echo "[1/6] Adding created_at to referrals table..."
psql "$DATABASE_URL" -f db/migrations/add-created-at-to-referrals.sql
echo "✓ Migration 1 complete"

echo ""
echo "[2/6] Adding performance indexes..."
psql "$DATABASE_URL" -f db/migrations/add-admin-filter-indexes.sql
echo "✓ Migration 2 complete"

echo ""
echo "[3/6] Adding created_at to all tables..."
psql "$DATABASE_URL" -f db/migrations/add-created-at-to-all-tables.sql
echo "✓ Migration 3 complete"

echo ""
echo "[4/6] Adding min/max hourly rate fields to talents..."
psql "$DATABASE_URL" -f database/migrations/add_talent_rate_range.sql
echo "✓ Migration 4 complete"

echo ""
echo "[5/6] Adding talent resume import fields..."
psql "$DATABASE_URL" -f database/migrations/add_talent_resume_import_fields.sql
echo "✓ Migration 5 complete"

echo ""
echo "[6/7] Adding job applications table..."
psql "$DATABASE_URL" -f db/migrations/add-job-applications.sql
echo "✓ Migration 6 complete"

echo ""
echo "[7/7] Adding job requests + messenger foundation..."
psql "$DATABASE_URL" -f db/migrations/add-job-requests-and-messenger.sql
echo "✓ Migration 7 complete"

echo ""
echo "================================"
echo "All migrations completed successfully!"
