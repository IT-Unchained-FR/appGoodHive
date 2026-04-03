# Admin Panel Phase 1 DB Migration Log

## Date
2026-04-03

## Scope
Phase 1 admin fixes from `docs/features/admin-phase-1-fixes.md`.

## Migration Applied On Dev
- Migration file: `app/db/migrations/admin_infrastructure.sql`
- Command run against the dev DB:

```bash
set -a
source .env >/dev/null 2>&1
psql "$DATABASE_URL" -f app/db/migrations/admin_infrastructure.sql
```

## Objects Created
- `goodhive.admin_settings`
- `goodhive.admin_audit_log`
- `admin_audit_log_target_idx`
- `admin_audit_log_admin_idx`

## Seeded Dev Data
The migration seeded these `goodhive.admin_settings` keys on dev:
- `notifications`
- `security`
- `system`

## Dev Verification
- Verified both new tables exist in schema `goodhive`
- Verified seeded rows exist in `goodhive.admin_settings`
- Verified `goodhive.users.created_at` exists on the dev DB

## Prod Follow-Up
Production still needs the same migration applied.

Recommended command:

```bash
psql "$PROD_DATABASE_URL" -f app/db/migrations/admin_infrastructure.sql
```

After prod migration, verify:
- `goodhive.admin_settings` exists
- `goodhive.admin_audit_log` exists
- seeded settings keys are present if missing before deploy
- `goodhive.users.created_at` exists on prod before relying on `usersLast7Days`

## Notes
- This file is the handoff record for the later production DB migration.
- Do not rely on chat history as the source of truth for this migration state.
