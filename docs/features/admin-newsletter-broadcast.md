# Feature: Admin Newsletter Broadcast

## Status
`IN REVIEW` — built, typechecked, linted, visually verified in dev, and migration applied to `goodhive-prod` (2026-08-18).

## Business Goal
Benoit currently has no way to email GoodHive's talent and company base directly from the platform — announcements go out manually/ad hoc. This gives admins a way to select a segment of users (talents, companies, both, or Code of the Hive signatories) straight from the admin panel and send them a branded newsletter, with a send history for accountability.

## User Story
> As an **Admin**, I want to filter the user base by type (talent / company / both / Code of the Hive members) and status, select recipients (individually or "all matching"), compose a newsletter, and send it — so I can reach the right audience without manual export/email work.

> As a **recipient**, I want a working unsubscribe link in every newsletter so I can opt out of future sends.

## Acceptance Criteria
1. New admin page at `/admin/newsletter` lists all users (talents + companies) in a single paginated, filterable table.
2. Admin can filter the table by segment: All, Talents only, Companies only, Both (talent+company on same account), Code of the Hive signed only.
3. Admin can additionally filter by approval status (approved/published only vs. all) and free-text search (name/email).
4. Admin can select recipients via row checkboxes, or via a "select all N matching current filter" action (Gmail-style), with the ability to deselect individual rows after a select-all.
5. Users who have opted out (`newsletter_opt_out = true`) are excluded from every send automatically, regardless of selection — never shown as sendable, or shown but visibly disabled/flagged.
6. Admin composes a subject + rich text body (bold/italic/links/lists/image) via a WYSIWYG editor; content is wrapped in one branded GoodHive email template.
7. Before sending, admin sees a confirmation with the final recipient count and cannot undo after confirming.
8. Every sent newsletter includes a working unsubscribe link unique to the recipient; clicking it sets `newsletter_opt_out = true` without requiring login.
9. Every send is recorded as a campaign (subject, body, audience filter used, admin who sent it, timestamp, recipient/sent/failed counts) visible in a "History" view on the same page.
10. Per-recipient send failures are logged (not just swallowed to console) and visible in the campaign detail so a failed send is discoverable, not silent.
11. Sending 1,000+ recipients does not exceed Vercel's function timeout (batched sends, not one request per recipient).

## Out of Scope
- Scheduled/delayed sends (send now only, MVP).
- A/B testing, open/click tracking, analytics beyond sent/failed counts.
- Multiple saved templates or a template library — one branded wrapper for MVP.
- Re-sending only to failed recipients (future iteration; failures are visible but retry is manual for MVP).
- Segmenting by mentor/recruiter role specifically, or by referral cohort — only the four segments in AC #2.
- Editing a campaign after it starts sending.
- CAN-SPAM physical mailing address in the footer — **blocked on Benoit providing the business address** (see Open Questions). Do not ship to production without it.

## Impacted Files / Modules

**New**
- `database/migrations/add_newsletter.sql` — schema (see DB Changes)
- `app/admin/newsletter/page.tsx` — main admin page: segment filters, recipient `AdminDataGrid` with checkbox + select-all-matching selection, inline compose panel (subject + react-quill body + send confirmation dialog), Compose/History tab switch
- `app/admin/newsletter/CampaignHistory.tsx` — past campaigns list with expandable per-recipient failure detail
- `lib/newsletter/recipients.ts` — shared SQL query builder (segment/approved/search filters) used by both the paginated list and the send-time resolver
- `lib/email/newsletter.ts` — `sendNewsletterBatch()` (chunks recipients into `resend.batch.send()` calls, renders the branded HTML wrapper, generates per-recipient unsubscribe links)
- `lib/newsletter-token.ts` — signed unsubscribe token generate/verify (HMAC, no DB storage needed; falls back to `ADMIN_JWT_SECRET` if `NEWSLETTER_TOKEN_SECRET` isn't set)
- `app/api/admin/newsletter/recipients/route.ts` — `GET` paginated/filtered recipient list (pagination.total also drives the "select all N matching" banner — no separate count endpoint)
- `app/api/admin/newsletter/campaigns/route.ts` — `GET` history list, `POST` create+send
- `app/api/admin/newsletter/campaigns/[id]/route.ts` — `GET` campaign detail incl. per-recipient rows
- `app/api/newsletter/unsubscribe/route.ts` — public `GET`, verifies signed token, sets opt-out, redirects to confirmation
- `app/newsletter/unsubscribe/page.tsx` — public confirmation page

**Modified**
- `app/components/Sidebar/Sidebar.tsx` — add "Newsletter" nav link
- `app/components/admin/Breadcrumbs.tsx` — add `/admin/newsletter` route label
- `app/lib/admin-validations.ts` — add `newsletterCampaignSchema`
- `database/schema-latest.sql` — kept in sync
- `docs/tasks/current-task.md` — task entry

## API Changes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/newsletter/recipients` | admin | Paginated, filtered user list (segment, approved-only, search) |
| GET | `/api/admin/newsletter/recipients/count` | admin | Count matching current filter, for select-all banner |
| GET | `/api/admin/newsletter/campaigns` | admin | Paginated campaign history |
| POST | `/api/admin/newsletter/campaigns` | admin | Create campaign + send (see contract below) |
| GET | `/api/admin/newsletter/campaigns/[id]` | admin | Campaign detail + per-recipient statuses |
| GET | `/api/newsletter/unsubscribe` | public (token) | Verify token, set opt-out, redirect to confirmation page |

### POST `/api/admin/newsletter/campaigns` contract
```jsonc
// request
{
  "subject": "August Hive Update",
  "bodyHtml": "<p>...</p>",           // from react-quill
  "audience": {
    "mode": "filter",                  // "ids" | "filter"
    "segment": "code_of_hive",         // "all" | "talent" | "company" | "both" | "code_of_hive"
    "approvedOnly": true,
    "search": "",
    "userIds": [],                     // used when mode = "ids"
    "excludedIds": ["uuid1"]           // deselected rows after a select-all
  }
}

// 200
{ "success": true, "data": { "campaignId": "uuid", "recipientCount": 812, "sentCount": 808, "failedCount": 4 } }
// 400 — empty audience after resolving filter + opt-outs
// 403 — not admin
```
Recipient resolution happens **server-side** from `audience` at send time (never trusts a raw client-supplied full ID list for `mode: "filter"`), and always subtracts `newsletter_opt_out = true` regardless of mode.

## DB Changes
- New tables:
  - `goodhive.newsletter_campaigns` — `id uuid pk`, `subject text`, `body_html text`, `audience_filter jsonb`, `recipient_count int`, `sent_count int`, `failed_count int`, `status text` (`sending|sent|failed`), `created_by text` (admin email), `created_at timestamptz`, `completed_at timestamptz`
  - `goodhive.newsletter_recipients` — `id uuid pk`, `campaign_id uuid fk`, `user_id uuid` (references `users.userid`), `email text` (snapshot at send time), `status text` (`sent|failed`), `error text`, `sent_at timestamptz`
- New columns:
  - `goodhive.users.newsletter_opt_out boolean DEFAULT false`
  - `goodhive.users.newsletter_opt_out_at timestamptz`
- Migrations: `database/migrations/add_newsletter.sql`, applied same way as `add_code_of_hive.sql` (dev → staging → prod, tracked in `current-task.md`)
- Indexes: `idx_newsletter_recipients_campaign` on `newsletter_recipients(campaign_id)`; partial index on `users(newsletter_opt_out) WHERE newsletter_opt_out = true` for fast exclusion.

## AI / External Service Changes
- None. Uses existing Resend account (`RESEND_API_KEY`), via `resend.batch.send()` (up to 100 recipients per call) instead of the one-at-a-time pattern used elsewhere in the codebase — needed to stay inside function timeout for large segments.
- No new env vars required beyond a `NEWSLETTER_TOKEN_SECRET` for signing unsubscribe tokens (can reuse an existing app secret if the user prefers fewer env vars — flagged below).

## Validation Commands
```bash
pnpm lint
pnpm tsc --noEmit
```
Manual: send a test campaign to a 2-3 person segment in dev (Resend dev-mode redirect already exists per `app/api/send-email/route.ts`), verify unsubscribe link round-trip, verify opted-out user is excluded from a subsequent send, verify campaign history shows correct counts.

## Open Questions / TBDs
- **CAN-SPAM footer address**: need Benoit's business mailing address before this ships to production with real recipients.
- **Authoritative email**: `users.email`, `talents.email`, and `companies.email` can diverge — this plan uses `users.email` as canonical. Confirm that's correct (vs. using the role-specific table's email).
- **Approved-only default**: should the recipient table default to approved/published accounts only, or show everyone including pending/rejected? Recommend defaulting to approved-only with a toggle to include all.
- Should "select all N matching" have a hard cap (e.g. block sends over some number without an extra confirmation step) to guard against a fat-fingered filter accidentally emailing the entire user base?
- Confirm nav placement for the new "Newsletter" admin page.

## Review Checklist
- [ ] Acceptance criteria met
- [ ] No unrelated files changed
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Docs updated
