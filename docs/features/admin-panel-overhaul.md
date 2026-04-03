# Admin Panel: Production Overhaul — Index

**Created:** 2026-04-03
**Status:** Ready for Codex

## Overview

Two goals: fix real bugs + redesign UI to production quality (Dasher minimal SaaS style, GoodHive yellow accent).

## Phase Files

| Phase | File | What it covers |
|---|---|---|
| 1 | `docs/features/admin-phase-1-fixes.md` | All bug fixes: SQL crash, JWT expiry, settings persistence, audit log, stats, console.logs, httpOnly cookie, duplicate title, payouts layout |
| 2 | `docs/features/admin-phase-2-ui.md` | Full UI redesign: sidebar, stat cards, layout, dashboard, login, tables, backgrounds |
| 3 | `docs/features/admin-phase-3-extras.md` | Report CSV download, Recharts charts, dead code cleanup |

## Execution Order

**Phase 1 must run before Phase 2.** Phase 3 is independent.

Prompt Codex with:
> "Implement all tasks in `docs/features/admin-phase-1-fixes.md`. Read the file fully before starting."

Then:
> "Implement all tasks in `docs/features/admin-phase-2-ui.md`. Read the file fully before starting."

Then:
> "Implement all tasks in `docs/features/admin-phase-3-extras.md`. Read the file fully before starting."

## Design Reference

The UI redesign targets the Dasher minimal SaaS admin aesthetic:
- White sidebar, 256px, grouped nav with section labels, admin card at bottom
- Tinted-icon stat cards (number left, icon in colored box right)
- White topbar per page with title + actions
- Page background `#f4f6f8`
- Rounded-2xl cards, pill status badges
- GoodHive yellow `#FFC905` as accent throughout

## Key Files (admin panel lives here)

```
app/admin/                          Admin pages
app/components/Sidebar/             Sidebar component + CSS
app/components/admin/               Shared admin components
app/api/admin/                      Admin API routes
app/api/auth/admin/                 Admin auth routes
app/db/migrations/                  DB migrations (run manually)
```
