# Current Task

## Status
`IN PROGRESS — Talent Availability Calendar (March 10, 2026)`

## Last Updated
2026-03-10

## Development Branch Test Fixes (March 12, 2026)

- [x] TEST-FIX-001 — Messenger threads endpoint now uses session auth instead of caller-supplied user IDs
- [ ] TEST-FIX-002 — Profile review submission sends talent/admin emails only on first submission

## Completed — Messenger Polish ✅
Full plan: **`docs/tasks/messenger-polish.md`**

- [x] MSG-001 — Fix hardcoded messages URL in email
- [x] MSG-002 — Fix hardcoded dev email fallback
- [x] MSG-007 — Message length limit (API + UI)
- [x] MSG-005 — Empty state for no conversations
- [x] MSG-006 — Loading skeletons
- [x] MSG-003 — Exponential backoff on poll failures
- [x] MSG-004 — Optimistic message send
- [x] MSG-008 — Unread badge on navigation

## Active Task — Smart Match Score (P0 Innovation)
Full plan: **`docs/tasks/smart-match-score.md`**

- [x] MATCH-001 — DB migration: create match_score_cache table
- [x] MATCH-002 — Gemini helper: `app/lib/ai/match-score.ts`
- [x] MATCH-003 — API route: `app/api/ai/match-score/route.ts`
- [x] MATCH-004 — Badge component: `app/components/MatchScoreBadge.tsx`
- [x] MATCH-005 — Talent listing: show score per talent (company view)
- [x] MATCH-006 — Job detail page: show "Your Match Score" (talent view)

## Active Task — Talent Availability Calendar (P1)
Full plan: **`docs/features/talent-availability-calendar.md`**

- [x] AVAIL-001 — DB migration: availability status columns + availability blocks table
- [x] AVAIL-002 — API: `PATCH /api/profile/availability` and profile response fields
- [x] AVAIL-003 — UI components: `AvailabilityBadge` + `AvailabilityPicker`
- [x] AVAIL-004 — Profile UI: availability picker on talent edit + badge on public talent profile
- [x] AVAIL-005 — Talent filtering: `GET /api/talents` + availability query support in listing
- [x] AVAIL-006 — Auto-expiry + reminder email on stale `immediately` status

---

## Context for LLMs
GoodHive is an AI-powered talent marketplace. Benoit (boss/owner) runs QA and decides priorities. Juhan (dev) builds. Claude Code = architect/planner/reviewer. Codex = implementer. Read `docs/architecture/overview.md` for full stack context before touching any code. Meeting notes with full business context: `docs/meetings/2026-03-06-juhan-benoit.md`.

---

## Pre-Deploy Plan
Full detailed plan with exact code diffs for Codex: **`docs/tasks/pre-deploy-plan.md`**

### Pre-Deploy Execution Checklist (March 9, 2026)
- [x] Task 1 — Fix `name: undefined` in admin email subject
- [x] Task 2 — Role toggle does NOT reset approval
- [x] Task 3 — Critical field changes force submit for review
- [x] Task 4 — Remove hourly rate from AI suggestions
- [x] Task 5 — Show referrer in admin panel

Validation log after each completed task:
- Task 1: `pnpm lint && pnpm tsc --noEmit` (lint warnings only; `tsc` fails with existing repo-wide errors outside this task scope)
- Task 2: `pnpm lint && pnpm tsc --noEmit` (lint warnings only; same existing repo-wide `tsc` failures)
- Task 3: `pnpm lint && pnpm tsc --noEmit` (lint warnings only; same existing repo-wide `tsc` failures)
- Task 4: `pnpm lint && pnpm tsc --noEmit` (lint warnings only; same existing repo-wide `tsc` failures)
- Task 5: `pnpm lint && pnpm tsc --noEmit` (lint warnings only; same existing repo-wide `tsc` failures)

---

## Remaining Meeting Tasks
Full Codex plan: **`docs/tasks/remaining-meeting-tasks.md`**

- [x] TASK-005 — Referral commission text (already done — no action needed)
- [x] TASK-006 — Messenger end-to-end + email notification on new message
  - [x] TASK-006a — Company-only initiation from talent profile verified/fixed
  - [x] TASK-006b — Email notification on new message
  - [x] TASK-006c — Silent poll failures until 3 consecutive errors
- [ ] TASK-007 — Replace blockchain section with video (BLOCKED — waiting on video URL from Benoit)
- [x] TASK-008 — Company profile UI polish
- [x] TASK-009 — QA process doc

---

## ✅ COMPLETED TASKS

### TASK-004: Email Notifications Broken
**From meeting:** `docs/meetings/2026-03-06-juhan-benoit.md` — BUG-002
**Deadline:** Before Monday March 9 demo
**Background:** Benoit stopped receiving email notifications on Feb 24. New profiles created after that got no confirmation email. Notifications were likely disabled during dev testing and never re-enabled for production.

**All email triggers that must work:**
1. Talent submits profile for review → **talent** receives: "Profile received, here is Benoit's calendar link to book your intro call" (use `app@goodhive.io` as sender — NOT Benoit's personal email)
2. Talent submits profile for review → **Benoit (admin)** receives: "New profile submitted for review: [talent name]"
3. Talent applies to a company's job → **company** receives: "You have a new applicant: [talent name] applied for [job title]"
4. New message received → **recipient** receives: email notification (in progress separately)

**Acceptance Criteria:**
- [ ] All 4 email triggers verified working in production
- [ ] Sender address is `app@goodhive.io` (never Benoit's personal email)
- [ ] Email content matches the templates already built (check `app/lib/email/` and `app/email-templates/`)
- [ ] Test end-to-end: create test profile → submit for review → both talent and Benoit receive emails

**Impacted Files:**
- `app/api/profile/` — where profile submission happens (find the "send for review" handler)
- `app/api/applications/` — where job applications are created
- `app/lib/email/` — email dispatch helpers
- Check if there's an env var `SEND_EMAILS=false` or similar that was toggled off

---

### TASK-001: Remove Hourly Rate from AI Suggestions
**Status:** ✅ Done
**Background:** Benoit doesn't want AI to suggest hourly rates to new talents during profile setup. Talents should set their own rate.
**Acceptance Criteria:**
- [ ] Hourly rate field is NOT populated or suggested by AI in the profile enhancement flow
- [ ] Other AI-enhanced fields remain unaffected
**Files:** `app/api/ai-enhance/route.ts` or `app/api/ai-extract-skills/route.ts` — find where hourly rate is returned in the AI response and remove it from the prompt/response

---

### TASK-002: Show Referrer in Admin Panel
**Status:** ✅ Done
**Background:** Admin panel currently can't see who referred each talent/company. Benoit needs this for tracking referral commissions.
**Acceptance Criteria:**
- [ ] Admin talent list shows "Referred by: [name/email]" column or detail
- [ ] Admin company list shows same
- [ ] If no referrer, show "–"
**Files:** `app/admin/` pages, `app/lib/fetch-admin-talents.ts`, `app/lib/fetch-admin-companies.ts`, `app/api/admin/talents/`, `app/api/admin/companies/` — add JOIN to referrals table in queries

---

### TASK-003: Harden Role Toggle — Don't Reset Approval Status (BUG-001)
**Status:** ✅ Done
**Background:** When an approved talent changes their opportunity toggles (mentor / talent / recruiter), it currently sends them back to "pending" state. This broke Benoit's own profile during the meeting. It should NOT reset approval for existing approved users.
**Required Logic:**
- Changing opportunity type toggles (mentor, talent, recruiter) → does NOT trigger re-review
- Changing core identity fields (e.g. new professional claims, bio, skills) → MAY trigger re-review (define exactly which fields in code)
- Admin can always manually change status from admin panel without side effects
**Acceptance Criteria:**
- [ ] Approved talent changes opportunity toggles → status stays "approved"
- [ ] Re-review is only triggered by material identity/content changes (define list in code comment)
- [ ] Admin changing status from admin panel is always authoritative and doesn't re-trigger review
**Files:** `app/api/profile/route.ts` (or wherever profile save + review logic lives), check the review state machine logic

---

### TASK-005: Referral Page — Add Commission Text
**Status:** ✅ Done
**Background:** Referral page cards need updated copy explaining the commission structure.
**Text to add:** *"Receive 5% of the commission earned on every mission completed by a talent you refer throughout their first year."* (Same copy for talent referrals and company referrals)
**UI decision:** Add as a 4th card, OR replace "Track Results" card — discuss with Benoit
**Acceptance Criteria:**
- [ ] Commission explanation text visible on the referral page
- [ ] Applies to both talent referral section and company referral section
**Files:** Find referral page in `app/` — likely `app/user-profile/` or a dedicated referral page

---

## 🟡 BLOCKED

### TASK-006: Messenger — Fix Polling Overload + Complete End-to-End
**Status:** ✅ Done
**Background:** Messenger currently polls every 1 second → "unable to load your request" / "too many requests" errors. End-to-end company ↔ talent conversation needs to be demo-ready by Monday.
**Acceptance Criteria:**
- [ ] Polling interval increased to minimum 3–5 seconds (or implement SSE for true real-time)
- [ ] Error handling: on API failure, retry with exponential backoff — don't spam the server
- [ ] Company can start a conversation with a talent
- [ ] Talent receives the message and can reply
- [ ] Both sides see full conversation thread
- [ ] New message → email notification sent to recipient (via Resend)
- [ ] Messages page does not crash under normal load
**Files:** `app/messages/page.tsx`, `app/api/messenger/route.ts`, `app/lib/email/` (for message email notification)

Validation log (remaining-meeting execution):
- TASK-006a: `pnpm lint && pnpm tsc --noEmit` (lint warnings only; `tsc` fails with existing repo-wide errors outside this task scope)
- TASK-006b: `pnpm lint && pnpm tsc --noEmit` (lint warnings only; same existing repo-wide `tsc` failures)
- TASK-006c: `pnpm lint && pnpm tsc --noEmit` (lint warnings only; same existing repo-wide `tsc` failures)
- TASK-008: `pnpm lint && pnpm tsc --noEmit` (lint warnings only; same existing repo-wide `tsc` failures)
- TASK-009: `pnpm lint && pnpm tsc --noEmit` (lint warnings only; same existing repo-wide `tsc` failures)

---

### TASK-007: Replace Blockchain Section with Video
**Background:** The current blockchain section on the company profile / job page needs the content replaced with a video presentation (Benoit has the video).
**Files:** Find blockchain section in company/job pages — likely `app/companies/` or `app/jobs/`

### TASK-008: Company Profile UI — Match Talent Profile Polish ✅ Done

### TASK-009: QA Process Setup ✅ Done

---

## Innovation Backlog (Benoit's directive — implement after stabilization)

Full feature plans in `docs/features/`:

| Priority | Feature | Doc | Notes |
|---|---|---|---|
| P0 | Smart Job-Talent Match Score | `docs/features/smart-match-score.md` | Gemini AI, cached scores |
| P1 | Talent Availability Calendar | `docs/features/talent-availability-calendar.md` | Status badge + filter |
| P1 | Superbot v2 — Career Coach | `docs/features/superbot-v2-career-coach.md` | Context-aware, persistent history |
| P2 | Company Talent Pipeline (Kanban) | `docs/features/company-talent-pipeline.md` | @dnd-kit already installed |
| P3 | AI Job Description Builder | `docs/features/ai-job-description-builder.md` | Gemini, react-quill |

---

## Codex Pickup Instructions

1. Read `AGENTS.md` + `docs/architecture/overview.md` first
2. Pick the highest priority unchecked task above
3. Read the meeting notes in `docs/meetings/2026-03-06-juhan-benoit.md` for full context
4. Implement → run `pnpm lint && pnpm tsc --noEmit`
5. Update the checklist above with ✅ when done
6. List changed files + known risks here for Claude Code review
