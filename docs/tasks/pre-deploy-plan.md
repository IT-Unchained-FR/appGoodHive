# Pre-Deploy Plan

**Last Updated:** 2026-03-09
**Sprint:** March 6–9, 2026
**Context:** Read `docs/architecture/overview.md` and `docs/meetings/2026-03-06-juhan-benoit.md` first.

---

## Task 1 — Fix `name: undefined` in Admin Email Subject

**Priority:** HIGH
**Effort:** 5 minutes

**Problem:**
When a talent submits their profile for review, the admin notification email subject reads:
`[Admin] new-talent: undefined → Shai Perednik`
The `name` field is missing from the send-email payload.

**Fix:**
In both files below, add `name: \`${formData.first_name} ${formData.last_name}\`` to the fetch body.

**File 1:** `app/talents/my-profile/hooks/useProfileForm.ts` — line ~179
```typescript
// BEFORE
body: JSON.stringify({
  email: formData.email,
  type: "new-talent",
  subject: `Welcome to GoodHive, ${formData.first_name}! 🎉 Your profile has been sent for review`,
  toUserName: `${formData.first_name} ${formData.last_name}`,
  referralLink,
}),

// AFTER
body: JSON.stringify({
  name: `${formData.first_name} ${formData.last_name}`,   // ← add this
  email: formData.email,
  type: "new-talent",
  subject: `Welcome to GoodHive, ${formData.first_name}! 🎉 Your profile has been sent for review`,
  toUserName: `${formData.first_name} ${formData.last_name}`,
  referralLink,
}),
```

**File 2:** `app/talents/my-profile/page.tsx` — line ~821
Same fix — add `name: \`${formData.first_name} ${formData.last_name}\`` to that send-email call.

**Validation:** `pnpm lint && pnpm tsc --noEmit`

---

## Task 2 — Role Toggle Does NOT Reset Approval

**Priority:** HIGH
**Effort:** 30–45 minutes

**Background:**
Current bug: when an approved talent changes their opportunity toggles (mentor/talent/recruiter) and saves, it can reset their approval status. Benoit triggered this on himself during the March 6 meeting.

**Business Rules (confirmed by Juhan/Benoit):**
- Changing opportunity toggles → NEVER resets approval status, NEVER triggers re-review
- Admin changing status from admin panel → always takes effect immediately, no re-review
- The SQL in `app/api/talents/my-profile/route.ts` line 234–276 already protects `approved` roles from being reset to `pending` — BUT the frontend may be calling `validate=true` when only toggles changed, which sends the whole form through the review flow unnecessarily

**Fix (frontend):**
In `app/talents/my-profile/page.tsx`, the toggle change handler must call save with `validate=false` — never with `validate=true`. Toggle changes are just data saves, not review submissions.

Specifically:
- When a talent changes ONLY their role toggles → call `handleFormSubmit(formData, user, fetchProfile, false)` — i.e. `validate=false`
- Only the explicit "Submit Profile For Review" button should call `validate=true`
- The "Save Profile" button should always call `validate=false`

**What NOT to change:**
- The API SQL logic (lines 234–276) is already correct — if `approved` it stays `approved`
- Admin status routes in `app/api/admin/talents/status/route.ts` — admin can always override, leave as-is

**Validation:** `pnpm lint && pnpm tsc --noEmit`

---

## Task 3 — Critical Field Changes → Force Submit For Review

**Priority:** HIGH
**Effort:** 1–2 hours

**Business Rules (confirmed by Juhan/Benoit):**
- **Critical fields:** `email`, `telegram`
- If a talent changes either of these fields → the "Save Profile" button disappears and ONLY "Submit Profile For Review" button is shown
- Changing any other field (bio, skills, title, city, etc.) → "Save Profile" works normally, no re-review

**How to implement:**

**Step 1 — Track original critical field values on load**
In `app/talents/my-profile/page.tsx`, when profile data loads, store the original `email` and `telegram` in a ref:
```typescript
const originalCriticalFields = useRef({ email: '', telegram: '' });
// On profile load:
originalCriticalFields.current = { email: profileData.email, telegram: profileData.telegram };
```

**Step 2 — Detect if critical fields changed**
```typescript
const hasCriticalFieldChanged = useMemo(() => {
  return (
    formData.email !== originalCriticalFields.current.email ||
    formData.telegram !== originalCriticalFields.current.telegram
  );
}, [formData.email, formData.telegram]);
```

**Step 3 — Conditional button rendering**
```typescript
// If critical field changed → show ONLY "Submit Profile For Review"
// If nothing critical changed → show normal "Save Profile" + "Submit Profile For Review"
{hasCriticalFieldChanged ? (
  <button onClick={() => handleFormSubmit(formData, user, fetchProfile, true)}>
    Submit Profile For Review
  </button>
) : (
  <>
    <button onClick={() => handleFormSubmit(formData, user, fetchProfile, false)}>
      Save Profile
    </button>
    <button onClick={() => handleFormSubmit(formData, user, fetchProfile, true)}>
      Submit Profile For Review
    </button>
  </>
)}
```

**Step 4 — Reset tracking after successful save**
After a successful submit/save, update `originalCriticalFields.current` to the new values so the detection resets.

**Critical fields list:** `email`, `telegram` — only these two for now.

**Validation:** `pnpm lint && pnpm tsc --noEmit`

---

## Task 4 — Remove Hourly Rate from AI Suggestions

**Priority:** HIGH
**Effort:** 15 minutes

**Background:** Benoit does not want AI to suggest or pre-fill hourly rates for new talents. Talents should set their own rates.

**Where to fix:**
Find the AI enhance/extract route that returns hourly rate data. Likely one of:
- `app/api/ai-enhance/route.ts`
- `app/api/ai-extract-skills/route.ts`
- `app/api/pdf-to-profile/route.ts`

**Fix:**
1. Remove `hourly_rate`, `min_rate`, `max_rate` from the Gemini prompt — don't ask AI to suggest these
2. Remove those fields from the AI response parsing / the data returned to frontend
3. The rate fields in the profile form remain — talent can still enter them manually

**Validation:** `pnpm lint && pnpm tsc --noEmit`

---

## Task 5 — Show Referrer in Admin Panel

**Priority:** HIGH
**Effort:** 30–45 minutes

**Background:**
Admin panel currently shows no information about who referred each talent/company. Benoit needs this for tracking commissions.

**Where to add it:**
Admin talent list/detail — the `referred_by` field already exists in `goodhive.users` table (confirmed in `app/api/profile/route.ts` line 29: `SELECT ... referred_by FROM goodhive.users`).

**Fix:**
1. In `app/lib/fetch-admin-talents.ts` — add `referred_by` to the SELECT query (JOIN to get the referrer's name/email if possible)
2. In the admin talents list page/table — add a "Referred by" column
3. If no referrer → show "–"

**API already returns `referred_by`** from `/api/profile` route — just needs to be surfaced in the admin UI.

**Validation:** `pnpm lint && pnpm tsc --noEmit`

---

## Summary Table

| # | Task | File(s) | Effort | Needs from Juhan |
|---|---|---|---|---|
| 1 | Fix `name: undefined` in email | `useProfileForm.ts`, `page.tsx` | 5 min | Nothing |
| 2 | Role toggle doesn't reset approval | `app/talents/my-profile/page.tsx` | 30 min | Nothing |
| 3 | Critical fields → force re-review | `app/talents/my-profile/page.tsx` | 1–2 hr | Nothing |
| 4 | Remove hourly rate from AI | `app/api/ai-enhance/` or similar | 15 min | Nothing |
| 5 | Show referrer in admin | `app/lib/fetch-admin-talents.ts`, admin page | 30 min | Nothing |

**All 5 tasks are ready for Codex to execute in order.**
