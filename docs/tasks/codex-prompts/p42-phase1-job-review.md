# Codex Prompt — Plan-42 Phase 1: Job Lifecycle & Admin Review

**Status:** READY
**Branch:** development
**Estimated tasks:** 6 (P42-101 through P42-106)

---

## Your Role

You are Codex, the implementation agent for GoodHive. You write code — you do not plan or architect. Follow these instructions exactly. Do not deviate from scope.

---

## Repository Context

**Project:** GoodHive — AI-powered talent marketplace (Next.js 14 App Router, TypeScript strict, PostgreSQL raw `pg`, Iron Session auth, Tailwind + Framer Motion + Radix UI, Resend email)

**Key files you will need:**
- `app/lib/db.ts` — PostgreSQL pool singleton (import as `import { pool } from '@/app/lib/db'` OR check existing import style in nearby files)
- `app/lib/admin-auth.ts` — `verifyAdminToken(request)` for admin auth
- `app/lib/email/` — Resend email dispatch helpers and templates
- `app/api/admin/jobs/route.ts` — existing admin jobs GET endpoint
- `app/api/jobs/[jobId]/route.ts` — existing job GET endpoint
- `app/jobs/[jobId]/page.tsx` — existing job detail page
- `app/constants/common.ts` — contains `GoodHiveContractEmail` = `benoit@goodhive.io`

**Auth pattern (Iron Session):**
```typescript
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/app/lib/auth/session-options';
import { cookies } from 'next/headers';

const session = await getIronSession(cookies(), sessionOptions);
if (!session.userId) {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
```

**Admin auth pattern:**
```typescript
import { verifyAdminToken } from '@/app/lib/admin-auth';
const admin = await verifyAdminToken(request);
if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

**API response pattern (use for ALL new routes):**
```typescript
return NextResponse.json({ success: true, data: result });
return NextResponse.json({ success: false, error: 'Descriptive message' }, { status: 400 });
```

**Email sender — always use:**
```
GoodHive <no-reply@goodhive.io>
```
Never use a personal address. Admin notification email: `benoit@goodhive.io` (from `GoodHiveContractEmail` constant).

**DB table:** `goodhive.job_offers` — all job queries use this schema.

**After EVERY task:** Run `pnpm lint && pnpm tsc --noEmit`. Fix lint errors. Ignore pre-existing tsc errors but do not introduce new ones.

---

## Absolute Rules

- Work on `development` branch ONLY. Never touch `main`.
- Do NOT rewrite unrelated files.
- Do NOT refactor existing code outside the task scope.
- Do NOT change `budget`, `currency`, `escrow_amount`, `payment_token_address`, `blockchain_job_id`, `block_id` fields — these are blockchain-immutable.
- Keep each task change minimal and reviewable.
- If something is unclear, mark it as `TBD` in a code comment and continue.

---

## Tasks (execute in this exact order)

---

### P42-101 — DB Migration: Add Job Review Status

**File to create:** `app/db/migrations/plan42_01_job_review_status.sql`

```sql
-- Plan-42: Add job review lifecycle status to job_offers
-- review_status values: draft | pending_review | approved | rejected | active | closed

ALTER TABLE goodhive.job_offers
  ADD COLUMN IF NOT EXISTS review_status VARCHAR(32) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS admin_feedback TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- Backfill: existing published jobs = approved, others = draft
UPDATE goodhive.job_offers
SET review_status = CASE
  WHEN published = true THEN 'approved'
  ELSE 'draft'
END
WHERE review_status = 'draft';

CREATE INDEX IF NOT EXISTS idx_job_offers_review_status
  ON goodhive.job_offers(review_status);
```

**Also run this migration against the dev database** (if you have DB access). If not, note it as TBD.

**Acceptance criteria:**
- Migration file exists and is valid SQL
- Uses `IF NOT EXISTS` — fully idempotent
- Backfill logic is correct

---

### P42-102 — Job Submit-for-Review API

**File to create:** `app/api/jobs/[jobId]/submit-review/route.ts`

```typescript
// POST /api/jobs/[jobId]/submit-review
// Auth: Iron Session — must be company role and owner of this job
// Action: Sets review_status = 'pending_review'
// Guards:
//   - Job must currently be review_status = 'draft' OR 'rejected' (can re-submit after rejection)
//   - Session user must be the job's owner (user_id matches)
// After setting status: send email to admin (benoit@goodhive.io) notifying of new submission
// Returns: { success: true, data: { jobId, review_status: 'pending_review' } }
```

**Also update `app/api/jobs/[jobId]/route.ts`:**
- Add a `PATCH` handler (if one doesn't already exist, add it; if it does, extend it)
- PATCH allows company to edit job fields ONLY when `review_status = 'draft'` OR `review_status = 'rejected'`
- When `review_status` is `pending_review` or `approved`, return 403: "Job cannot be edited while under review or approved. Contact admin."
- ALWAYS block editing these fields regardless of status: `budget`, `currency`, `escrow_amount`, `payment_token_address`, `blockchain_job_id`, `block_id`
- Auth: Iron Session, must be job owner

**Acceptance criteria:**
- Company can submit draft/rejected job for review
- Submitting a pending_review or approved job returns 403
- Editing any blockchain field returns 403 always
- Admin receives email on submission

---

### P42-103 — Admin Job Review API

**File to create:** `app/api/admin/jobs/[jobId]/review/route.ts`

```typescript
// POST /api/admin/jobs/[jobId]/review
// Auth: verifyAdminToken
// Body: { action: 'approve' | 'reject', feedback?: string }
// Actions (approve):
//   - review_status = 'approved', published = true, reviewed_at = NOW(), reviewed_by = admin.id (if available)
//   - Send email to company: job approved
// Actions (reject):
//   - review_status = 'rejected', published = false, admin_feedback = feedback, reviewed_at = NOW()
//   - Send email to company: job rejected with feedback
// Returns: { success: true, data: { jobId, review_status, admin_feedback } }
```

**Also update `app/api/admin/jobs/route.ts`** (existing GET endpoint):
- Add `review_status` to the SELECT query so admin UI gets this field
- Add optional `?review_status=pending_review` filter support

**Acceptance criteria:**
- Admin can approve → job becomes published=true, review_status=approved
- Admin can reject with feedback → company can see feedback
- Both actions send appropriate emails
- Existing GET endpoint returns review_status field

---

### P42-104 — Email Templates for Job Review

**Look at existing email templates** in `app/lib/email/` and `app/email-templates/` to understand the current pattern (React email templates or HTML strings). Match the existing style exactly.

**Create these templates** (use whatever format matches existing — React email or HTML):

**Template 1: Job submitted (to admin)**
- Subject: `New job submitted for review: [job title] by [company name]`
- Body: Job title, company name, link to admin panel

**Template 2: Job approved (to company)**
- Subject: `Your job "[job title]" is approved and live!`
- Body: Congratulations, job is now visible to talents, link to job page

**Template 3: Job rejected (to company)**
- Subject: `Your job "[job title]" needs revision`
- Body: Admin feedback text, link to edit job, encouragement to re-submit

**Wire up these templates** in P42-102 (submit) and P42-103 (approve/reject) — wherever email sends happen.

**Acceptance criteria:**
- All 3 templates exist
- Sender is always `GoodHive <no-reply@goodhive.io>`
- Templates wired to correct trigger points

---

### P42-105 — Company: My Jobs Dashboard Page

**Find the existing company dashboard or profile pages** in `app/` (check `app/companies/`, `app/user-profile/`, `app/company-dashboard/` if it exists).

**Create or extend a page at the most logical existing path** for the company's jobs management.
Suggested path: `app/company-dashboard/jobs/page.tsx` — but check if a company dashboard already exists and place it there.

**Page features:**
- Server component that fetches the logged-in company's own jobs
- Show a table/list with columns: Job Title, Review Status (badge), Applications count, Assignments count (0 for now), Posted Date
- Status badge colors: `draft`=gray, `pending_review`=amber/yellow, `approved`=green, `rejected`=red, `active`=blue, `closed`=gray
- Action buttons per row:
  - `draft` or `rejected`: "Edit" button (links to job edit page) + "Submit for Review" button
  - `pending_review`: "Awaiting Review" (disabled, no action)
  - `approved`: "View Live" button
- "Create New Job" button at top (link to existing job creation page)
- Empty state if no jobs: "You haven't posted any jobs yet. Create your first job."

**API needed:** `GET /api/company/jobs` (create this)
- Auth: Iron Session, company role
- Returns: all jobs where user_id = session.userId, with review_status, application count (JOIN job_applications), ordered by created_at DESC

**Acceptance criteria:**
- Company sees all their jobs with correct status
- Submit for Review button calls `POST /api/jobs/[jobId]/submit-review`
- Edit button only shows on draft/rejected
- Page is protected (redirect to login if not authenticated)

---

### P42-106 — Enhance Job Detail Page

**File to update:** `app/jobs/[jobId]/page.tsx`

The API already returns rich data (sections, company info, application count, blockchain fields). The page needs a UI upgrade.

**Add/improve these UI elements:**

1. **Job header section:**
   - Company logo (image) + company name + headline
   - Job title (large, prominent)
   - Location (city, country) with a location pin icon
   - Posted date ("Posted X days ago")
   - Application count badge

2. **Job metadata row** (horizontal badges/tags):
   - Project type badge
   - Job type badge (full-time, part-time, etc.)
   - Engagement type badge
   - Duration
   - Budget with currency (prominent, styled)

3. **Skills section:**
   - Skills rendered as colored tags/chips

4. **Job sections:**
   - Already fetched — render each section with `heading` as H3 and `content` as formatted text (preserve newlines)

5. **Company card** (sidebar or bottom section):
   - Company logo, name, headline, location
   - LinkedIn / Twitter / Website links if available

6. **Role-aware action buttons** (top-right or sticky bottom):
   - Talent (approved) + not already applied: "Apply Now" button
   - Talent already applied: "Applied" badge (disabled)
   - Talent not approved: no apply button
   - Both talent and company approved: "Message Company" button (link to `/messages`)
   - Company who owns this job: "Edit Job" + "Manage Applicants" buttons
   - Admin: "Admin Review" button (link to admin panel for this job)
   - Not logged in: "Sign in to Apply" button

**To determine role:** fetch session client-side via `GET /api/auth/session` or pass from server component.

**Acceptance criteria:**
- Page is significantly more polished and readable
- All job data is visible and well-formatted
- Action buttons are role-aware and never show incorrect options
- Page still works for unauthenticated visitors (public job listing)

---

## After All Tasks Complete

Report back with:

```
## Codex Completion Report — Plan-42 Phase 1

### Changed Files
- [list every file created or modified]

### Tasks Completed
- [x] P42-101 — DB Migration
- [x] P42-102 — Submit for review API
- [x] P42-103 — Admin review API
- [x] P42-104 — Email templates
- [x] P42-105 — Company jobs dashboard
- [x] P42-106 — Job detail page enhancement

### Validation
pnpm lint: [PASS / warnings list]
pnpm tsc --noEmit: [PASS / new errors introduced (list them)]

### TBDs / Assumptions Made
- [list anything you couldn't determine and assumed]

### Known Risks
- [anything that might break existing behavior]
```

Paste this report back to Claude Code for review.
