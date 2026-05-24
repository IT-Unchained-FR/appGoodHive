# Current Task

## Status
`RECRUITER DASHBOARD — API WIRING & REAL DATA (May 24, 2026)`

## Last Updated
2026-05-24

## Active Feature Plan
See full battle plan → [`docs/features/recruiter-dashboard-features.md`](../features/recruiter-dashboard-features.md)

---

## 🎯 RECRUITER DASHBOARD — API CONNECTION PLAN

> Goal: every number and piece of text visible in `/recruiter/dashboard` must come from real DB data. No hardcoded deltas, no misleading labels, no silent failures.

---

### 🔴 BUG-1 — Pipeline API returns 403 for recruiters
**File:** `app/api/pipeline/route.ts:11`

**Root cause:** `isPipelineAuthorized` checks:
```sql
SELECT user_id FROM goodhive.talents
WHERE user_id = $userId AND recruiter_status = 'approved'
```
But `recruiter_status` lives on `goodhive.users`, **not** `goodhive.talents`. Recruiters always get 403 → pipeline stat card and health bar show 0/empty forever.

**Fix:**
```sql
SELECT userid FROM goodhive.users
WHERE userid = $userId::uuid AND recruiter_status = 'approved'
LIMIT 1
```

**Files changed:** `app/api/pipeline/route.ts`

---

### 🔴 BUG-2 — Display name fetch uses wrong response path
**File:** `app/recruiter/dashboard/page.tsx:605`

**Root cause:** Code reads:
```ts
const fn = data?.talent?.first_name ?? data?.first_name ?? "";
```
`/api/talents/my-profile` returns `first_name` at the **top level** of the JSON response (line 604 of the route). `data.talent` is `effectiveTalent` (a different sub-object used for role flags, not the flat profile). So `data?.talent?.first_name` is always `undefined`, and `data?.first_name` is the correct fallback — but only by accident.

**Fix:** Drop the wrong primary path, keep only the correct one:
```ts
const fn = data?.first_name ?? "";
```

**Files changed:** `app/recruiter/dashboard/page.tsx`

---

### 🟡 FAKE-DATA-1 — All stat card deltas are hardcoded strings

**File:** `app/recruiter/dashboard/page.tsx` — stat card `delta` props

| Card | Current (fake) | Should be |
|------|---------------|-----------|
| Total Searches | `"18%"` | `"X% vs last week"` computed from search history |
| Talents in Pipeline | `"5"` | `"+N this week"` from pipeline `created_at` |
| Interviewing | `"2 vs last week"` | Real count diff vs 7 days ago |
| Hired This Month | `"33%"` | Real % change hired this month vs last month |

**Fix:** Add a new API endpoint `GET /api/recruiter/stats` that returns pre-computed deltas server-side. The client computes what it can from already-loaded data; the endpoint provides week/month aggregates.

**New file:** `app/api/recruiter/stats/route.ts`

Response shape:
```ts
{
  success: true,
  data: {
    searches: {
      total: number,           // all time
      thisWeek: number,        // last 7 days
      lastWeek: number,        // 7–14 days ago
      sparkline: number[],     // 12 daily counts, oldest→newest
    },
    pipeline: {
      addedThisWeek: number,
      addedLastWeek: number,
      sparkline: number[],
    },
    interviewing: {
      current: number,
      lastWeek: number,
    },
    hired: {
      thisMonth: number,
      lastMonth: number,
    },
  }
}
```

SQL for each bucket (all scoped to `recruiter_id = sessionUser.user_id`):
- **searches.thisWeek:** `COUNT(*) FROM recruiter_search_history WHERE created_at > NOW() - INTERVAL '7 days'`
- **searches.lastWeek:** `COUNT(*) WHERE created_at BETWEEN NOW()-'14 days' AND NOW()-'7 days'`
- **searches.sparkline:** `COUNT(*) GROUP BY DATE_TRUNC('day', created_at) ORDER BY day DESC LIMIT 12`
- **pipeline.addedThisWeek / lastWeek:** `COUNT(*) FROM company_talent_pipeline WHERE company_id = $id AND created_at > ...`
- **interviewing.current:** `COUNT(*) FROM company_talent_pipeline WHERE stage = 'interviewing'`
- **interviewing.lastWeek:** same but snapshot `updated_at < 7 days ago AND stage was 'interviewing'` — approximate with current count (good enough)
- **hired.thisMonth / lastMonth:** `COUNT(*) WHERE stage = 'hired' AND DATE_TRUNC('month', updated_at) = ...`

**Files changed:** `app/api/recruiter/stats/route.ts` (new), `app/recruiter/dashboard/page.tsx`

---

### 🟡 FAKE-DATA-2 — Sparklines are static hardcoded points
**File:** `app/recruiter/dashboard/page.tsx:108–114`

```ts
const SPARKS = {
  searches: "0,18 10,14 20,16 ...",   // ← completely fake
  ...
}
```

**Fix:** Use `stats.searches.sparkline` (12-element `number[]` from the new `/api/recruiter/stats`) to build SVG polyline points dynamically. Normalize to a 0–20 y-axis:
```ts
function toPolyline(values: number[]): string {
  const max = Math.max(...values, 1);
  return values
    .map((v, i) => `${(i / (values.length - 1)) * 120},${20 - (v / max) * 18}`)
    .join(" ");
}
```

**Files changed:** `app/recruiter/dashboard/page.tsx`

---

### 🟡 FAKE-DATA-3 — ActivityTabs state is wired to UI but never filters anything
**File:** `app/recruiter/dashboard/page.tsx:558–695`

`activeTab` is set when the user clicks a tab, but no section reads it. The tabs are purely cosmetic.

**Fix:** Wire the tabs to filter the **bottom section** of the dashboard:
- `"all"` → show `TopTalentsSection` + `RecentSearchesSection` (current default)
- `"shortlisted"` → show a `PipelineStageSection` filtered to `stage === 'shortlisted'`
- `"interviews"` → show `PipelineStageSection` filtered to `stage === 'interviewing'`
- `"offers"` → show `PipelineStageSection` filtered to `stage === 'contacted'`
- `"hired"` → show `PipelineStageSection` filtered to `stage === 'hired'`

The `PipelineStageSection` is a new local component (50 lines) that renders the filtered `pipeline[stage]` entries using the rich talent data already returned by the pipeline API.

**Files changed:** `app/recruiter/dashboard/page.tsx`

---

### 🟡 FAKE-DATA-4 — PipelineEntry type discards available rich data
**File:** `app/recruiter/dashboard/page.tsx:46–50`

Current type:
```ts
interface PipelineEntry {
  id: string;
  stage: string;
}
```

The pipeline `GET /api/pipeline` actually returns (see route.ts lines 31–50):
```ts
id, talent_id, stage, notes, job_id, created_at, updated_at,
talent_name, talent_image, talent_skills, talent_title, talent_bio
```

This rich data is thrown away at the type boundary, so `PipelineHealthBar` can only count entries, not show talent names/avatars.

**Fix:** Expand the type:
```ts
interface PipelineEntry {
  id: string;
  talent_id: string;
  stage: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  talent_name: string | null;
  talent_image: string | null;
  talent_title: string | null;
  talent_skills: string | null;
}
```

Use `talent_name` and `talent_title` in the new `PipelineStageSection` component.

**Files changed:** `app/recruiter/dashboard/page.tsx`

---

### 🟡 MISLEADING-1 — Section title "Top talents this week" shows last search only
**File:** `app/recruiter/dashboard/page.tsx:379`

The section reads `searchHistory[0]?.candidates?.slice(0, 4)` — always the most recent search, regardless of when it was made. If last search was 3 weeks ago, title is wrong.

**Fix (Option A — rename):** Change the section label to `"Latest AI Search Results"` and sub-label to the search timestamp. No logic change needed.

**Fix (Option B — real aggregation):** Gather all searches from last 7 days, deduplicate by `userId`, sort by `score DESC`, show top 4. Slightly more logic but honest.

→ **Recommended: Option A** (rename). Option B can be done later for the Analytics page.

**Files changed:** `app/recruiter/dashboard/page.tsx:379`

---

### 🟢 ENHANCEMENT-1 — Pipeline count badge in sidebar
**File:** `app/recruiter/dashboard/layout.tsx`

The feature doc (`docs/features/recruiter-dashboard-features.md:33`) specifies showing a live count badge next to "Talent Pipeline" in the sidebar. Already planned.

**Fix:** Add a `pipelineCount` prop to the layout (or fetch in the layout itself). The layout already has access to the session. A small `GET /api/pipeline` call (or a lightweight count-only endpoint `GET /api/pipeline/count`) returns total entries.

Option: pass `pipelineCount` down from a parent server component. Or: fetch inside the layout with a small `useEffect` on mount (client component already).

**Files changed:** `app/recruiter/dashboard/layout.tsx`, optionally `app/api/pipeline/count/route.ts` (new lightweight endpoint)

---

### 🟢 ENHANCEMENT-2 — Per-section error states + retry
**File:** `app/recruiter/dashboard/page.tsx`

Currently if a fetch fails, a toast appears and the section shows nothing (loading skeleton stays or shows 0). There is no retry affordance.

**Fix:** Add `errorHistory` and `errorPipeline` booleans. When `true`, render an inline error card per section with a "Retry" button that re-runs the fetch.

**Files changed:** `app/recruiter/dashboard/page.tsx`

---

## 📋 Implementation Order (for Codex)

| Priority | Task | File(s) | Effort |
|----------|------|---------|--------|
| 🔴 P0 | Fix pipeline 403 (BUG-1) | `app/api/pipeline/route.ts` | 2 lines |
| 🔴 P0 | Fix display name path (BUG-2) | `app/recruiter/dashboard/page.tsx` | 1 line |
| 🟡 P1 | New `/api/recruiter/stats` endpoint | `app/api/recruiter/stats/route.ts` | ~60 lines SQL |
| 🟡 P1 | Wire stats to stat cards + sparklines | `app/recruiter/dashboard/page.tsx` | ~40 lines |
| 🟡 P1 | Expand PipelineEntry type (FAKE-DATA-4) | `app/recruiter/dashboard/page.tsx` | 8 lines |
| 🟡 P1 | Wire ActivityTabs to filter content (FAKE-DATA-3) | `app/recruiter/dashboard/page.tsx` | ~60 lines |
| 🟡 P2 | Rename misleading section title (MISLEADING-1) | `app/recruiter/dashboard/page.tsx` | 1 line |
| 🟢 P2 | Pipeline count badge in sidebar | `app/recruiter/dashboard/layout.tsx` | ~25 lines |
| 🟢 P3 | Per-section error states + retry | `app/recruiter/dashboard/page.tsx` | ~30 lines |

---

## ✅ Acceptance Criteria

- [ ] Opening `/recruiter/dashboard` shows **zero** hardcoded numbers
- [ ] Stat card deltas reflect real DB data (may show "—" if no history yet)
- [ ] Sparklines trace real activity over the last 12 days
- [ ] Clicking "Shortlisted" tab shows actual shortlisted pipeline entries with talent names
- [ ] Pipeline health bar renders correctly for recruiter users (not always 0)
- [ ] Greeting shows recruiter's real first name
- [ ] Section label says "Latest AI Search Results" (not "this week" if data is older)
- [ ] Each section shows an error card with Retry button on fetch failure

---

## 🔧 Validation Commands
```bash
npx tsc --noEmit --skipLibCheck
npm run build
```

---

### Previous Focus
- [x] **#1 Recruiter Home Dashboard** — dashboard page built (UI done, API wiring in progress above)
- [ ] **#2 Pipeline Count Badges** — live counts on sidebar (see ENHANCEMENT-1 above)
- [ ] **#3 Export Pipeline to CSV** — one-click download

### Up Next (Medium)
- [ ] **#4 Analytics Page** — pipeline funnel + search activity charts
- [ ] **#5 Candidate Comparison View** — side-by-side modal
- [ ] **#6 Send to Client Summary** — AI-generated talent blurb

---

## 🎯 TALENT PIPELINE — POLISH & BUG FIXES — May 21, 2026

### What was fixed
- [x] Fix drag-and-drop to empty columns — added `useDroppable` to each `KanbanColumn` so empty columns are valid drop targets; drop zone highlights amber on hover
- [x] Fix `SaveToPipelineButton` visibility guard — button now only renders for `isApprovedCompanyViewer`, not for all authenticated users (talents were seeing and getting silent 403s)
- [x] Add `SaveToPipelineButton` to search-results talent cards — `isCompanyViewer` prop passed from server component; compact bookmark icon in top-right of each card
- [x] Show already-saved state on talent profile — new `GET /api/pipeline/check` route; `SaveToPipelineButton` accepts `checkOnMount` prop that queries on mount and sets saved state
- [x] Add Talent Pipeline to company dashboard sidebar — `Kanban` icon entry after Top Candidates
- [x] Update feature doc status to `LIVE` in `docs/features/company-talent-pipeline.md`

### Validation
- [x] `pnpm lint`
- [x] `pnpm tsc --noEmit`

### Prod DB migration
- [x] Run: `psql "$PROD_DATABASE_URL" -f app/db/migrations/company_talent_pipeline.sql`
- [x] Verify: `psql "$PROD_DATABASE_URL" -c "\dt goodhive.company_talent_pipeline"` — table confirmed, 0 rows

---

---

## 🎯 GEMINI PROVIDER MIGRATION — May 8, 2026

**Context:** Generative AI calls should use Google AI Studio via `@google/generative-ai` only. Vertex AI generative model fallback/selection has been removed; Vertex RAG retrieval remains untouched in `lib/ragEngine.ts`.

### What was changed
- [x] Rewrote `lib/gemini.ts` to require `GEMINI_API_KEY`, default chat calls to `gemini-2.0-flash`, and use `gemini-embedding-001` through Google AI Studio.
- [x] Removed `@google-cloud/vertexai` from `package.json`.
- [x] Added `GEMINI_API_KEY` and `gemini-2.0-flash` model overrides to `.env.local` and `.env`.
- [x] Documented Google AI Studio setup in `.env.example`.
- [x] Updated standalone start scripts to export auth/Gemini runtime env vars from `.env.local`/`.env` before launching the built server.
- [x] Migrated remaining active OpenAI route handlers to Gemini while leaving OpenAI dependency/env configuration dormant.

### Validation
- [x] `pnpm install`
- [x] `pnpm tsc --noEmit`
- [x] `pnpm lint` (passes with existing warnings)
- [x] Confirm no `@google-cloud/vertexai` TypeScript imports remain
- [x] Confirm no active `app/` or `lib/` OpenAI imports/calls remain
- [x] Confirm `google-auth-library` remains available for RAG
- [x] Direct Google AI Studio SDK smoke test with project `goodhive-1706112296263`

### Known risks / TBD
- [ ] Endpoint smoke test with `/api/ai/generate-job-description` still needs a logged-in session; unauthenticated curl returns `401` by design.
- [ ] Confirm billing/quota for the configured Google AI Studio key in project `goodhive-1706112296263` before production use.

---

## 🎯 TALENT LINK CLICK TRACKING FIX — May 7, 2026

**Context:** Clicking a talent LinkedIn/social link from a dual-role talent + company account did not appear in admin contact logs.

### What was fixed
- [x] Updated `/talents/[user_id]` social-link tracking so approved recruiter/company viewers are tracked even when they are also approved talents.
- [x] Hardened tracked external link POSTs with included credentials, keepalive delivery, and dev-only failure warnings.
- [x] Added server-side validation requiring `linkType` and `linkUrl` for `link_click` contact logs.

### Validation
- [x] `pnpm tsc --noEmit`
- [x] `pnpm lint` (passes with existing warnings)

---

## 🎯 ADMIN CONTACT LOGS ACCESS FIX — May 7, 2026

**Context:** `/admin/contact-logs` existed but redirected admins back to `/admin/login`.

### What was fixed
- [x] Removed the client-side `Cookies.get("admin_token")` gate from `app/admin/contact-logs/page.tsx`.
- [x] Updated the contact logs page to let `/api/admin/contact-logs` validate the httpOnly admin cookie and redirect only on a real `401`.

### Validation
- [x] `pnpm tsc --noEmit`
- [x] `pnpm lint` (passes with existing warnings)

---

## 🎯 ADMIN REFERRALS & MESSENGER FIXES — April 27, 2026

**Context:** Improved the admin's ability to track referrals and resolved critical bugs in messaging and data visibility.

### What was built
- [x] **Admin Referrals:** Added a new referral tracking system with backend APIs and a dedicated admin view.
- [x] **DataGrid Refinement:** Updated `sharedTalentColumns.tsx` and `AdminDataGrid.tsx` to handle referral data, improved row design for better readability, and fixed talent visibility issues.
- [x] **Top Candidates Logic:** Updated `/api/companies/top-candidates` to exclude the company's own talent profile from AI match results.
- [x] **Messenger Fix:** Resolved a 403 Forbidden error in `/api/messenger/threads` that was incorrectly blocking approved talents.

### Validation
- [x] `pnpm tsc --noEmit` passes
- [x] `pnpm lint` passes

---

## 🎯 AI COVER LETTER DRAFTER — April 27, 2026

**Context:** Added a new standout AI feature to help talents generate highly personalized cover letters when applying for jobs. This addresses the "blank page syndrome" and boosts application quality.

### What was built
- [x] Added `app/api/ai/draft-cover-letter/route.ts` which securely fetches the talent's profile, fetches the job details, and calls Gemini to draft a 3-4 sentence professional pitch.
- [x] Updated `app/components/job-application-popup/job-application-popup.tsx` to add a `✨ Auto-Draft with AI` button next to the Cover Letter field.
- [x] Automatically injects the generated text into the `react-hook-form` and validates it.

### Validation
- [x] `pnpm tsc --noEmit` passes
- [x] `pnpm lint` passes

---

## 🎯 AI TOP CANDIDATES FOR COMPANIES — April 26, 2026

**Context:** Companies need a dashboard page that ranks the top 5 available candidates for a selected published job using the existing AI match-score system. The broken `/connect-logs` page also needed to become a real user-based contact log for direct contacts and job requests.

### What was built
- [x] Added `/companies/dashboard/top-candidates` with published job selector, Generate/Refresh action, top-5 candidate cards, AI explanation modal, and Contact Candidate flow.
- [x] Hardened `/companies/dashboard/top-candidates` candidate cards so each card keeps a fixed footprint, clamps overflowing content, and uses the refreshed visual layout safely across viewport sizes.
- [x] Added `/api/companies/top-candidates` to verify approved company access, score approved available talents, reuse `match_score_cache`, and return the top 5 candidates.
- [x] Added `app/db/migrations/contact_logs.sql` for `goodhive.contact_logs`.
- [x] Added `/api/contact-logs` and `lib/contact-logs.ts`.
- [x] Updated direct talent contact and job request creation to write contact log entries.
- [x] Rebuilt `/connect-logs` to read unified contact logs and show viewer type (`company` or `talent`) plus contact type (`direct` or `job_request`).
- [x] Added "Top Candidates" to the company dashboard sidebar.

### Validation
- [x] `pnpm tsc --noEmit`
- [x] `pnpm lint` (passes with existing warnings)
- [x] `pnpm build` with local dummy env for required build-time secrets (passes; existing dynamic server usage warnings still print during static generation)
- [x] Dev DB migration applied from Codex shell after `.env` was added (April 26, 2026)

### Migration
- [x] Run on dev: `psql "$DATABASE_URL" -f app/db/migrations/contact_logs.sql`
- [ ] Run on prod after verification: `psql "$PROD_DATABASE_URL" -f app/db/migrations/contact_logs.sql`
- **Dev verification:** `\dt goodhive.contact_logs` confirms the table exists in the configured dev database.

---

## 🎯 SMART MATCH SCORE — DEMO PREP (April 20, 2026 meeting)

**Context:** The Smart Match Score feature is 100% implemented. API, Gemini AI, badge component, and both UI pages are wired. Dev and prod migrations, debug-log cleanup, and the company job selector are now complete.

### What was built (all ✅ — no code changes needed)
- `app/db/migrations/match_score_cache.sql` — DB migration (run on dev and prod)
- `app/api/ai/match-score/route.ts` — POST endpoint with 1-hour Gemini cache
- `app/lib/ai/match-score.ts` — Gemini 2.0 Flash prompt + JSON parser
- `app/components/MatchScoreBadge.tsx` — green/yellow/red pill badge with hover tooltip
- `app/components/job-page/YourMatchScoreCard.tsx` — full score card for talent on job detail page
- `app/jobs/[jobId]/page.tsx` — wired: `YourMatchScoreCard` for approved talents, locked placeholder for others
- `app/companies/search-talents/page.tsx` + `talent-result.tsx` — wired: passes `?jobId=` param → shows `MatchScoreBadge` per talent card, fetches scores in parallel batches of 5

### How the demo flow works
1. Company logs in → goes to `/companies/search-talents?jobId=<uuid>` (append a real job UUID from DB)
2. Each talent card loads a `MatchScoreBadge` (animated pulse → green/yellow/red %)
3. Hover the badge → tooltip shows "Why it matches" + "Gaps"
4. Talent logs in → views any published job → sees "AI Match Analysis" section with score bar + pros/cons cards

### P0 — Run DB migration on dev ← CODEX TASK
- [x] Run: `psql "$DATABASE_URL" -f app/db/migrations/match_score_cache.sql`
- [x] Verify table exists: `psql "$DATABASE_URL" -c "\dt goodhive.match_score_cache"`
- **Why:** Without this migration, every match-score API call will 500 and the badges will never render.

### P0 — Remove debug console.log statements ← CODEX TASK
- [x] Removed leftover debug logs from `app/companies/search-talents/page.tsx` and `app/companies/search-talents/talent-result.tsx`

Remove these leftover debug logs that will clutter Vercel output and shouldn't ship:

**`app/companies/search-talents/talent-result.tsx`:**
- Line 62: `console.log("Talents received:", talents.length);`
- Line 63: `console.log("Sample talent:", talents[0]);`
- Lines 234–237: the per-card `console.log("Talent", talent.userId || index, ":", {...})`

**`app/companies/search-talents/page.tsx`:**
- Line 72: `console.log("Search params received:", params);`
- Line 117: `console.log("Talents found:", talents.length);`
- Line 118: `console.log("Total count:", count);`

After removal run:
```bash
pnpm lint && pnpm tsc --noEmit
```

### P1 — Add "Match by job" UI affordance ← CODEX TASK (nice to have before demo)
Currently the company must manually add `?jobId=<uuid>` to the URL. Add a job selector dropdown to the search-talents filter bar so companies can pick one of their own jobs from a list, which then sets the `?jobId=` param and triggers match scoring.

**Implementation:**
1. `app/companies/search-talents/page.tsx` — fetch company's published jobs:
   ```sql
   SELECT id, title FROM goodhive.job_offers
   WHERE user_id = $viewerUserId AND published = true
   ORDER BY posted_at DESC LIMIT 20
   ```
   Pass `companyJobs` array + `selectedJobId` as props to a new client component.
2. New client component (inline or separate): a `<select>` or styled dropdown labeled **"Match talents to job"** that updates `?jobId=` in the URL on change. Use `useRouter().push()` — keep all other existing query params.
3. Place the dropdown in the filter bar, above or beside the existing search/filter controls.
4. When a job is selected, the badge loading state will start immediately (existing behavior in `talent-result.tsx`).

Acceptance: Company can pick a job from the dropdown → talent cards each show match scores without needing to hand-craft the URL.
- [x] Added a company-only "Match talents to job" dropdown that preserves the existing search query params while updating `jobId`

### P2 — Run DB migration on prod ← AFTER DEV VERIFIED
- [x] Confirm dev migration works + match scores returning from Gemini
- [x] Run: `psql "$PROD_DATABASE_URL" -f app/db/migrations/match_score_cache.sql`
- [x] Update `docs/tasks/current-task.md` with prod migration status

---

## 🔥 ADMIN PANEL OVERHAUL TASKS

Index: `docs/features/admin-panel-overhaul.md`
Phase 1 (bugs):  `docs/features/admin-phase-1-fixes.md`
Phase 2 (UI):    `docs/features/admin-phase-2-ui.md`
Phase 3 (extras):`docs/features/admin-phase-3-extras.md`

Codex pickup prompt per phase:
> "Implement all tasks in `docs/features/admin-phase-1-fixes.md`. Read the file fully before starting."

### P0 — ADMIN-001: Fix analytics SQL UNION ALL crash ← CODEX TASK
- [x] Split `approvalRates` UNION ALL query into two separate queries in `app/api/admin/analytics/route.ts:112-128`
- Companies SELECT has 6 columns, talents SELECT has 4 → PostgreSQL crash on every analytics load

### P0 — ADMIN-002: Add JWT expiry to admin tokens ← CODEX TASK
- [x] Add `{ expiresIn: "8h" }` to `sign()` call in `app/api/auth/admin/login/route.ts:50-53`
- Currently tokens never expire — security risk

### P1 — ADMIN-003: Implement settings persistence ← CODEX TASK
- [x] Create `app/db/migrations/admin_infrastructure.sql` (creates `admin_settings` + `admin_audit_log` tables)
- [x] Update settings GET to read from DB
- [x] Update settings PUT to write to DB
- [x] Run migration on dev
- [ ] Run migration on prod
- Dev migration log: `docs/admin-panel-db-migration/2026-04-03-phase-1-dev-migration.md`

### P1 — ADMIN-004: Implement audit log (action history) ← CODEX TASK
- [x] Update `app/api/admin/action-history/route.ts` to query `admin_audit_log` table
- [x] Write audit entries in `talents/status/route.ts` (after approval/rejection)
- [x] Write audit entries in `companies/[userId]/route.ts` (after approval/rejection/update)
- [x] Added action history section to talent detail page so audit entries are visible there too

### P1 — ADMIN-005: Fix usersLast7Days stat ← CODEX TASK
- [x] Replace hardcoded `{ count: 0 }` with real query in `app/api/admin/statistics/route.ts:97-98`
- [ ] Verify `goodhive.users.created_at` column exists on prod DB before deploying
- Dev DB verification complete; prod verification is still pending

### P1 — ADMIN-006: Remove console.log from charts ← CODEX TASK
- [x] Delete `console.log` lines from `UserGrowthChart.tsx:23-25`, `JobTrendsChart.tsx`, `analytics/page.tsx`

### P1 — ADMIN-007: Make admin token cookie httpOnly ← CODEX TASK
- [x] Login route sets httpOnly cookie server-side
- [x] Login page removes `Cookies.set("admin_token", ...)` client-side call
- [x] All admin client pages remove `Cookies.get("admin_token")` + `Authorization` header pattern (cookie sent automatically)
- [x] Create logout endpoint `app/api/auth/admin/logout/route.ts`
- ⚠️ Existing admin sessions will expire on deploy — admins must re-login

### P2 — ADMIN-008: Fix dashboard title duplication ← CODEX TASK
- [x] Remove manual `<h1>` from `app/admin/page.tsx` body (AdminPageLayout already renders the title)

### P2 — ADMIN-009: Fix payouts page layout ← CODEX TASK
- [x] Wrap `app/admin/payouts/page.tsx` content in `<AdminPageLayout>`

### P2 — Responsive admin shell + key pages ← CODEX TASK
- [x] Applied Phase 2 responsive layout rules to `AdminPageLayout` and `Sidebar`
- [x] Updated dashboard, analytics, payouts, settings, job detail, talent detail, company detail, and manage-admins for mobile/tablet layouts
- [x] Updated admin edit modal layouts so forms/actions stack cleanly on mobile

### Admin Overhaul Validation / Handoff
- [x] `pnpm lint` runs successfully (warnings only; existing hook-deps and `<img>` warnings remain in repo)
- [x] `pnpm build` succeeds (existing `cssstyle` resolution warnings from `isomorphic-dompurify` and dynamic server usage warnings still print during build)
- [x] `pnpm tsc --noEmit` passes repo-wide
- [x] Admin login now lands on `/admin` correctly after success by normalizing the admin JWT role claim and forcing a fresh navigation after login
- [x] Admin talents search now matches derived full names like `first_name + last_name` instead of only raw row keys such as `email`
- [x] Admin talents page now supports a persisted grid/table view switch, and the table mode exposes the full talent payload with `N/A` for empty values
- [x] Admin talents search is now server-backed, so searches like `Jubayer`, `Juhan`, and `Jubayer Juhan` match across the full directory instead of only the currently loaded page
- [x] Admin talents now use server pagination for faster loading, while DB-backed search/filter/sort still run across the full talent set before pagination is applied
- [x] Removed the `mentorStatus` filter from `/admin/talents` so talent-directory search results are not silently narrowed by mentor-specific review state
- [x] Tightened `/admin/talents` row-table mode by hiding long text columns and replacing file/image URLs with compact open-in-new-tab buttons
- [x] `/admin/talent-approval` now behaves as a true pending-review queue and excludes already approved, deferred, or rejected talent profiles
- [x] `/admin/talents` and `/admin/talent-approval` now show table skeleton loaders during fetches instead of flashing live column headers/content shells
- [x] `/admin/talents` row actions now use a cleaner `View + More` pattern so actions stay aligned and readable without overcrowding the table
- [x] `/admin/talents` edit modal now normalizes rich-text fields for cleaner editing, derives phone country code from selected country, and saves through a real admin `PUT` route
- [x] Admin routes are now isolated from the public wallet/session provider tree, preventing the repeated public-site `Welcome back!` auth loop on `/admin`
- [x] Public wallet auth no longer forces an immediate `/api/auth/me` refresh after successful connect, preventing the repeated `Welcome back!` toast loop when the session cookie is still settling
- [x] Company opportunity cards now use icon-led labeled metadata blocks, status-aware budget styling, and cleaner preview fallbacks so job attributes read clearly instead of as ambiguous pills
- [x] Public job pages now show a locked AI match-analysis placeholder for non-approved or logged-out viewers, so preview deployments no longer make the feature appear missing
- [x] `/admin/companies` now uses MUI DataGrid with server-backed pagination, column sorting, and full-directory search instead of the old client-sliced table
- [x] `/admin/talents` now uses MUI DataGrid for the admin directory table, with sortable columns like email, referred by, and created backed by server-side sorting
- [x] Admin directory search/filter changes now preserve the current page when possible, and the talents/companies APIs clamp out-of-range pages after filtering so pagination stays stable
- [x] `/admin/talent-approval` and `/admin/company-approval` now use MUI DataGrid as well, including built-in row selection for bulk actions
- [x] All MUI DataGrid-backed admin lists now expose DataGrid column filters, so admins can filter by text/value inside individual columns in addition to the existing top-level filters

### P2 — ADMIN-010: Implement real report generation ← CODEX TASK
- [x] Create `app/api/admin/reports/route.ts` (talents/companies/jobs CSV export)
- [x] Update `handleGenerateReport` in `app/admin/analytics/page.tsx` to trigger actual download

### P2 — ADMIN-011: Replace hand-rolled charts with Recharts ← CODEX TASK
- [x] Check if `recharts` is installed; add if not (`pnpm add recharts`)
- [x] Rewrite `UserGrowthChart.tsx` using `<AreaChart>`
- [x] Rewrite `JobTrendsChart.tsx` using `<AreaChart>` (different color)

### P3 — ADMIN-012: Remove orphaned admin components ← CODEX TASK
- [x] Verify zero imports, then delete: `RoleManager.tsx`, `PermissionsEditor.tsx`, `ActivityFeed.tsx`, `RecentActivity.tsx`, `ApprovalQueue.tsx`, `QuickActions.tsx`, `AdminTable.tsx`, `TableFilters.tsx`, `StatusFilter.tsx`

### P3 — ADMIN-013: Deduplicate Spinner in manage-admins ← CODEX TASK
- [x] Remove inline Spinner in `app/admin/manage-admins/page.tsx`, import from `@/app/components/admin/Spinner`

### P4 — Modal, detail page, and settings redesign ← CODEX TASK
- [x] Restyled `ApprovalPopup`, `RejectionModal`, `BulkApproval`, and `DeleteConfirmDialog` to match the Phase 4 modal spec
- [x] Rebuilt `EditTalentModal` and `EditCompanyModal` with grouped sections, sticky header/footer, and responsive form grids
- [x] Redesigned `app/admin/talent/[user_id]/page.tsx` into the two-column desktop layout with quick actions, skills, contact, and action history cards
- [x] Redesigned `app/admin/settings/page.tsx` with icon-led sections, descriptive switch rows, and a yellow save action

---

## ⚠️ Previous Directive (March 12 meeting)
**STOP new features. Make the existing platform work reliably.**
See full meeting notes: `docs/meetings/2026-03-12-juhan-benoit.md`

---

## 🔥 EARLIER STABILIZATION TASKS (carried over)

### P0 — Thirdweb credit exhaustion ← CODEX TASK
**Root cause:** `app/providers.tsx` uses `<ThirdwebProvider>` with no config → defaults to `autoConnect: true` in Thirdweb v5. On every page load, Thirdweb SDK re-authenticates social/embedded wallets against Thirdweb's servers, consuming API credits. `AuthContext.tsx:140-175` has a `useEffect` on `account?.address` that fires on every reconnect, compounding the issue. The plan costs $5/month — the next tier is $90, so we MUST reduce consumption.

**Fix:**
1. In `app/providers.tsx` — change `<ThirdwebProvider>` to `<ThirdwebProvider autoConnect={false}>`. Iron Session (`session_token` cookie) keeps users authenticated; the wallet does NOT need to auto-reconnect on every page to maintain login state.
2. For pages that actually need wallet connection (job creation/publish, payouts) — trigger a manual reconnect via the connect button. The user is already prompted there.
3. In `app/contexts/AuthContext.tsx` — the `useEffect` on `account?.address` (line 140-175) can stay as-is; it will just not fire on every page load anymore since wallet won't auto-reconnect.

**Do NOT change:** Iron Session auth, session_token cookie handling, or login flow.
**Acceptance:** After change, Thirdweb credit counter should not increment on normal page navigation for logged-in users.

---

### P0 — DB connection stability
- [x] Hardened `scripts/start-with-proxy.sh` and `scripts/dev-with-proxy.sh` so local startup now verifies a real Postgres handshake through the Cloud SQL proxy and auto-falls back to a free app port when `3000` is already occupied
- [x] Updated local Cloud SQL startup to prefer the repo service-account key (`github-actions-key.json`) over flaky local `gcloud` token refresh, and granted that service account `roles/cloudsql.client`
- [ ] Audit all concurrent connections across environments (localhost:3000, localhost:3001, preview, prod)
- [ ] Ensure dev environments use dev DB only; preview uses its own pool
- [ ] Verify `pg` pool settings (`max`) are respected per environment
- **Why:** Connection exhaustion causes random 500s on talent search, job listing, etc.

### P1 — Company job dashboard: jobs not loading ← PARTIALLY FIXED
- [x] **Dev DB migration applied (March 15):** `plan42_01_job_review_status.sql` confirmed — columns `review_status`, `admin_feedback`, `reviewed_at`, `reviewed_by` already existed on dev DB. 5 jobs backfilled to correct status.
- [ ] **⚠️ PROD DB migration still needed** — run `psql "$PROD_DATABASE_URL" -f app/db/migrations/plan42_01_job_review_status.sql` before production deploy
- [ ] Verify Benoit's company jobs now appear correctly on preview after next deploy
- **Root cause was:** Query in `lib/jobs/company-jobs.ts` selected `review_status`/`admin_feedback` — columns that were missing on production DB.

### P1 — Profile submission email: missing Calendly link ← BLOCKED
- [ ] **Blocked: need correct 45-min Calendly URL from Benoit**
- Current hardcoded URL (`app/email-templates/profile-submission-talent.tsx:5`): `https://calendly.com/benoit-goodhive` — may be generic, not the 45-min assessment slot
- Also: email failures are silently swallowed (`my-profile/route.ts:382-386`) — add log/alert so failed sends are visible in Vercel logs
- **Bug:** BUG-001 — Alvaro did not receive appointment link; Benoit had to send manually

### P1 — Admin new-company email: "undefined undefined" ← CODEX TASK
**Root cause:** `app/companies/my-profile/page.tsx:301-305` — the fetch to `/api/send-email` is missing the `name` field. The send-email handler's admin HTML at `app/api/send-email/route.ts:207` uses `${name}` directly (no fallback), producing "undefined".

**Fix — one line in `app/companies/my-profile/page.tsx` around line 301:**
```ts
body: JSON.stringify({
  email: dataForm.email,
  name: dataForm.designation,   // ← ADD THIS LINE
  type: "new-company",
  subject: `Welcome to GoodHive, ${dataForm.designation}! 🌟 Let's Connect You with Top IT Talent`,
}),
```
No other files need changing.

### P2 — Admin talent filter: 204 response ← NO ACTION NEEDED
**Finding:** `app/api/admin/talents/route.ts` already returns `200 + { data: [], pagination: {} }` on empty results. No code bug. Was likely a transient DB connection issue during the meeting. No fix required.

### P2 — Blockchain job publish UX ← CODEX TASK
**Context:** In `app/companies/create-job/JobForm.tsx`, there is no explicit "Publish on Blockchain" button. The current flow is: Save Draft → Submit for Review → (admin approves → published). The "Manage Funds" button (FundManager modal) exists separately but isn't surfaced prominently.

**Fix:**
- After a job is saved (not yet submitted for review), add a banner/callout: *"Fund your smart contract before submitting — this ensures your talent can be paid on-chain."* with a button that opens the FundManager modal.
- The callout should only show if the job has no blockchain funds provisioned yet.
- Do NOT change the submit-for-review flow itself — just add the CTA before it.
- Keep it simple: a yellow info banner (`bg-yellow-50 border-yellow-400`) between the job form and the submit button.

---

---

## ✅ COMPLETED THIS SESSION (March 12, 2026)

### Plan-42 Phase 4: Dashboards & Messaging Gate
- [x] P42-401 — Messaging gate: `POST /api/messenger/threads` now checks `published=true` (company) and `talent_status='approved'` (talent) before allowing thread creation
- [x] P42-402 — Close job: new `POST /api/jobs/[jobId]/close/route.ts`, button wired in `app/companies/dashboard/jobs/JobsManagementClient.tsx`
- [x] P42-403 — Nav links added: Career Coach, My Assignments, My Payouts (talent), Talent Pipeline (company)

### Plan-42 Phase 5: Mission Completion & On-Chain Payout
- [x] P42-501 — DB migration: `app/db/migrations/plan42_04_mission_payouts.sql` (run ✅)
  - Added `completion_requested_at`, `completion_requested_by`, `completed_at` to `goodhive.job_assignments`
  - New table: `goodhive.payouts` (assignment_id, job_id, talent_user_id, company_user_id, amount, token, chain, tx_hash, status, platform_fee, net_amount, confirmed_at)
- [x] P42-502 — `POST /api/assignments/[assignmentId]/request-completion/route.ts` — talent requests completion
- [x] P42-503 — `POST /api/assignments/[assignmentId]/confirm-completion/route.ts` — company confirms, creates payout record (5% platform fee)
- [x] P42-504 — `POST /api/payouts/[payoutId]/confirm-tx/route.ts` — company submits tx_hash after Thirdweb transfer
- [x] P42-505 — Payout history pages:
  - `app/api/payouts/route.ts` — GET payouts for current user
  - `app/api/admin/payouts/route.ts` — GET all payouts (admin)
  - `app/talents/my-payouts/page.tsx` — talent payout history with Polygonscan links
  - `app/admin/payouts/page.tsx` — admin view with totals
- [x] P42-506 — Mission completion email: `app/email-templates/mission-completed.tsx` + `sendMissionCompletedEmail()` in `lib/email/job-review.ts`
- [x] P42-507 — UX:
  - `app/talents/my-assignments/page.tsx` — "Request Completion" button for active assignments
  - `app/components/AssignTalentModal.tsx` — "Confirm & Pay" inline UI for `completion_requested` assignments

### Superbot v2 — Career Coach
- [x] DB migration: `app/db/migrations/superbot_v2_coach_messages.sql` (run ✅) — `goodhive.superbot_coach_messages`
- [x] `lib/ai/superbot-context.ts` — `buildTalentContext(userId)` fetches real profile, applications, assignments
- [x] `lib/ai/superbot-prompt.ts` — `buildCareerCoachSystemPrompt(context)` — full 500-word system prompt
- [x] `app/api/superbot/context/route.ts` — GET talent context
- [x] `app/api/superbot/coach/route.ts` — GET history / POST chat / DELETE clear (Gemini 1.5 Flash)
- [x] `app/talents/career-coach/page.tsx` — full chat UI with typing indicator, quick prompts, profile card

### Company Talent Pipeline (Kanban)
- [x] DB migration: `app/db/migrations/company_talent_pipeline.sql` (run ✅) — `goodhive.company_talent_pipeline`
- [x] `app/api/pipeline/route.ts` — GET (grouped by stage), POST (upsert)
- [x] `app/api/pipeline/[id]/route.ts` — PATCH (stage/notes), DELETE
- [x] `app/companies/pipeline/page.tsx` — full Kanban board with @dnd-kit drag-and-drop (5 stages)
- [x] `app/components/SaveToPipelineButton.tsx` — add talent to pipeline from their profile page
- [x] `app/talents/[user_id]/page.tsx` — `SaveToPipelineButton` added for company viewers

### AI Job Description Builder
- [x] `app/api/ai/generate-job-description/route.ts` — POST, Gemini-powered, returns structured sections
- [x] `app/components/JobDescriptionAIBuilder.tsx` — collapsible panel with seniority/work type/budget/tone inputs
- [x] `app/companies/create-job/JobForm.tsx` — AI builder inserted above `JobSectionsManager`

### Company Hiring Coach MVP
- [x] `lib/ai/company-hiring-coach.ts` — company/job/application context, prompt builders, JSON normalization
- [x] `app/api/companies/hiring-coach/*` — context, job post, interview questions, candidate summary endpoints
- [x] `app/companies/dashboard/hiring-coach/page.tsx` — tabbed company dashboard AI workspace
- [x] Dashboard/nav entry and applicant detail shortcut added
- [x] Feature doc: `docs/features/company-hiring-coach.md`
- [x] Context endpoint now returns only client-safe selector/display fields; full AI context remains server-side
- [x] Applicant detail deep links preserve `jobId` + `applicationId` until async context loads
- [x] Branch whitespace cleanup completed; current worktree passes `git diff --check origin/main`
- [x] Synced `pnpm-lock.yaml` with the branch's MUI DataGrid dependencies
- [x] Validation passed: `pnpm lint` (warnings only; existing hook-deps and `<img>` warnings remain)
- [x] Validation passed: `pnpm tsc --noEmit`
- [x] Validation passed: `pnpm build` with local dummy env for required build-time secrets (`DATABASE_URL`, JWT, OpenAI, Resend, B2)
- [ ] Manual smoke pending: generate job post, interview questions, and candidate summary as a company user
- TBD: Manual AI smoke depends on valid local company session, owned job/application data, and Gemini env configuration

### Revenue Infrastructure (DB + APIs only — NO UI entry points yet)
> **Benoit's direction (March 12):** No subscription charges from companies and no direct fees from talents for now. Only revenue model: 5% platform fee on mission payouts (already live). The DB tables and API routes below exist for future use.
- [x] DB migration: `app/db/migrations/revenue_subscriptions.sql` (run ✅) — tables exist but not exposed
  - `goodhive.company_subscriptions` (pro: 49 USDC/30d, enterprise: 199 USDC/30d)
  - `goodhive.featured_profiles` (9 USDC/7d featured listing)
- [x] `app/api/subscriptions/route.ts` — GET/POST (exists, no UI entry point)
- [x] `app/api/featured-profiles/route.ts` — GET/POST (exists, no UI entry point)
- [x] `app/companies/subscription/page.tsx` — pricing page exists (no nav link, not accessible to users)

---

## ⏳ PENDING / NEXT UP

### P1 — Wire Thirdweb USDC payment in mission payout flow
- [x] `app/components/AssignTalentModal.tsx` now sends the on-chain USDC transfer via Thirdweb after `confirm-completion` succeeds
- [x] Waits for the Polygon receipt, then calls `POST /api/payouts/[payoutId]/confirm-tx` with the confirmed `txHash`
- [x] Added pending/success/error UX states in the modal, including a Polygonscan link
- [x] `app/api/assignments/[assignmentId]/confirm-completion/route.ts` now returns `talentWalletAddress` from the talent's linked user wallet

### P2 — Admin payouts page link
- [x] Added "Payouts" to the admin sidebar nav so admins can reach `app/admin/payouts/page.tsx`

### P3 — TASK-007 (blocked)
- Replace blockchain section with video on company profile (waiting on Benoit's video URL)

### P1 — Job detail page guest privacy + redesign (March 30, 2026)
- [x] `app/jobs/[jobId]/page.tsx` now mirrors the job-card privacy contract for guests: job content stays visible, but company identity/profile links stay hidden until auth
- [x] Removed public exposure of company profile links from the guest sidebar state
- [x] Normalized token-address currency display so public budget cards show `USDC` instead of raw contract addresses
- [x] Refactored the page layout for stronger hierarchy, spacing, and mobile-friendly production presentation
- [x] Skills and role description remain public, while company identity/contact access is gated to approved talent / approved companies / admins / job owner
- [x] Removed the old `?connectWallet=true` auto-popup behavior from the navbar and now only clean the query param
- [x] Updated company welcome email CTA copy to use "Start your Talent Sprint" wording with the correct Calendly link
- [x] Expanded admin talent table with direct outreach columns for phone, location, LinkedIn, portfolio, and Telegram plus quick-access actions
- [x] Changed availability label from "Not looking" to "Not available" across the main status UI and stale-availability email copy
- [x] Repaired approved-role drift for talent profiles so approved roles stay active across save/review flows and admin status changes cannot leave profiles stuck as both approved and under review
- [x] Unified talent profile submission emails so only the server-side submission email is sent, using the updated assessment-call Calendly link and the refreshed welcome copy
- [x] Added an in-app interview-call CTA to the talent profile review banner so submitted talents can book the same Benoit Calendly link directly from their profile page
- [x] Polished the company profile photo validation state with softer helper copy, a branded inline error card, and a simplified hero title that now reads "Build Your Company Profile"
- [x] Rebuilt the public company profile page with a calmer 2026-style layout, stronger spacing hierarchy, published-only job cards, and direct contact details gated to approved viewers or admins only
- [x] Cleaned the public job hero so the company summary now sits under the role title and the duplicate job-preview paragraph is removed from the top section
- [x] Tightened the company-profile hero typography and moved the opportunities grid to a full-width section so job cards no longer get squeezed by the sidebar
- [x] Redesigned the job-page company sidebar card so the logo and company summary stack cleanly instead of compressing the text beside the profile image
- [x] Refined company opportunities with active/inactive tabs for owner/admin views, explicit job-status signals, cooler slate budget badges, and human-friendly job metadata labels
- [x] Added Gemini-powered job section cleanup so messy pasted job text is auto-formatted on save and the public job page now renders sanitized rich content instead of escaped raw section HTML
- [x] Hardened GoodHive Navigator chat error handling after intermittent DB timeouts: `/api/superbot/chat` now returns a structured service-unavailable payload, the widget surfaces that message, and Superbot CTA URLs are normalized against whitespace in `GOODHIVE_BASE_URL`
- [x] Removed mandatory Telegram connection from the web GoodHive Navigator flow: no automatic Telegram popup, no consent link prompt, and no header Telegram handoff button

---

## Architecture Quick Reference

| Concern | File/Pattern |
|---|---|
| DB | `@/lib/db` → `sql\`...\`` tagged template (postgres.js) |
| Auth (session) | `getSessionUser()` from `@/lib/auth/sessionUtils` |
| Auth (admin) | `verifyAdminToken(request)` from `@/app/lib/admin-auth` (synchronous) |
| Email | `lib/email/job-review.ts` helpers → Resend, sender: `GoodHive <no-reply@goodhive.io>` |
| Gemini AI | `getGeminiModel("gemini-1.5-flash")` from `lib/gemini.ts` |
| Thirdweb | `useActiveAccount()`, `prepareContractCall`, `sendTransaction` from `thirdweb/react` |
| USDC on Polygon | `process.env.NEXT_PUBLIC_GOODHIVE_USDC_TOKEN_POLYGON` |
| API convention | `NextResponse.json({ success: true, data })` / `{ success: false, error }` |
| Schema | All tables in `goodhive.*` schema |
| Companies approved | `published = true` in `goodhive.companies` |
| Talents approved | `talent_status = 'approved'` in `goodhive.talents` |
| users.id | INTEGER PK (do NOT use for FK in app-level tables) |
| users.userid | UUID (use this for all app-level foreign keys) |

## Known Pre-existing TypeScript errors
`pnpm tsc --noEmit` fails with repo-wide errors unrelated to this work. Only lint warnings are expected from our code. Do not try to fix pre-existing TS errors outside scope.

---

## Codex Pickup Instructions

1. Read `AGENTS.md` + `docs/architecture/overview.md` first
2. Pick highest priority unchecked task above (start with P1 — Thirdweb USDC payout wiring)
3. Run `pnpm lint && pnpm tsc --noEmit` after each task (lint warnings OK, TS errors in our new files are NOT OK)
4. Update checklist above with ✅ when done
5. List changed files + risks for Claude Code review
