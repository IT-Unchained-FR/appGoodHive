# Architecture Decisions

## Decision Log

### [2025-11-30] Admin Approval Pages Migration
- **Decision**: Migrated talent-approval and company-approval pages to use EnhancedTable + AdminFilters pattern with status filter support
- **Rationale**: Provides consistent UX across all admin pages, enables server-side filtering, URL-shareable filter state, better mobile experience, and export functionality
- **Alternatives Considered**: Keep existing AdminTable with client-side filtering (rejected due to limited functionality and inconsistent UX)
- **Impact**:
  - Frontend: `app/admin/talent-approval/page.tsx`, `app/admin/company-approval/page.tsx`
  - APIs: `app/api/admin/talents/pending/route.ts`, `app/api/admin/companies/pending/route.ts`
  - Added status filter (pending/approved/rejected/all) to approval pages per user request
  - Smart selection preservation when filters change
- **Owner**: Claude Code

### [2025-11-30] Admin Filter Chips Implementation
- **Decision**: Added visual filter chips with individual remove buttons to AdminFilters component
- **Rationale**: Improves UX by making active filters more visible and individually removable. Chips complement the existing "Clear all" button
- **Alternatives Considered**: Replace "Clear all" button with chips only (rejected - user wanted both options)
- **Impact**: `app/components/admin/AdminFilters.tsx`, `app/components/admin/AdminFilters.module.scss`
- **Owner**: Claude Code

### [2025-11-29] Admin Analytics Implementation
- **Decision**: Simplified job trends rendering approach
- **Rationale**: Previous implementation had complexity issues
- **Impact**: `app/components/admin/JobTrendsChart.tsx`, analytics route
- **Owner**: Codex

---

## Template for New Decisions

### [DATE] Decision Title
- **Decision**: What was decided
- **Rationale**: Why this approach
- **Alternatives Considered**: What else was considered
- **Impact**: What files/features affected
- **Owner**: Which AI/developer made this decision
