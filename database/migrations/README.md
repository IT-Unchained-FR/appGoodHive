# Database Migration: Deferred and Rejected Statuses

## Overview
This migration adds support for **deferred** and **rejected** statuses for all roles (Talent, Mentor, Recruiter), allowing admins to handle users who should reapply later or are permanently rejected.

## What's New

### New Statuses
Each role now supports **4 statuses** instead of 2:

| Status | Meaning | Badge Color | Use Case |
|--------|---------|-------------|----------|
| `pending` | Waiting for review | 🟡 Yellow | Initial application |
| `approved` | Accepted | 🟢 Green | Approved user |
| `deferred` | Reapply later | 🔵 Blue | "Come back in 3 months", "Needs more experience" |
| `rejected` | Permanently rejected | 🔴 Red | Not qualified, don't reapply |

### New Database Fields

For each role (talent, mentor, recruiter):

1. **Status Fields** (updated):
   - `talent_status`, `mentor_status`, `recruiter_status`
   - Now accepts: `'pending'`, `'approved'`, `'deferred'`, `'rejected'`

2. **Deferred Date Fields** (new):
   - `talent_deferred_until`, `mentor_deferred_until`, `recruiter_deferred_until`
   - Type: `TIMESTAMP WITH TIME ZONE`
   - Use: Track when user can reapply (e.g., "Deferred until 2026-07-01")

3. **Status Reason Fields** (new):
   - `talent_status_reason`, `mentor_status_reason`, `recruiter_status_reason`
   - Type: `TEXT`
   - Use: Admin notes explaining rejection/deferral (e.g., "Needs 2+ years experience")

4. **Status Updated Fields** (new):
   - `talent_status_updated_at`, `mentor_status_updated_at`, `recruiter_status_updated_at`
   - Type: `TIMESTAMP WITH TIME ZONE`
   - Use: Track when status was last changed

## How to Apply Migration

### Option 1: Using psql (PostgreSQL CLI)

```bash
# Connect to your database
psql -U your_username -d your_database_name

# Run the migration
\i /Users/juhan/Developer/GoodHive/GoodHive-Web/database/migrations/add_deferred_rejected_statuses.sql

# Verify the changes
\d goodhive.users
```

### Option 2: Using a Database Client (e.g., pgAdmin, DBeaver)

1. Open your database client
2. Connect to your GoodHive database
3. Open the SQL editor
4. Copy and paste the contents of `add_deferred_rejected_statuses.sql`
5. Execute the query
6. Verify by checking the `goodhive.users` table structure

### Option 3: Using Vercel Postgres (if using Vercel)

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Connect to your Vercel database
vercel env pull .env.local

# Use psql with Vercel connection string
psql "$(grep POSTGRES_URL .env.local | cut -d '=' -f2-)" -f database/migrations/add_deferred_rejected_statuses.sql
```

## Verification

After running the migration, verify it worked:

```sql
-- Check that new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'goodhive'
  AND table_name = 'users'
  AND column_name LIKE '%status%' OR column_name LIKE '%deferred%';

-- Check that new statuses are allowed
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE 'check_%_status';
```

Expected output should show:
- CHECK constraints allowing 4 values: `'pending', 'approved', 'deferred', 'rejected'`
- New columns: `*_deferred_until`, `*_status_reason`, `*_status_updated_at`

## How to Use in Admin Panel

### 1. View Status Badges

Navigate to `/admin/talents` and you'll see color-coded badges:

- 🟢 **Green** = Approved
- 🟡 **Yellow** = Pending review
- 🔵 **Blue** = Deferred (hover to see reason and date)
- 🔴 **Red** = Rejected (hover to see reason)
- 🟠 **Orange** = Not applied

### 2. Filter by Status

Use the "Mentor Status" dropdown to filter:
- **✓ Approved mentors** - Show only approved
- **⏳ Pending review** - Show only pending
- **🔄 Deferred (reapply later)** - Show only deferred
- **✗ Rejected** - Show only rejected
- **Not applied** - Show only non-applicants

### 3. Set Status (Manual Process)

To set a user's status to deferred or rejected, currently you need to update the database manually:

```sql
-- Example: Defer a mentor application until July 2026
UPDATE goodhive.users
SET
  mentor_status = 'deferred',
  mentor_deferred_until = '2026-07-01',
  mentor_status_reason = 'Good potential but needs 6 more months of experience. Reapply in July.',
  mentor_status_updated_at = NOW()
WHERE userid = 'user-uuid-here';

-- Example: Reject a mentor application
UPDATE goodhive.users
SET
  mentor_status = 'rejected',
  mentor_status_reason = 'Does not meet minimum experience requirements (2+ years).',
  mentor_status_updated_at = NOW()
WHERE userid = 'user-uuid-here';

-- Example: Approve a deferred user who reapplied
UPDATE goodhive.users
SET
  mentor_status = 'approved',
  mentor_deferred_until = NULL,
  mentor_status_reason = NULL,
  mentor_status_updated_at = NOW()
WHERE userid = 'user-uuid-here';
```

### 4. Future Enhancement: UI for Setting Statuses

**TODO**: Update the `ApprovalPopup` component to allow admins to:
- Select status (approved/pending/deferred/rejected) from dropdown
- Enter deferred date if status is "deferred"
- Enter reason text for deferred/rejected statuses

## Example Use Cases

### Use Case 1: "Come back in 3 months"
```sql
-- User interviewed but needs more experience
UPDATE goodhive.users
SET
  mentor_status = 'deferred',
  mentor_deferred_until = NOW() + INTERVAL '3 months',
  mentor_status_reason = 'Great interview but needs more mentoring experience. Encouraged to mentor informally and reapply in 3 months.'
WHERE userid = 'abc-123';
```

### Use Case 2: "Rejected - doesn't meet criteria"
```sql
-- User doesn't meet basic requirements
UPDATE goodhive.users
SET
  mentor_status = 'rejected',
  mentor_status_reason = 'Does not meet minimum requirement of 5+ years industry experience.'
WHERE userid = 'xyz-789';
```

### Use Case 3: "Find all users who can reapply now"
```sql
-- Find deferred users whose deferral period has ended
SELECT
  userid,
  first_name,
  last_name,
  email,
  mentor_status,
  mentor_deferred_until,
  mentor_status_reason
FROM goodhive.users u
LEFT JOIN goodhive.talents t ON u.userid = t.user_id
WHERE mentor_status = 'deferred'
  AND mentor_deferred_until <= NOW()
ORDER BY mentor_deferred_until ASC;
```

## Rollback

If you need to rollback this migration:

```bash
psql -U your_username -d your_database_name -f database/migrations/rollback_deferred_rejected_statuses.sql
```

**⚠️ WARNING**: Rollback will:
1. Convert all `deferred` and `rejected` statuses back to `pending`
2. Delete the new columns (`*_deferred_until`, `*_status_reason`, `*_status_updated_at`)
3. Remove the indexes created by the migration

## Files Modified

### Database:
- `database/migrations/add_deferred_rejected_statuses.sql` - Main migration
- `database/migrations/rollback_deferred_rejected_statuses.sql` - Rollback script
- `database/migrations/README.md` - This file

### Backend:
- `app/api/admin/talents/route.ts` - Updated to fetch and filter new statuses

### Frontend:
- `app/admin/talents/page.tsx` - Updated badges and filters for all statuses

## Support

If you encounter any issues:
1. Check the migration was applied: `\d goodhive.users` in psql
2. Verify constraints: `SELECT * FROM information_schema.check_constraints WHERE constraint_name LIKE 'check_%_status';`
3. Check for errors in browser console (Network tab)
4. Verify API returns new fields: `curl http://localhost:3000/api/admin/talents | jq '.[0]'`

## Next Steps

**Recommended Enhancements**:
1. ✅ Database migration (DONE)
2. ✅ UI badges and filters (DONE)
3. ⏳ Update `ApprovalPopup` component to allow setting deferred/rejected status from UI
4. ⏳ Add notification system to remind admins when deferred users can reapply
5. ⏳ Add bulk actions to defer/reject multiple users at once
6. ⏳ Add analytics dashboard showing rejection/deferral rates

---

**Migration Version**: 1.0
**Date**: 2026-01-09
**Author**: Claude Code
