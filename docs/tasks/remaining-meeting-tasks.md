# Remaining Meeting Tasks — March 6, 2026 Juhan × Benoit

**Status:** Ready for Codex execution
**Created:** 2026-03-09
**Context:** Full meeting notes → `docs/meetings/2026-03-06-juhan-benoit.md`
**Architecture:** Read `docs/architecture/overview.md` before touching code

---

## TASK-005: Referral Page — Commission Text ✅ ALREADY DONE

**Status: SKIP — already implemented.**

`app/components/referral/referral-section.tsx` already contains:
- Referred Talents: *"Receive 5% of the commissions earned on every mission completed by a talent you refer, throughout their first year."*
- Referred Companies: *"Receive 20% of the commissions earned from all missions carried out by a company you refer, during its first year of activity."*

No changes needed.

---

## TASK-006: Messenger — Fix End-to-End Flow

**Priority:** HIGH — Demo on Monday
**Status:** Partially done (polling intervals already fixed)

### What's already done
The polling intervals are already correct in `app/messages/page.tsx`:
```typescript
const THREADS_POLL_INTERVAL_MS = 9000;   // 9s ✅
const MESSAGES_POLL_INTERVAL_MS = 4000;  // 4s ✅
const REQUESTS_POLL_INTERVAL_MS = 12000; // 12s ✅
```

### What still needs to be done

#### 6a — Verify end-to-end: company can initiate a conversation with a talent

1. Find where company initiates a new thread with a talent. Search for where a thread is created:
   - `app/api/messenger/threads/route.ts` — POST handler to create a new thread
   - Check if the UI exists for a company to start a conversation from a talent profile

2. If the "Start Conversation" button/flow is missing from talent public profile view (`app/talents/[address]/page.tsx` or similar), add it — should only be visible when logged-in user is a company.

3. The thread creation POST should set:
   - `participant_ids`: both the company user_id and talent user_id
   - `created_by`: company user_id

4. Check `app/api/messenger/threads/[threadId]/messages/route.ts` — POST handler for sending a message in a thread. Verify it works for both sides (company and talent can send).

#### 6b — Email notification on new message

When a message is sent, the recipient should receive an email notification.

**File to edit:** `app/api/messenger/threads/[threadId]/messages/route.ts`

After saving the message to the DB, send an email:
```typescript
import { sendEmail } from "@/lib/email"; // or however email is imported in this codebase

// After inserting message:
// 1. Look up the recipient's email from goodhive.users WHERE userid = recipientId
// 2. Look up sender's name from goodhive.talents WHERE user_id = senderId
// 3. Send email:
await sendEmail({
  to: recipientEmail,
  subject: `New message from ${senderName} on GoodHive`,
  type: "new-message", // or use the inline template below
});
```

**Email template:** Use a simple inline template (no new file needed unless `app/email-templates/` already has one). The email should say:
- Subject: `New message from [sender name] on GoodHive`
- Body: `You have a new message from [sender name]. Log in to GoodHive to read it and reply.`
- CTA button → link to `https://app.goodhive.io/messages`
- Footer: `The GoodHive Team 🐝`
- Sender: `GoodHive <no-reply@goodhive.io>` (always — see ADR-006)

**How email is sent in this codebase:**
- Check `app/api/send-email/route.ts` for the pattern
- Or check `app/lib/email/` for direct Resend helpers
- Use whichever pattern is already established — do NOT create a new email sending pattern

**Important:** Do NOT send an email notification if the sender and recipient are the same user.

#### 6c — Error handling on message fetch failure

`app/messages/page.tsx` — if a poll fails (network error, 500), it should silently retry on the next interval tick. Do NOT show a toast error for every failed poll — only show an error after 3+ consecutive failures.

Find the `fetchMessages` and `fetchThreads` functions and add a consecutive-failure counter. Reset on success. Only `toast.error(...)` when `failureCount >= 3`.

### Acceptance Criteria
- [ ] Company can start a new conversation with a talent
- [ ] Both sides (company + talent) can send and receive messages in a thread
- [ ] New message → email sent to recipient
- [ ] Email sender is always `GoodHive <no-reply@goodhive.io>`
- [ ] Poll failures are handled silently (no spam toasts)
- [ ] No regression on existing threads

### Files
- `app/messages/page.tsx`
- `app/api/messenger/threads/route.ts`
- `app/api/messenger/threads/[threadId]/messages/route.ts`
- `app/api/send-email/route.ts` (reference for email pattern)
- `app/lib/email/` (reference for direct Resend usage)

---

## TASK-007: Replace Blockchain Section with Video

**Priority:** MEDIUM — Benoit has a video to replace the current blockchain webinar page
**Status:** Planned

### Context
`app/blockchain-webinar/page.tsx` is a static page advertising a blockchain webinar with a calendar/registration CTA. Benoit wants this replaced with a video presentation.

### What to do

1. **Get the video URL from Benoit** — this task is BLOCKED until Benoit provides the video URL (YouTube, Vimeo, or direct upload to S3).

2. Once the URL is available, replace the page content in `app/blockchain-webinar/page.tsx`:
   - Remove the calendar/registration section
   - Add a full-width video embed (use `<iframe>` for YouTube/Vimeo, or `<video>` for direct URL)
   - Keep the page's existing outer layout (gradient background, container, card)
   - Keep the `<h1>` title (or update per Benoit's instruction)
   - Add a brief description below the video if Benoit provides one

3. Example embed pattern for YouTube:
```tsx
<div className="relative w-full aspect-video rounded-2xl overflow-hidden">
  <iframe
    src="https://www.youtube.com/embed/VIDEO_ID"
    title="GoodHive Presentation"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    className="absolute inset-0 w-full h-full"
  />
</div>
```

### Acceptance Criteria
- [ ] Page shows video (not registration form)
- [ ] Video plays correctly on desktop and mobile
- [ ] Existing page URL (`/blockchain-webinar`) still works
- [ ] No blockchain-specific language remains unless Benoit keeps it intentionally

### Files
- `app/blockchain-webinar/page.tsx`

**NOTE: Do NOT implement this task until Benoit provides the video URL. Skip for now.**

---

## TASK-008: Company Profile UI — Match Talent Profile Polish

**Priority:** MEDIUM — Demo readiness
**Status:** Planned

### Context
The company public profile page (`app/companies/[userId]/page.tsx`) uses an older UI approach compared to the more polished talent profile. Benoit wants the same design language.

### What to do

1. **Read both profiles first:**
   - Talent profile (polished reference): `app/talents/[address]/page.tsx` — understand the layout pattern, card styles, spacing, typography, color usage
   - Company profile (to update): `app/companies/[userId]/page.tsx` + its component imports

2. **Apply consistent design patterns:**
   - Hero section: same rounded card style, consistent padding
   - Section cards: same `rounded-2xl border border-amber-200 bg-white/90 shadow` pattern
   - Typography: same heading hierarchy and text color classes
   - Bio / description sections: same prose styling
   - Social links: same icon + link styling

3. **Do NOT redesign — harmonize.** Only change visual styling. Do not move sections, remove content, or change functionality.

4. Check these company components for styling updates:
   - `app/components/companies/company-hero-section.tsx`
   - `app/components/companies/company-bio-section.tsx`
   - `app/components/companies/profile-social-media-and-contact.tsx`
   - `app/components/companies/animated-job-section.tsx`
   - `app/components/companies/job-summary-section.tsx`

### Acceptance Criteria
- [ ] Company profile uses same card/section visual language as talent profile
- [ ] No regressions in company profile data display
- [ ] Mobile responsive (check at 375px and 768px)

### Files
- `app/companies/[userId]/page.tsx`
- `app/components/companies/*.tsx` (hero, bio, social, jobs sections)
- Reference: `app/talents/[address]/page.tsx` (do NOT edit)

---

## TASK-009: QA Process Documentation

**Priority:** LOW — Process, not code
**Status:** Planned

### What to do

Create `docs/workflows/qa-process.md` with the agreed QA process from the March 6 meeting:

**Content to include:**
1. **Before every production deployment:** preview deploy must be live and tested
2. **QA session participants:** Benoit + Juhan (+ Sharon when available)
3. **QA checklist template** (to be filled out per release):
   - [ ] All changed features tested on preview URL
   - [ ] Admin panel: talent list loads, approve/reject works
   - [ ] Talent profile: save, submit for review, email received
   - [ ] Company profile: save, jobs visible
   - [ ] Messenger: send message, notification received
   - [ ] Email notifications: all 4 triggers verified (talent submit, admin notify, job apply, message)
   - [ ] No console errors on key pages
4. **Deployment process:** Preview → QA → Prod. Never direct-to-prod.
5. **Rollback procedure:** Vercel instant rollback via dashboard

This is a documentation-only task. No code changes.

### Files
- Create: `docs/workflows/qa-process.md`

---

## Execution Order for Codex

1. **TASK-006a** — Verify/fix company → talent conversation initiation
2. **TASK-006b** — Add email notification on new message
3. **TASK-006c** — Fix silent poll error handling
4. **TASK-008** — Company profile UI polish (after 006)
5. **TASK-009** — QA process doc
6. **TASK-007** — BLOCKED on video URL from Benoit — skip for now

---

## Validation After Each Task

```bash
pnpm lint && pnpm tsc --noEmit
```

Expected: lint warnings only (existing repo-wide tsc errors are pre-existing and out of scope).

After TASK-006, manually verify:
1. Create a test thread via the UI
2. Send a message from both sides
3. Check that the recipient's email inbox receives a notification
4. Verify email sender is `no-reply@goodhive.io`
