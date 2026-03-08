# Feature: Talent Availability Calendar

## Status
`PLANNED`

## Business Goal
Companies spend days pinging talents to check if they're available. A public availability signal on talent profiles dramatically reduces time-to-hire and makes GoodHive profiles more useful than LinkedIn.

## User Stories
> As a **talent**, I want to set my availability status (immediately available, available in X weeks, not looking) so companies know when to reach out.

> As a **talent**, I want to mark specific date ranges as busy or available so I can block out periods.

> As a **company**, I want to filter the talent list by availability so I only contact talents who are ready.

> As a **company**, when I view a talent profile, I want to see a clear availability banner before I write a message.

## How It Works (Architecture)

### Data Model

```sql
-- Simple status on talent profile (add column)
ALTER TABLE talents ADD COLUMN availability_status TEXT
  CHECK (availability_status IN ('immediately', 'weeks_2', 'weeks_4', 'months_3', 'not_looking'))
  DEFAULT 'not_looking';

ALTER TABLE talents ADD COLUMN availability_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Optional: date-range blocks for detailed calendar
CREATE TABLE talent_availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('available', 'busy')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON talent_availability_blocks(talent_id, start_date);
```

### Status Labels (UI)
- `immediately` → 🟢 "Available now"
- `weeks_2` → 🟡 "Available in 2 weeks"
- `weeks_4` → 🟡 "Available in 1 month"
- `months_3` → 🟠 "Available in 3 months"
- `not_looking` → ⚫ "Not looking"

### Status Auto-expiry
- If status is `immediately` and `availability_updated_at` is > 4 weeks ago → auto-switch to `not_looking`
- Talent receives email reminder: "Update your availability — companies are looking!"

## Acceptance Criteria
1. Talent profile edit page has availability status dropdown + save
2. `PATCH /api/profile/availability` updates `availability_status` and `availability_updated_at`
3. Talent public profile page shows availability badge at top of profile
4. Talent list page (`/talents`) supports `?availability=immediately,weeks_2` filter param
5. `GET /api/talents` respects `availability` query param filter
6. Availability auto-expires after 4 weeks (background job or cron check on read)
7. Email reminder sent when status expires (via Resend)
8. (Optional) Basic calendar view for date-range blocks on profile

## Out of Scope
- Booking/scheduling system (that's a separate product)
- Calendar sync with Google Calendar (Phase 2)
- Real-time availability ping/notify companies

## Impacted Files / Modules

### New Files
- `app/api/profile/availability/route.ts` — PATCH handler
- `app/components/AvailabilityBadge.tsx` — reusable badge component
- `app/components/AvailabilityPicker.tsx` — dropdown for talent to set status

### Modified Files
- `app/user-profile/page.tsx` (or edit page) — add availability picker section
- `app/talents/[id]/page.tsx` — add availability badge to profile header
- `app/talents/page.tsx` — add availability filter to search UI
- `app/api/talents/route.ts` — add availability filter to SQL query
- DB: `ALTER TABLE talents ADD COLUMN availability_status`, `talent_availability_blocks` table

## API Spec

```
PATCH /api/profile/availability
Auth: Iron Session (talent)
Body: { status: 'immediately' | 'weeks_2' | 'weeks_4' | 'months_3' | 'not_looking' }
Response: { success: true, data: { status, updatedAt } }

GET /api/talents?availability=immediately,weeks_2&skills=react
Response: { success: true, data: talent[], total: number }
```

## Validation Commands
```bash
pnpm lint
pnpm tsc --noEmit
```

## Open Questions / TBDs
- TBD: What is the exact `talents` table name and primary key? Confirm in `app/lib/fetch-talent-data.ts`
- TBD: Does Resend email template exist for notifications? Check `app/lib/email/`
- TBD: Is there a cron system in place? If not, availability expiry can be checked lazily on profile read
