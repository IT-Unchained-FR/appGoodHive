# Feature: Company Onboarding Guidance & Polish

## Status
`IN REVIEW`

Branch: `feat/company-guidance-and-polish`

## Business Goal
Companies were dropping off between "create a job" and "job is live". The path has
two waits on the GoodHive team (profile review, job review) and two wallet steps
(publish on-chain, fund escrow), and nothing on the dashboard said which step they
were on or who they were waiting for. This feature makes the path explicit, tells
companies how long reviews take, and replaces raw browser `confirm()` pop-ups on
destructive and payment actions with clear, specific dialogs.

## User Story
> As a company, I want to see exactly which step I'm on and what happens next, so
> that I get my first job live without guessing or emailing support.

## What's Already Built (uncommitted on the branch)
- **Getting-started checklist** on `/companies/dashboard`: 7 steps
  (profile → approved → create job → job approved → publish → fund → live), each
  derived from DB state, with a single CTA on the current step and a "with the
  GoodHive team" note while waiting on review.
  - `lib/jobs/company-onboarding.ts` — `getCompanyOnboardingProgress(userId)`
  - `app/api/companies/onboarding-progress/route.ts` — session-auth GET
  - `app/components/company-onboarding/GettingStartedChecklist.tsx`
  - The client also reads on-chain escrow balance for the "funded but activation
    failed" gap the DB can't see.
- **Deep link** `/companies/dashboard/jobs?activate=<jobId>` opens the
  publish-and-fund modal for an approved job.
- **Review turnaround copy**: `REVIEW_TURNAROUND` in `lib/jobs/review.ts`, used on
  the job form, My Jobs, checklist and submit toast.
- **Dashboard**: "Database Funding" card → "Live Jobs" (`liveJobs` added to
  `dashboard-stats`); old welcome banner and static tips removed.
- **`useConfirm()` dialog** (`app/components/ConfirmDialog/ConfirmDialog.tsx`)
  replacing `window.confirm` in JobForm (delete job), JobsManagementClient (close
  job), AssignTalentModal (payout, with amount summary), job-section-editor
  (delete section), PipelineBoard (remove talent).

Validated so far: `pnpm tsc --noEmit` clean; `next lint` clean on all 13 files
(one pre-existing `<img>` warning in AssignTalentModal).

## Remaining Work

### Task 1 — Company approval / rejection emails (BLOCKER) — ✅ DONE 2026-09-25
The checklist tells companies "We'll email you when it's done" on the profile
review step, but no company approval or rejection email exists. Job review
already emails (`app/api/admin/jobs/[jobId]/review/route.ts`).

- New `lib/email/company-review.ts` exporting `sendCompanyApprovedEmail` and
  `sendCompanyRejectedEmail`. Follow the `lib/email/job-review.ts` pattern
  (Resend + React template, `getRecipient` dev/TEST_EMAIL guard, `[TEST]` subject
  prefix in dev). Consider extracting `getRecipient`/`sendEmail` from
  `job-review.ts` into a shared helper rather than copying it.
- New templates `app/email-templates/company-approved.tsx` and
  `company-rejected.tsx`, modelled on `job-approved.tsx` / `job-rejected.tsx`.
  - Approved: "Your company is approved — create your first job", CTA →
    `/companies/create-job`.
  - Rejected: include reason if provided, CTA → `/companies/my-profile`.
- Recipient: `goodhive.companies.email`, falling back to `goodhive.users.email`.
  Skip silently (log) if neither exists.
- Call sites (email failure must **never** fail the approval — try/catch + log,
  same as the job review route):
  | Route | Trigger |
  |---|---|
  | `app/api/admin/companies/pending/route.ts` POST | single approve (ApprovalPopup) |
  | `app/api/admin/companies/bulk-approve/route.ts` | bulk approve |
  | `app/api/admin/companies/bulk-reject/route.ts` | bulk reject; pass `rejectionReason` (currently validated but dropped) |
  | `app/api/admin/companies/[userId]/route.ts` PUT | only when `approved` flips false → true. Read the previous value before the UPDATE; this route is also a general edit form and must not re-email on every save |
- Bulk routes: `SELECT user_id, designation, email` for the ids after the UPDATE,
  then send with `Promise.allSettled` in chunks (≤10 concurrent) so one bad
  address doesn't stop the rest.

### Task 2 — Harden `pending/route.ts` (small) — ✅ DONE 2026-09-25
`middleware.ts` already verifies the admin JWT for all `/api/admin/*`, so this is
not exposed. But unlike the bulk routes, this route never checks
`role === "admin"` and doesn't validate `userId`. Add the same
`verifyAdminToken` role check the bulk routes use and a 400 on missing/invalid
`userId`, since Task 1 makes this route send email.

### Task 3 — Checklist edge cases — ✅ DONE 2026-09-25 (role check dropped, see below)
- `lib/jobs/company-onboarding.ts` `jobStage()`: a job with
  `review_status = 'closed'` **and** a `block_id` was live before it was closed —
  return 4, not 3. Today a company whose only job was closed sees the checklist
  go back to "Fund the job", and the CTA can't open the modal (it only opens for
  `approved`).
- `JobsManagementClient.tsx`: after the `activate` effect opens the modal, strip
  `?activate=` with `router.replace(pathname, { scroll: false })` (keep `jobId`
  if present) so a later reload doesn't depend on job state to not re-open.
- ~~`app/api/companies/onboarding-progress/route.ts`: return 403 for non-company
  users.~~ **Dropped.** There's no company role on the session; "is a company"
  means "has a `goodhive.companies` row", and a brand-new company has none until
  they submit their profile. A 403 would hide step 1 from exactly the users who
  need it. The route only ever reads the caller's own data, so nothing leaks.
- `GettingStartedChecklist.tsx`: remove the unused `data-tour="getting-started"`
  attribute (no tour references it).

### Task 4 — Remaining `window.confirm` calls — ✅ DONE 2026-09-25
Swap to `useConfirm()`:
- `app/talents/my-assignments/page.tsx:61` — request mission completion (the
  talent's half of the payout flow; highest value of these)
- `app/talents/career-coach/page.tsx:147` — clear conversation (`tone: "danger"`)
- `app/admin/knowledge-base/page.tsx:137`, `app/admin/talent/[user_id]/CvAdminManager.tsx:98`,
  `app/components/admin/EnhancedTable.tsx:464` — admin; lowest priority, can be
  split out.

### Task 5 — Docs — ✅ DONE 2026-09-25
- Mark this doc `IN REVIEW` when Tasks 1–3 land.
- Add a handoff entry to `docs/tasks/current-task.md`.

### As built (Tasks 1–3)
- `lib/email/resend-sender.ts` — new; `sendEmail` + `GOODHIVE_BASE_URL` moved out
  of `lib/email/job-review.ts` (no behavior change) so both modules share them.
- `lib/email/company-review.ts` — `notifyCompanyReviewOutcome({ userIds, outcome, reason })`.
  Looks up `companies.designation` + `COALESCE(companies.email, users.email)`,
  sends in chunks of 10 with `Promise.allSettled`, never throws.
- `app/email-templates/company-approved.tsx`, `company-rejected.tsx` — new.
- `pending/route.ts` POST — admin role check (401), UUID `userId` check (400),
  404 if no company, emails only if the company wasn't already approved.
- `bulk-approve` — emails only the ids that weren't already approved.
- `bulk-reject` — emails all ids. **Bug found and fixed:** the admin UI sends the
  reason as `reason` (default placeholder "Rejected by admin"), but the route
  only read `rejectionReason`, so every reason was silently dropped. The route
  now accepts either and never emails the placeholder. Still not stored in the DB.
- `[userId]` PUT — reads `approved` before the UPDATE; emails only on false → true.
- `jobStage()` — `closed` + on-chain → stage 4.
- `JobsManagementClient` — strips `?activate=` with `window.history.replaceState`
  (Next 14.2 syncs it with the router), not `router.replace`, which would refetch
  the server page and reset the jobs list while the modal is open.
- Checklist — `data-tour` attribute removed.

Fixed (pre-existing): `[userId]` PUT wrote `approved = body.approved || false`,
so a PUT without `approved` un-approved the company. Now
`COALESCE(<value>::boolean, approved)` (same for `published`), so an omitted
field keeps its current value and explicit true/false behave as before. The
other profile fields in that UPDATE still write `|| null` on omit; both callers
send the full object, so that's left as is.

### As built (Task 4)
No `window.confirm` remains in `app/`, `lib/` or `components/`. Swapped to
`useConfirm()`:
- `app/talents/my-assignments/page.tsx` — request mission completion (default tone)
- `app/talents/career-coach/page.tsx` — clear history (danger)
- `app/admin/knowledge-base/page.tsx` — delete file (danger)
- `app/admin/talent/[user_id]/CvAdminManager.tsx` — delete CV (danger; warns
  when the talent is approved)
- `app/components/admin/EnhancedTable.tsx` — bulk actions with
  `requiresConfirmation`; danger tone when the action's `variant` is `destructive`.
  This is shared by every admin table, so every confirmed bulk action picks it up.

## Acceptance Criteria
1. Approving a company (single, bulk, or via the edit form flipping to approved)
   sends exactly one approval email; editing an already-approved company sends none.
2. Rejecting companies in bulk sends a rejection email including the reason when given.
3. An email send failure is logged and the approval/rejection still succeeds.
4. In dev without `TEST_EMAIL`, no email is sent and nothing errors.
5. `pending` POST rejects non-admin tokens and missing `userId`.
6. A company whose only job is closed-after-live sees the checklist as complete.
7. Opening `/companies/dashboard/jobs?activate=<id>` opens the modal once and the
   URL no longer contains `activate`.
8. ~~A non-company session gets 403 from `/api/companies/onboarding-progress`.~~ (dropped, see Task 3)
9. Every existing checklist and confirm-dialog behavior still works (see test steps).

## Out of Scope
- Mirroring escrow balance into the DB (checklist keeps reading it on-chain).
- Storing company rejection reasons in the DB (email only for now).
- Changing the review turnaround value itself (`REVIEW_TURNAROUND` stays
  "1–2 business days" until Benoit confirms otherwise).
- A guided tour for the dashboard.

## Impacted Files / Modules
- `lib/email/company-review.ts` — new
- `app/email-templates/company-approved.tsx`, `company-rejected.tsx` — new
- `app/api/admin/companies/pending/route.ts`, `bulk-approve/route.ts`,
  `bulk-reject/route.ts`, `[userId]/route.ts` — email + auth hardening
- `lib/jobs/company-onboarding.ts` — `jobStage()` closed case
- `app/companies/dashboard/jobs/JobsManagementClient.tsx` — strip `activate`
- `app/api/companies/onboarding-progress/route.ts` — role check
- `app/components/company-onboarding/GettingStartedChecklist.tsx` — drop attr
- Task 4 files (optional)

## API Changes
| Method | Path | Description |
|---|---|---|
| GET | `/api/companies/onboarding-progress` | New (already built). Adds 403 for non-company users. |
| GET | `/api/companies/dashboard-stats` | Adds `overview.liveJobs`, `recentJobs[].reviewStatus` (already built). |
| POST | `/api/admin/companies/pending` | Adds role check + `userId` validation; sends approval email. |
| POST | `/api/admin/companies/bulk-approve` / `bulk-reject` | Now send emails. |
| PUT | `/api/admin/companies/[userId]` | Sends approval email on false → true only. |

## DB Changes
- None. No migration.

## AI / External Service Changes
- Resend: new company approved/rejected emails. Uses existing `RESEND_API_KEY`,
  `TEST_EMAIL`, `GOODHIVE_BASE_URL`. No new env vars.

## Validation Commands
```bash
pnpm tsc --noEmit
npx next lint --file <each touched file>
```

Manual test steps (run by the user):
1. New company → checklist shows step 1 "Open profile"; after submitting, step 2
   shows the blue "with the GoodHive team" note.
2. Admin approves it (try single, bulk, and edit form) → one email each to
   `TEST_EMAIL`; save the edit form again → no second email.
3. Admin bulk-rejects with a reason → rejection email includes the reason.
4. Job in review → checklist step 4 note; My Jobs shows the amber "In review" box.
5. Approved job → checklist "Publish" → My Jobs opens the publish modal, URL loses `activate`.
6. Close a live job that is the company's only job → checklist stays complete.
7. Delete job / close job / remove pipeline talent / delete section → new dialog;
   Cancel, Esc and clicking outside all back out.
   - Pay talent: not fully tested for now (per user, 2026-09-25). At most, open the
     dialog and press Cancel; don't send a real payout.

## Open Questions / TBDs
- TBD: Is "1–2 business days" the real review turnaround? (Benoit)
- TBD: Should the company approval email include a referral link like the talent
  approval email does?

## Review Checklist
- [ ] Acceptance criteria met
- [ ] No unrelated files changed
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Docs updated
