# Testing Guide: Deferred/Rejected Status Feature

## ✅ Migration Status: APPLIED

The database migration has been successfully applied! All new columns and constraints are in place.

---

## 🧪 Test Data Created

I've created test users with different mentor statuses for you to see in the admin panel:

| Name | Status | Badge Color | Reason/Details |
|------|--------|-------------|----------------|
| **Nicolas Wagner** | ✓ Approved | 🟢 Green | Already approved mentor |
| **Benoit Junkmail** | 🔄 Deferred | 🔵 Blue | Deferred until **Apr 9, 2026**<br>"Needs more mentoring experience" |
| **MOR NDIAYE** | 🔄 Deferred | 🔵 Blue | Deferred until **Jul 1, 2026**<br>"Needs to complete certification" |
| **Chaharane TEST** | ✗ Rejected | 🔴 Red | "Does not meet minimum requirement of 2+ years experience" |

---

## 🎯 How to Test in the UI

### Step 1: Start the Development Server

```bash
npm run dev
```

Wait for the server to start (usually at http://localhost:3000)

### Step 2: Navigate to Admin Talents Page

Open your browser and go to:
```
http://localhost:3000/admin/talents
```

You'll need to log in with your admin credentials if you're not already logged in.

### Step 3: View the New Status Badges

In the "Mentor Status" column, you should now see:

- 🟢 **Green badge with checkmark** for Nicolas Wagner (Approved)
- 🟡 **Yellow "Pending" badge** for users still under review
- 🔵 **Blue "Deferred" badge** for Benoit Junkmail and MOR NDIAYE (hover to see reason)
- 🔴 **Red "Rejected" badge** for Chaharane TEST (hover to see reason)
- 🟠 **Orange badge with X** for users who didn't apply

### Step 4: Test the Filters

Look for the **"Mentor Status"** dropdown filter at the top of the page. You should see:

- ✓ **All mentor statuses** (default - shows everyone)
- ✓ **Approved mentors** (click to show only green badges)
- ⏳ **Pending review** (click to show only yellow badges)
- 🔄 **Deferred (reapply later)** (click to show only blue badges) ⭐ NEW
- ✗ **Rejected** (click to show only red badges) ⭐ NEW
- **Not applied** (click to show only users who didn't apply)

**Test each filter:**
1. Select "Deferred (reapply later)" → Should show Benoit Junkmail and MOR NDIAYE
2. Select "Rejected" → Should show Chaharane TEST
3. Select "Approved mentors" → Should show Nicolas Wagner
4. Select "Pending review" → Should show remaining pending users

### Step 5: Test Mobile View

Resize your browser window to mobile size (or use mobile device) to see the card view:
- Badges should display with full text: "Mentor Approved", "Mentor Deferred", "Mentor Rejected", etc.
- Colors should match: Green, Blue, Red

### Step 6: Hover Over Badges

Hover your mouse over:
- **Blue "Deferred" badges** → Tooltip shows the reason (e.g., "Needs more mentoring experience")
- **Red "Rejected" badges** → Tooltip shows the reason (e.g., "Does not meet minimum requirement...")

---

## 🔍 What to Look For

### ✓ Everything Working If You See:

1. **New filter options** in the "Mentor Status" dropdown
2. **Blue badges** for deferred users (Benoit and MOR)
3. **Red badge** for rejected user (Chaharane)
4. **Tooltips** appear when hovering over blue/red badges
5. **Filtering works** - clicking each filter option shows correct users
6. **Mobile view** shows colored badges with text

### ⚠️ Potential Issues:

If you see errors:
- **"mentor_status_reason is undefined"** → Clear browser cache and refresh
- **No blue/red badges** → Check browser console for errors
- **Filters not working** → Check Network tab for API errors

---

## 🎨 Status Color Reference

| Status | Desktop Badge | Mobile Badge | Tailwind Classes |
|--------|---------------|--------------|------------------|
| **Approved** | 🟢 Checkmark icon | Green "Mentor Approved" | `bg-green-500 text-white` |
| **Pending** | 🟡 "Pending" text | Yellow "Mentor Pending" | `bg-yellow-50 text-yellow-700 border-yellow-200` |
| **Deferred** | 🔵 "Deferred" text | Blue "Mentor Deferred" | `bg-blue-50 text-blue-700 border-blue-200` |
| **Rejected** | 🔴 "Rejected" text | Red "Mentor Rejected" | `bg-red-50 text-red-700 border-red-200` |
| **Not Applied** | 🟠 X icon | Orange "Mentor No" | `bg-orange-500 text-white` |

---

## 📝 How to Set Status for More Users

If you want to test with more users, run these SQL commands:

### Defer a User (Come Back Later)

```sql
UPDATE goodhive.users
SET
  mentor_status = 'deferred',
  mentor_deferred_until = NOW() + INTERVAL '6 months',
  mentor_status_reason = 'Your custom reason here',
  mentor_status_updated_at = NOW()
WHERE userid = 'paste-user-id-here';
```

### Reject a User (Permanently)

```sql
UPDATE goodhive.users
SET
  mentor_status = 'rejected',
  mentor_status_reason = 'Your rejection reason here',
  mentor_status_updated_at = NOW()
WHERE userid = 'paste-user-id-here';
```

### Approve a Deferred User (They Reapplied)

```sql
UPDATE goodhive.users
SET
  mentor_status = 'approved',
  mentor_deferred_until = NULL,
  mentor_status_reason = NULL,
  mentor_status_updated_at = NOW()
WHERE userid = 'paste-user-id-here';
```

### Reset a User Back to Pending

```sql
UPDATE goodhive.users
SET
  mentor_status = 'pending',
  mentor_deferred_until = NULL,
  mentor_status_reason = NULL,
  mentor_status_updated_at = NOW()
WHERE userid = 'paste-user-id-here';
```

---

## 🚀 Quick Database Queries

### See All Mentor Applicants with Status

```sql
SELECT
  t.first_name,
  t.last_name,
  t.email,
  t.mentor as applied,
  u.mentor_status,
  u.mentor_deferred_until,
  u.mentor_status_reason
FROM goodhive.talents t
JOIN goodhive.users u ON t.user_id = u.userid
WHERE t.mentor = true
ORDER BY u.mentor_status, t.first_name;
```

### Count Users by Status

```sql
SELECT
  mentor_status,
  COUNT(*) as count
FROM goodhive.users
WHERE mentor_status IS NOT NULL
GROUP BY mentor_status
ORDER BY count DESC;
```

### Find Deferred Users Who Can Reapply Now

```sql
SELECT
  t.first_name,
  t.last_name,
  t.email,
  u.mentor_deferred_until,
  u.mentor_status_reason
FROM goodhive.talents t
JOIN goodhive.users u ON t.user_id = u.userid
WHERE u.mentor_status = 'deferred'
  AND u.mentor_deferred_until <= NOW()
ORDER BY u.mentor_deferred_until;
```

---

## 📸 Expected Screenshots

### Desktop View - Table
You should see a table with these badges in the "Mentor Status" column:
- Green badge with ✓ for approved
- Yellow badge with "Pending" for pending
- Blue badge with "Deferred" for deferred
- Red badge with "Rejected" for rejected
- Orange badge with ✗ for not applied

### Filter Dropdown
The "Mentor Status" dropdown should show 6 options with icons/emojis.

### Mobile View - Cards
Each card should show colored badges with text labels.

---

## 🆘 Troubleshooting

### Issue: Can't see new filter options
**Solution:** Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Issue: API returns error about missing columns
**Solution:** Make sure migration was applied. Run `node verify-implementation.js`

### Issue: Badges not showing colors correctly
**Solution:** Check browser console for CSS errors. Clear browser cache.

### Issue: Tooltips not appearing on hover
**Solution:** Make sure you're hovering over blue/red badges (deferred/rejected). Others don't have tooltips.

---

## ✨ Next Steps

After testing, you might want to:

1. **Add UI controls** to set deferred/rejected status from admin panel (instead of SQL)
2. **Add notifications** to remind admins when deferred users can reapply
3. **Add bulk actions** to defer/reject multiple users at once
4. **Add analytics** showing deferral/rejection rates
5. **Extend to talent and recruiter roles** with the same logic

---

## 📞 Support

If you encounter any issues:
1. Check `node verify-implementation.js` output
2. Check browser console for errors
3. Check Network tab for API errors
4. Verify data exists: Run the SQL queries above

**Everything is working if:**
- ✅ Verification script shows all green checkmarks
- ✅ You can see blue and red badges in the UI
- ✅ Filters work correctly
- ✅ Tooltips show reasons

---

**Implementation Date:** January 9, 2026
**Status:** ✅ Ready to Use
**Test Data:** 4 users with different statuses created
