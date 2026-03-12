# Plan-42: Full Platform Flow — Onboarding to Payout

## Status
`PLANNING`

## Last Updated
2026-03-12

## Owning Architect
Claude Code (Juhan + Benoit direction)

---

## Vision

Make GoodHive a fully functional professional marketplace — on par with Upwork/Fiverr — where:
- Companies onboard smoothly and post reviewed jobs
- Talents apply or get assigned to jobs
- Both sides can message each other when approved
- Missions complete with on-chain payout (Polygon USDC/USDT)
- Full history of work and payments is visible to all parties

**This plan covers everything from first sign-up to final payout. No shortcuts.**

---

## Business Goal

Benoit's directive (March 2026): GoodHive must be launchable and promotable. The full hiring loop — company creates job, talent gets assigned or applies, work happens, payout is made — must be airtight before marketing pushes.

Everything in this plan runs on the `development` branch until QA approval from Benoit + Sharon, then merges to `main`.

---

## Scope Boundary

**In scope (Plan-42):**
- Company onboarding wizard
- Job creation → admin review → approval/rejection
- Job editing (company + admin; blockchain/payment fields locked for both)
- Talent job application polish
- Company assigns talent to a job
- Talent receives + accepts/rejects assignment
- Notification system (nav bell)
- Company + Talent job management dashboards
- Messaging gate (approved users only)
- Job detail page (rich, formatted, all data visible)
- Mission completion flow (both sides confirm)
- On-chain payout via Polygon USDC/USDT (Thirdweb)
- Payout history pages

**Out of scope (future plans):**
- Honey Token integration (token still being built by team)
- Company subscription plan
- Featured talent profiles (paid)
- Dispute resolution beyond admin override
- Mobile app
- WebSocket real-time (still polling for now)

---

## Tech Stack Constraints

- Next.js 14 App Router, TypeScript strict, raw `pg` SQL (no ORM)
- API pattern: `{ success: true, data }` / `{ success: false, error }`
- Auth: Iron Session (read via `getIronSession`)
- Admin auth: `verifyAdminToken` from `app/lib/admin-auth.ts`
- Email: Resend via `app/lib/email/`
- Blockchain: Thirdweb + existing Polygon contracts in `contracts/`
- Notifications: polling (same pattern as messenger)
- Branch: `development` only until Benoit QA

---

## Current State Audit

| Area | Current State | Gap |
|---|---|---|
| Jobs | `job_offers` table, `published` boolean, no review status | No review workflow, no admin approve/reject for jobs |
| Applications | `job_applications` table, `POST /api/applications/submit` | No company-side view, no application management UI |
| Admin jobs | `GET /api/admin/jobs` lists all jobs | No approve/reject API or UI for jobs |
| Notifications | None | Full system needs to be built |
| Assignments | None | Full system needs to be built |
| Messaging gate | None — any user can initiate | Need approval check |
| Job dashboards | None beyond listing | Full CRUD dashboards needed |
| Payouts | Blockchain fields exist on `job_offers` | No completion flow or payout UI |

---

## Database Changes (Full Schema Plan)

### 1. Alter `goodhive.job_offers`

```sql
-- Add review/lifecycle status
ALTER TABLE goodhive.job_offers
  ADD COLUMN IF NOT EXISTS review_status VARCHAR(32) NOT NULL DEFAULT 'draft',
  -- Values: draft | pending_review | approved | rejected | active | closed
  ADD COLUMN IF NOT EXISTS admin_feedback TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID; -- references admin user

-- Existing: published (boolean) stays as-is for backward compat
-- published = true means visible to public; only set when review_status = 'approved'
```

### 2. New Table: `goodhive.notifications`

```sql
CREATE TABLE IF NOT EXISTS goodhive.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                   -- recipient
  type VARCHAR(64) NOT NULL,               -- 'job_approved' | 'job_rejected' | 'assignment_request'
                                           -- | 'assignment_accepted' | 'assignment_rejected'
                                           -- | 'application_received' | 'mission_completed'
                                           -- | 'payout_released' | 'new_message'
  title VARCHAR(255) NOT NULL,
  body TEXT,
  data JSONB,                              -- flexible: { jobId, assignmentId, talentId, ... }
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON goodhive.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON goodhive.notifications(user_id, read);
```

### 3. New Table: `goodhive.job_assignments`

```sql
CREATE TABLE IF NOT EXISTS goodhive.job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES goodhive.job_offers(id) ON DELETE CASCADE,
  talent_user_id UUID NOT NULL,
  company_user_id UUID NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  -- Values: pending | accepted | rejected | active | completed | cancelled
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  company_confirmed_complete BOOLEAN DEFAULT FALSE,
  talent_confirmed_complete BOOLEAN DEFAULT FALSE,
  notes TEXT,                              -- company note when sending assignment
  UNIQUE(job_id, talent_user_id)           -- one active assignment per talent per job
);

CREATE INDEX IF NOT EXISTS idx_job_assignments_job_id ON goodhive.job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_talent ON goodhive.job_assignments(talent_user_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_company ON goodhive.job_assignments(company_user_id);
```

### 4. New Table: `goodhive.payouts`

```sql
CREATE TABLE IF NOT EXISTS goodhive.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES goodhive.job_offers(id),
  assignment_id UUID REFERENCES goodhive.job_assignments(id),
  talent_user_id UUID NOT NULL,
  company_user_id UUID NOT NULL,
  amount NUMERIC(18, 6) NOT NULL,          -- token amount (e.g. USDC has 6 decimals)
  currency VARCHAR(16) NOT NULL,           -- 'USDC' | 'USDT' | 'HONEY'
  token_address VARCHAR(255),              -- ERC-20 contract address on Polygon
  tx_hash VARCHAR(255),                    -- Polygon transaction hash
  chain VARCHAR(32) DEFAULT 'polygon',
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  -- Values: pending | processing | completed | failed | disputed
  platform_fee_pct NUMERIC(5, 2) DEFAULT 5.00,   -- GoodHive's cut (%)
  platform_fee_amount NUMERIC(18, 6),
  net_talent_amount NUMERIC(18, 6),        -- amount after fee
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_payouts_talent ON goodhive.payouts(talent_user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_company ON goodhive.payouts(company_user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_job ON goodhive.payouts(job_id);
```

---

## Phases & Tasks

---

### PHASE 1 — Job Lifecycle & Admin Review (P42-1xx)

**Goal:** Jobs have a proper review workflow. Admin approves/rejects. Company edits within allowed bounds.

---

#### P42-101 — DB Migration: job review status
**File:** `app/db/migrations/plan42_job_review_status.sql`
- Add `review_status`, `admin_feedback`, `reviewed_at`, `reviewed_by` to `goodhive.job_offers`
- Backfill: `UPDATE goodhive.job_offers SET review_status = CASE WHEN published = true THEN 'approved' ELSE 'draft' END`
- Add index on `review_status`

**Acceptance Criteria:**
- Migration runs cleanly on dev DB
- Existing published jobs show `approved`; unpublished show `draft`

---

#### P42-102 — Job Creation: enforce submit-for-review flow
**Files:**
- `app/api/jobs/route.ts` (POST — create job)
- `app/api/jobs/[jobId]/route.ts` (PATCH — edit job)
- Company job creation page (find in `app/` — likely `app/companies/` or `app/user-profile/`)

**Logic:**
- New job created → `review_status = 'draft'`, `published = false`
- Company submits for review → `review_status = 'pending_review'`, send email to admin (Benoit)
- Company can edit `draft` jobs freely; `pending_review` jobs are read-only until admin acts
- Company CANNOT edit: `budget`, `currency`, `escrow_amount`, `payment_token_address`, `blockchain_job_id`, `block_id` once submitted

**Locked fields on PATCH for company:**
```typescript
const COMPANY_LOCKED_FIELDS_AFTER_SUBMIT = [
  'budget', 'currency', 'escrow_amount', 'payment_token_address',
  'blockchain_job_id', 'block_id'
];
// Enforce when review_status !== 'draft'
```

**Email trigger:** Company submits job → Benoit gets `"New job submitted for review: [title] by [company name]"`

**Acceptance Criteria:**
- New jobs default to `draft`
- Submit for review button → sets `pending_review`, sends email
- Edit blocked while `pending_review` or `approved`; only admin can edit approved jobs

---

#### P42-103 — Admin: Job Review API + UI
**Files:**
- `app/api/admin/jobs/[jobId]/review/route.ts` (new — POST)
- `app/admin/jobs/` page (update or create)

**API: `POST /api/admin/jobs/[jobId]/review`**
```typescript
// Body: { action: 'approve' | 'reject', feedback?: string }
// Sets review_status, published (true if approved), admin_feedback, reviewed_at, reviewed_by
```

**Admin UI:**
- Jobs table: add `Review Status` column with colored badge (`draft`=gray, `pending_review`=amber, `approved`=green, `rejected`=red)
- Row click → job detail modal with all fields
- Admin can edit ALL job fields EXCEPT `payment_token_address`, `blockchain_job_id`, `block_id` (blockchain immutable)
- Approve/Reject buttons with optional feedback text input

**Locked fields for admin:**
```typescript
const ADMIN_LOCKED_FIELDS = [
  'payment_token_address', 'blockchain_job_id', 'block_id'
  // These are set by smart contract and are immutable
];
```

**Acceptance Criteria:**
- Admin can approve/reject jobs with feedback
- Approved job → `published = true`, visible on public job listing
- Rejected job → company can edit and re-submit
- Admin cannot modify blockchain fields

---

#### P42-104 — Email Notifications for Job Review Outcomes
**File:** `app/lib/email/` (add new templates)

Templates needed:
- `job-approved.tsx` — to company: "Your job [title] has been approved and is now live!"
- `job-rejected.tsx` — to company: "Your job [title] needs revision. Admin feedback: [feedback]"
- `job-submitted.tsx` — to admin (Benoit): "New job submitted: [title] by [company]"

All emails from: `GoodHive <no-reply@goodhive.io>`

**Acceptance Criteria:**
- Company receives email on approve/reject
- Benoit receives email on new job submission
- Email contains job title, company name, and (if rejected) the admin feedback

---

#### P42-105 — Company Dashboard: My Jobs Page
**File:** `app/company-dashboard/jobs/page.tsx` (new, or extend existing company dashboard)

**Features:**
- List all company's own jobs with status badges
- For each job: title, review_status badge, application count, assignment count, posted date
- Actions per job: Edit (if draft/rejected), View applicants, Manage assignments, Close job
- "Create New Job" CTA button
- "Submit for Review" button visible on draft jobs

**Restricted edit behavior:** Fields locked based on `review_status` (see P42-102)

**Acceptance Criteria:**
- Company sees all their jobs with real-time status
- Edit only possible on draft/rejected jobs (except blocked fields always)
- Applicant count and assignment count visible per job

---

#### P42-106 — Job Detail Page: Rich Formatted Public View
**File:** `app/jobs/[jobId]/page.tsx` (enhance existing)

**Improvements:**
- Display all job sections (already fetched in API — just needs better UI)
- Company card with logo, name, headline, location
- Skills rendered as tags
- Budget displayed clearly with currency
- Project type / engagement type badges
- Application count displayed (existing)
- "Apply Now" button for talents (only if talent is approved)
- "Message Company" button (only if both talent + company approved)
- Match score badge (already built — P42 should integrate it here too)
- Share / copy link button

**For company viewing their own job:**
- "Edit Job" button (respects lock rules)
- "Manage Applicants" link
- Job performance: applicant count, views (TBD — add view count later)

**For admin viewing any job:**
- "Admin: Review Job" action button

**Acceptance Criteria:**
- Job page is beautiful, readable, and shows all relevant info
- Role-aware buttons (Apply / Message / Edit / Admin Review)
- All job sections displayed in order

---

### PHASE 2 — Notification System (P42-2xx)

**Goal:** Users get real-time-ish (polling) notifications for all important platform events. Nav bell shows unread count.

---

#### P42-201 — DB Migration: notifications table
**File:** `app/db/migrations/plan42_notifications.sql`
- Create `goodhive.notifications` table (see schema above)
- Index on `(user_id, read)`

---

#### P42-202 — Notification Service
**File:** `app/lib/notifications.ts` (new)

```typescript
// Server-side helper
export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}): Promise<void>

export type NotificationType =
  | 'job_approved' | 'job_rejected'
  | 'assignment_request' | 'assignment_accepted' | 'assignment_rejected'
  | 'application_received' | 'mission_complete_requested' | 'mission_completed'
  | 'payout_released' | 'new_message';
```

- Called from API routes when events happen
- Inserts into `goodhive.notifications`
- Does NOT replace email — both run in parallel

---

#### P42-203 — Notifications API Routes
**Files:**
- `app/api/notifications/route.ts` — `GET` (list user's notifications, latest 50)
- `app/api/notifications/unread-count/route.ts` — `GET` (just the count, fast poll)
- `app/api/notifications/[id]/read/route.ts` — `PATCH` (mark as read)
- `app/api/notifications/read-all/route.ts` — `POST` (mark all read)

**Auth:** Iron Session — user can only read/modify their own notifications.

---

#### P42-204 — Notification Bell Component
**File:** `app/components/NotificationBell.tsx` (new)

- Polls `GET /api/notifications/unread-count` every 15 seconds (same pattern as messenger unread badge)
- Shows red badge with count when unread > 0
- Click opens `NotificationPanel` (P42-205)
- Shows in main nav alongside existing messenger unread badge

---

#### P42-205 — Notification Panel
**File:** `app/components/NotificationPanel.tsx` (new)

- Dropdown/slide-in panel listing latest 20 notifications
- Each notification: icon (by type), title, body snippet, time ago, unread dot
- Click notification → navigate to relevant page (job, assignment, message thread)
- "Mark all as read" button
- "View all" link → `/notifications` page (full history)
- Uses Framer Motion for animation (consistent with rest of app)

---

### PHASE 3 — Talent Assignment System (P42-3xx)

**Goal:** Companies can proactively assign talents to jobs. Talents receive notification + can accept/reject.

---

#### P42-301 — DB Migration: job_assignments table
**File:** `app/db/migrations/plan42_job_assignments.sql`
- Create `goodhive.job_assignments` (see schema above)

---

#### P42-302 — Assignment API: Company Assigns Talent
**File:** `app/api/jobs/[jobId]/assignments/route.ts` (new)

**`POST /api/jobs/[jobId]/assignments`**
```typescript
// Auth: Iron Session — must be company role + owner of this job
// Body: { talentUserId: string, notes?: string }
// Guards:
//   - Job must be review_status = 'approved'
//   - Talent must be approved (status = 'approved' in goodhive.talents)
//   - Company must be approved
//   - No duplicate assignment (unique constraint handles this)
// Actions:
//   - Insert into job_assignments (status = 'pending')
//   - createNotification for talent (type: 'assignment_request')
//   - Send email to talent
// Returns: { success: true, data: { assignmentId } }
```

**`GET /api/jobs/[jobId]/assignments`**
- Auth: company owner of job, OR admin
- Returns list of assignments for this job with talent data

---

#### P42-303 — Assignment API: Talent Responds
**File:** `app/api/assignments/[assignmentId]/route.ts` (new)

**`PATCH /api/assignments/[assignmentId]`**
```typescript
// Auth: Iron Session — must be the talent in this assignment
// Body: { action: 'accept' | 'reject' }
// Actions (accept):
//   - status = 'active', responded_at = NOW()
//   - createNotification for company (type: 'assignment_accepted')
//   - Send email to company
// Actions (reject):
//   - status = 'rejected', responded_at = NOW()
//   - createNotification for company (type: 'assignment_rejected')
// Returns: { success: true, data: { assignment } }
```

**`GET /api/assignments/[assignmentId]`**
- Auth: talent or company involved in this assignment, or admin
- Returns full assignment detail with job + talent + company info

---

#### P42-304 — Company: Assign Talent UI in Job Dashboard
**File:** `app/company-dashboard/jobs/[jobId]/page.tsx` (new or extend)

**Job Detail Dashboard (company view):**
- Job info summary at top
- Tabs: "Applicants" | "Assignments" | "Job Details"
- **Assignments tab:**
  - List existing assignments with status badges
  - "Assign a Talent" search input — searches `GET /api/talents` for approved talents
  - Talent search results shown as cards with Match Score badge
  - Click talent → modal with talent preview + optional note → "Send Assignment Request" button
  - Calls `POST /api/jobs/[jobId]/assignments`

**Acceptance Criteria:**
- Company can search approved talents and send assignment
- Duplicate assignment attempt shows error
- Pending/accepted/rejected assignments all visible with status

---

#### P42-305 — Talent: Assignment Notification + Accept/Reject UI
**Files:**
- Notification panel (P42-205) handles the initial notification
- `app/talent-dashboard/assignments/page.tsx` (new)

**Talent Assignment Dashboard:**
- List all assignment requests with job info, company info, status, notes
- Status: `pending` (action buttons) | `accepted` | `rejected` | `active` | `completed`
- Accept/Reject buttons for `pending` assignments
- Accepted assignments show "Active Mission" badge
- Link to job detail page and to message company

**Acceptance Criteria:**
- Talent sees all assignment requests clearly
- Accept/reject updates status immediately (optimistic UI)
- Notification bell showed assignment request (P42-204/205)

---

#### P42-306 — Email: Assignment Request to Talent
**File:** `app/lib/email/` (add template)

- Template: `assignment-request.tsx` — to talent: "You've been assigned to [job title] by [company name]. Log in to review and accept."
- Template: `assignment-accepted.tsx` — to company: "[talent name] accepted your assignment for [job title]"
- Template: `assignment-rejected.tsx` — to company: "[talent name] declined your assignment for [job title]"

---

### PHASE 4 — Job Management Dashboards & Messaging Gate (P42-4xx)

**Goal:** Both sides have clean dashboards for managing their work. Messaging is gated by approval status.

---

#### P42-401 — Company Job Management Dashboard (Main)
**File:** `app/company-dashboard/page.tsx` or `app/company-dashboard/jobs/page.tsx`

**Dashboard cards/stats:**
- Total jobs posted
- Jobs pending review / approved / active
- Total applicants across all jobs
- Active missions (accepted assignments)

**Jobs table:**
- Columns: Title, Status, Applications, Assignments, Posted Date, Actions
- Filter by: review_status, date range
- Row actions: View, Edit, Manage Applicants, Manage Assignments, Close Job, Delete (draft only)

**Acceptance Criteria:**
- Full CRUD for company's own jobs
- Stats visible at a glance
- Proper status-gated edit/action buttons

---

#### P42-402 — Talent Dashboard: Applications + Missions
**File:** `app/talent-dashboard/page.tsx` or extend `app/user-profile/`

**Dashboard sections:**
- **My Applications:** Job title, company, applied date, application status (new/reviewed/accepted/rejected)
- **My Assignments:** Job title, company, assignment status, notes, accept/reject buttons (if pending)
- **Active Missions:** Accepted assignments in progress with mission completion button
- **Completed Missions:** History of completed work with payout status

**Acceptance Criteria:**
- Talent sees full picture of their job activity
- Clear separation between applied and assigned jobs
- Completion request visible when both parties confirm

---

#### P42-403 — Messaging Gate: Approval Check
**Files:**
- `app/api/messenger/route.ts` (modify — add approval gate)
- `app/api/messenger/threads/route.ts` (modify — add approval gate)

**Logic:**
```typescript
// Before allowing message initiation (new thread creation):
// 1. Fetch both parties' approval status
// 2. If sender is company: check companies.status = 'approved'
//    If sender is talent: check talents.status = 'approved' (or published/active)
// 3. If receiver is company: check companies.status = 'approved'
//    If receiver is talent: check talents.status = 'approved'
// 4. If either party not approved → return 403 with clear error message

const canMessage = senderApproved && recipientApproved;
```

- Existing message threads between users who were approved and then unapproved → still accessible (don't break history)
- Only creating NEW threads is gated

**Frontend:**
- "Message" button on talent/company profiles → show friendly error if not approved: "Messaging is available once both parties are approved on GoodHive."

**Acceptance Criteria:**
- Unapproved user cannot initiate new conversation
- Existing threads remain accessible
- Clear UI feedback when messaging is blocked

---

#### P42-404 — Application Management: Company Views Applicants
**File:** `app/api/applications/[jobId]/route.ts` (check/enhance existing)
**File:** `app/company-dashboard/jobs/[jobId]/applicants/page.tsx` (new)

**Company applicants view:**
- List of all applicants for a specific job
- Each applicant: name, profile photo, skills, match score badge, cover letter snippet, applied date, status
- Status: `new` | `reviewed` | `shortlisted` | `rejected`
- Actions: View full profile, Message talent, Assign to job, Update status
- Filter by status

**API additions:**
- `PATCH /api/applications/[jobId]/[applicationId]` — update status (company or admin)
- Guard: company can only update applications for their own jobs

**Acceptance Criteria:**
- Company sees all applicants clearly
- Can shortlist, reject, or directly assign an applicant
- Match score badge visible (integrates with MATCH-xxx from Smart Match feature)

---

### PHASE 5 — Mission Completion & Payout (P42-5xx)

**Goal:** After work is done, both parties confirm completion. On-chain payout is triggered via Polygon USDC/USDT. Full history preserved.

---

#### P42-501 — DB Migration: payouts table
**File:** `app/db/migrations/plan42_payouts.sql`
- Create `goodhive.payouts` (see schema above)

---

#### P42-502 — Mission Completion Flow
**Files:**
- `app/api/assignments/[assignmentId]/complete/route.ts` (new — POST)
- UI in both company job dashboard and talent dashboard

**Completion Logic (dual-confirmation):**
```
Company clicks "Mark Work Complete"
  → company_confirmed_complete = true
  → Notify talent: "Company marked job [title] as complete. Please confirm."

Talent clicks "Confirm Completion"
  → talent_confirmed_complete = true
  → assignment.status = 'completed', completed_at = NOW()
  → Trigger payout flow (P42-503)
  → Notify both: "Mission complete! Payout is being processed."

If talent disputes (clicks "Dispute"):
  → Notify admin
  → Assignment remains 'active', flag for admin review
```

**Acceptance Criteria:**
- Both parties must confirm before payout triggers
- Admin notified on dispute
- Completion timestamps recorded
- Notifications sent at each step

---

#### P42-503 — On-Chain Payout via Polygon USDC
**File:** `app/lib/payout.ts` (new — server-side)
**File:** `app/api/payouts/trigger/route.ts` (new)

**Payout Flow:**
```typescript
// 1. Validate: assignment.status = 'completed', no existing payout
// 2. Calculate amounts:
//    platform_fee = amount * (platform_fee_pct / 100)  // default 5%
//    net_talent = amount - platform_fee
// 3. Insert payout record (status = 'processing')
// 4. Call Thirdweb contract to transfer USDC/USDT:
//    - Use existing contract infrastructure in app/lib/contracts/
//    - Transfer net_talent to talent's wallet_address
//    - Transfer platform_fee to GoodHive treasury wallet
// 5. Record tx_hash, status = 'completed'
// 6. createNotification for talent: 'payout_released'
// 7. Send email: payout confirmation to talent + company
```

**Critical constraint:** This API is admin-triggered or contract-triggered only — NOT directly callable by talent/company. Prevents fraud.

**Wallet requirement:** Talent must have `wallet_address` set on their profile before assignment can complete. Enforce this check at assignment acceptance (P42-303).

**Acceptance Criteria:**
- Payout only triggers after dual-confirmation
- Platform fee (5%) is deducted correctly
- Polygon transaction hash recorded
- Both parties notified with amount + tx hash

---

#### P42-504 — Payout History Pages
**Files:**
- `app/talent-dashboard/payouts/page.tsx` (new)
- `app/company-dashboard/payouts/page.tsx` (new)
- `app/admin/payouts/page.tsx` (new)

**Talent payout history:**
- Table: Job title, Company, Amount (net), Currency, Date, Status, Tx Hash (link to PolygonScan)
- Summary: total earned, total active missions

**Company payout history:**
- Table: Job title, Talent, Gross Amount, Fee, Net, Currency, Date, Status, Tx Hash
- Summary: total paid out, total active missions

**Admin payout oversight:**
- All payouts with filters: status, date, currency, amount range
- Dispute resolution: admin can override `status` on any payout
- Manual trigger for stuck `processing` payouts

**Acceptance Criteria:**
- Each party sees only their relevant payout data
- Tx hash links to PolygonScan for verification
- Admin sees all data with full controls

---

#### P42-505 — Email Templates: Payout Confirmation
**File:** `app/lib/email/`

- `payout-talent.tsx` — to talent: "You received [amount] [currency] for completing [job title]! Tx: [hash]"
- `payout-company.tsx` — to company: "Payout of [amount] [currency] processed for [job title]. Platform fee: [fee]."

---

## Implementation Order (Recommended for Codex)

Execute phases strictly in order — each phase depends on the previous.

| Priority | Task | Why First |
|---|---|---|
| 1 | P42-101 | DB migrations are always first |
| 2 | P42-102 | Job creation flow change — core |
| 3 | P42-103 | Admin review — needed before jobs go live |
| 4 | P42-104 | Email triggers — complete the review loop |
| 5 | P42-105 | Company dashboard — they need to manage jobs |
| 6 | P42-106 | Job detail page — public face |
| 7 | P42-201 | Notifications DB migration |
| 8 | P42-202/203 | Notification service + API |
| 9 | P42-204/205 | Notification bell + panel (nav) |
| 10 | P42-301 | Assignments DB migration |
| 11 | P42-302/303 | Assignment APIs |
| 12 | P42-304/305 | Assignment UIs (company + talent) |
| 13 | P42-306 | Assignment emails |
| 14 | P42-401/402 | Full dashboards (company + talent) |
| 15 | P42-403 | Messaging gate |
| 16 | P42-404 | Applicant management |
| 17 | P42-501 | Payouts DB migration |
| 18 | P42-502 | Mission completion flow |
| 19 | P42-503 | On-chain payout logic |
| 20 | P42-504/505 | Payout history + emails |

---

## API Surface Summary

| Method | Path | Who | Description |
|---|---|---|---|
| POST | `/api/jobs` | Company | Create job (draft) |
| PATCH | `/api/jobs/[jobId]` | Company / Admin | Edit job (field locks enforced) |
| POST | `/api/jobs/[jobId]/submit-review` | Company | Submit job for admin review |
| POST | `/api/admin/jobs/[jobId]/review` | Admin | Approve or reject job |
| GET | `/api/notifications` | Any auth user | List notifications |
| GET | `/api/notifications/unread-count` | Any auth user | Fast poll unread count |
| PATCH | `/api/notifications/[id]/read` | Any auth user | Mark notification read |
| POST | `/api/notifications/read-all` | Any auth user | Mark all read |
| POST | `/api/jobs/[jobId]/assignments` | Company | Assign talent to job |
| GET | `/api/jobs/[jobId]/assignments` | Company / Admin | List assignments for job |
| GET | `/api/assignments/[assignmentId]` | Talent/Company/Admin | Get assignment detail |
| PATCH | `/api/assignments/[assignmentId]` | Talent | Accept or reject assignment |
| POST | `/api/assignments/[assignmentId]/complete` | Company or Talent | Confirm mission completion |
| GET | `/api/payouts` | Auth user | List own payouts |
| POST | `/api/payouts/trigger` | Admin / contract | Trigger on-chain payout |
| PATCH | `/api/applications/[jobId]/[applicationId]` | Company / Admin | Update application status |

---

## Role-Based Access Matrix

| Action | Talent | Company | Admin |
|---|---|---|---|
| Create job | ✗ | ✓ | ✓ |
| Edit job (non-blockchain) | ✗ | ✓ (draft/rejected only) | ✓ (all) |
| Edit blockchain fields | ✗ | ✗ | ✗ (immutable) |
| Submit job for review | ✗ | ✓ | ✓ |
| Approve/reject job | ✗ | ✗ | ✓ |
| Apply to job | ✓ (approved only) | ✗ | ✗ |
| Assign talent to job | ✗ | ✓ (approved only) | ✓ |
| Accept/reject assignment | ✓ (their own) | ✗ | ✗ |
| Confirm mission complete | ✓ | ✓ | ✓ |
| Trigger payout | ✗ | ✗ | ✓ |
| View payout history | ✓ (own) | ✓ (own) | ✓ (all) |
| Message (initiate) | ✓ (approved only) | ✓ (approved only) | ✓ |

---

## Migration Files (Create in Order)

1. `app/db/migrations/plan42_01_job_review_status.sql`
2. `app/db/migrations/plan42_02_notifications.sql`
3. `app/db/migrations/plan42_03_job_assignments.sql`
4. `app/db/migrations/plan42_04_payouts.sql`

All migrations must be idempotent (`IF NOT EXISTS`, `IF NOT EXISTS` for columns).

---

## New Files to Create

```
app/
├── db/migrations/
│   ├── plan42_01_job_review_status.sql
│   ├── plan42_02_notifications.sql
│   ├── plan42_03_job_assignments.sql
│   └── plan42_04_payouts.sql
├── lib/
│   ├── notifications.ts              (notification service)
│   └── payout.ts                     (payout logic + Thirdweb integration)
├── api/
│   ├── jobs/[jobId]/
│   │   ├── submit-review/route.ts
│   │   └── assignments/route.ts
│   ├── admin/jobs/[jobId]/
│   │   └── review/route.ts
│   ├── notifications/
│   │   ├── route.ts
│   │   ├── unread-count/route.ts
│   │   ├── [id]/read/route.ts
│   │   └── read-all/route.ts
│   ├── assignments/
│   │   └── [assignmentId]/
│   │       ├── route.ts
│   │       └── complete/route.ts
│   └── payouts/
│       ├── route.ts
│       └── trigger/route.ts
├── components/
│   ├── NotificationBell.tsx
│   └── NotificationPanel.tsx
└── (dashboard pages — exact paths TBD based on existing routing)
    ├── company-dashboard/ (or extend existing company pages)
    │   ├── jobs/page.tsx
    │   ├── jobs/[jobId]/page.tsx
    │   ├── jobs/[jobId]/applicants/page.tsx
    │   └── payouts/page.tsx
    └── talent-dashboard/ (or extend app/user-profile/)
        ├── assignments/page.tsx
        ├── applications/page.tsx
        └── payouts/page.tsx
```

---

## Files to Modify

| File | Change |
|---|---|
| `app/api/jobs/[jobId]/route.ts` | Add PATCH handler with field lock logic |
| `app/api/admin/jobs/route.ts` | Extend with review_status filter |
| `app/api/applications/submit/route.ts` | Add approval check for talent + gate |
| `app/api/messenger/route.ts` | Add approval gate on new thread creation |
| `app/api/messenger/threads/route.ts` | Add approval gate |
| `app/components/` nav | Add `NotificationBell` component |
| `app/jobs/[jobId]/page.tsx` | Rich formatted job detail (role-aware) |
| `middleware.ts` | Protect new dashboard routes |

---

## Email Templates to Add

| Template | Trigger | Recipients |
|---|---|---|
| `job-submitted.tsx` | Company submits job for review | Admin (Benoit) |
| `job-approved.tsx` | Admin approves job | Company |
| `job-rejected.tsx` | Admin rejects job | Company |
| `assignment-request.tsx` | Company assigns talent | Talent |
| `assignment-accepted.tsx` | Talent accepts assignment | Company |
| `assignment-rejected.tsx` | Talent rejects assignment | Company |
| `mission-complete-request.tsx` | Company marks complete | Talent |
| `mission-confirmed.tsx` | Both confirmed | Company + Talent |
| `payout-talent.tsx` | Payout released | Talent |
| `payout-company.tsx` | Payout released | Company |

---

## Non-Functional Requirements

- **Performance:** Notification bell polls every 15s (same as messenger badge). No new WebSocket infrastructure.
- **Security:** All APIs validate session + role. Company can only manage their own jobs. Talent can only manage their own assignments/applications. Blockchain payment fields are immutable — enforced server-side.
- **Backward compatibility:** `published` column on `job_offers` kept as-is. `review_status` is additive. No destructive schema changes.
- **Error handling:** All API routes use `{ success: false, error: string }` pattern. Frontend shows toast notifications on errors.
- **Wallet requirement:** Talent must have `wallet_address` on profile before accepting an assignment that will result in on-chain payout. Enforce at P42-303.

---

## Open Questions / TBDs

| Question | Owner | Priority |
|---|---|---|
| Should companies be able to have multiple active assignments per job (team missions)? | Benoit | High — affects schema |
| What is GoodHive's exact platform fee %? (Currently defaulting to 5%) | Benoit | High — affects payout |
| Which wallet address receives the platform fee? GoodHive treasury address? | Benoit | High — required for P42-503 |
| Should talents be able to withdraw their application? | Benoit | Medium |
| Should companies get a soft limit on open jobs (e.g. max 5 without subscription)? | Benoit | Low |
| Dispute window: how many days after mission complete can a dispute be raised? | Benoit | Medium |

---

## Validation Commands (for Codex after each task)

```bash
pnpm lint
pnpm tsc --noEmit
# Note: tsc has existing repo-wide errors — only fail if NEW errors introduced
```

---

## Review Checklist (for Claude Code before any merge)

- [ ] All P42-1xx tasks complete and tested
- [ ] All P42-2xx tasks complete and tested
- [ ] All P42-3xx tasks complete and tested
- [ ] All P42-4xx tasks complete and tested
- [ ] All P42-5xx tasks complete and tested
- [ ] DB migrations are all idempotent and run cleanly on dev DB
- [ ] Role access matrix enforced server-side (not just UI)
- [ ] Blockchain fields immutable at API level
- [ ] Email sends confirmed working on preview
- [ ] Notification bell working with correct unread counts
- [ ] Messaging gate prevents unapproved users from initiating chat
- [ ] Payout amounts and fees calculated correctly
- [ ] Polygon tx hashes recorded and linked to PolygonScan
- [ ] All new pages behind `middleware.ts` auth protection
- [ ] Benoit QA sign-off on preview.goodhive.io before merge to main

---

## Codex Pickup Instructions

1. Read `AGENTS.md` + `docs/architecture/overview.md` first
2. Read this file top to bottom — understand the full scope
3. Work strictly in **phase order** — do not skip ahead
4. For each task:
   - Complete it fully
   - Run `pnpm lint && pnpm tsc --noEmit`
   - Check off the task in the "Implementation Order" table
   - Report changed files + any risks to Claude Code for review
5. All work on `development` branch only — never commit to `main`
6. Use `GoodHive <no-reply@goodhive.io>` as email sender always
7. Use `{ success: true, data }` / `{ success: false, error }` API pattern
8. Reference `app/lib/db.ts` pool for all DB calls
9. Reference `app/lib/admin-auth.ts` for admin auth checks
10. Reference `getIronSession` from `iron-session` for user auth checks
