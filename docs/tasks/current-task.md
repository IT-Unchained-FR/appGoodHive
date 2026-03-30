# Current Task

## Status
`STABILIZATION SPRINT — Fix critical bugs before client campaign (March 16, 2026)`

## Last Updated
2026-03-15

## ⚠️ Benoit's Directive (March 12 meeting)
**STOP new features. Make the existing platform work reliably.**
Clients are being onboarded soon. Broken UX = lost talent + lost clients.
See full meeting notes: `docs/meetings/2026-03-12-juhan-benoit.md`

---

## 🔥 STABILIZATION TASKS (do these before anything else)

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
