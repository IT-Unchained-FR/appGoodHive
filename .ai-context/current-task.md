# Current Tasks

**Last Updated**: 2025-12-02

## Active Work

### Codex
- Working on: Analytics route and JobTrendsChart component
- Files:
  - `app/api/admin/analytics/route.ts`
  - `app/components/admin/JobTrendsChart.tsx`
- Status: On hold (will resume later)

### Codex
- Working on: Admin filter plan sync and gap check (no code changes yet)
- Files reviewed:
  - `app/api/admin/users/route.ts`
  - `app/api/admin/jobs/route.ts`
  - `app/api/admin/talents/route.ts`
  - `app/api/admin/companies/route.ts`
  - `app/admin/*`
  - `lib/admin-filters.ts`
  - `app/components/admin/AdminFilters.tsx`
- Status: Completed companies filters; remaining gaps: approval tables migration, filter chips

### Codex
- Working on: DB created_at enforcement/backfill across all tables (prod + dev DBs)
- Files:
  - `goodhive-prod-database` (Cloud SQL)
  - `goodhive-dev-database` (Cloud SQL)
- Status: Completed (backfilled to 2025-11-28 00:41:00+00, defaults set to NOW, NOT NULL)

### Claude Code
- Available for new tasks

### Cursor
- Available for new tasks

---

## Instructions
When you start working, update this file with:
- Your name (Claude Code/Cursor/Codex)
- What you're working on
- Which files you're modifying
- Current status
