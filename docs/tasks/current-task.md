# Current Task

## Status
`IN PROGRESS — Plan-42 Full Platform Flow + Innovation Backlog (March 12, 2026)`

## Last Updated
2026-03-12

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
