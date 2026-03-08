# Meeting: Juhan × Benoit — March 6, 2026

**Source:** Bluedot transcript
**Attendees:** Jubayer Juhan (dev), Benoit Kulesza (boss/owner)
**Next meeting:** Monday March 9, 2026

---

## Key Decisions

| Decision | Detail |
|---|---|
| QA before every production rollout | Benoit + Juhan (+ Sharon) do live QA together on preview before merging to prod |
| Stable prod = don't touch until new version QA'd | No hotfixes to production without going through QA cycle |
| Email sender address | Must be `app@goodhive.io` — NOT Benoit's personal email |
| Blockchain section | Replace current content with a video presentation |
| Company profile | Should look similar to talent profile (same UI polish) |
| Referral commission text | Add: *"Receive 5% of the commission earned on every mission completed by a talent you refer throughout their first year"* — same copy for company referrals |

---

## Bugs Found In Meeting

### BUG-001: Profile Role Toggle Resets Approval Status (HIGH)
**What happened:** Benoit changed his mentor toggle on his talent profile → system sent him back to "pending" / "not approved" state, even though he was previously approved.
**Root cause:** Role/opportunity toggle change triggers a re-review flow. It should NOT reset approval status for already-approved accounts (or at minimum require explicit re-review only when material identity fields change, not toggles).
**Fix needed:** Harden the toggle logic — changing mentor/talent/recruiter opportunity toggles should NOT reset approval state. Only specific fields (e.g. identity, bio, new skill claims) should trigger re-review.
**Benoit's words:** *"Yeah, I think we should simplify this"* / *"we need to harden those security"*
**Juhan's words:** *"if they save it then it will send for review or does it require admin approval"*
**Priority:** HIGH — affects all existing approved users

### BUG-002: Email Notifications Broken Since Feb 24 (CRITICAL)
**What happened:** Benoit stopped receiving email notifications (profile submitted for review). Last received: Feb 24. New profiles were created Feb 27–28 with no email.
**Root cause (suspected):** Juhan likely disabled email notifications during development/testing and accidentally left them disabled in production.
**Fix needed:**
  1. Re-enable email notification sending in production
  2. **Profile submitted for review** → admin (Benoit) receives email
  3. **Profile submitted for review** → talent receives confirmation email with Benoit's **calendar link**
  4. **New job application** → company receives email ("You have a new applicant")
**Priority:** CRITICAL — Benoit said *"this part is super important because if they don't receive it they cannot finalize their profile"*

### BUG-003: Messenger Polling Overload (HIGH)
**What happened:** Messages page throws "unable to load your request" / "too many requests" error. Currently fetching messages from server every second per user.
**Root cause:** Polling-based messenger with 1-second interval is unsustainable. Creates excessive DB/server load.
**Fix needed:** Increase polling interval to 3–5 seconds minimum, add proper error handling/retry backoff, or move to SSE (Server-Sent Events) for real-time.
**Priority:** HIGH — planned for Monday demo

---

## Tasks In Progress (Juhan working on these)

### TASK-001: Remove Hourly Rate from AI Suggestions
**Status:** In progress at time of meeting
**Detail:** Remove AI-suggested hourly rate from the new talent profile flow. Benoit: *"I don't want the new talent to set the rate according to the AI"*
**Files:** Likely `app/api/ai-enhance/` or wherever hourly rate is returned in AI enhancement response

### TASK-002: Show Referrer in Admin Panel
**Status:** In progress at time of meeting
**Detail:** Admin panel needs to show WHO referred each talent/company. Currently invisible.
**Files:** `app/admin/` admin talent/company list pages, `app/api/admin/` fetch helpers

### TASK-003: Harden Role Toggle Security (BUG-001 fix)
**Status:** Planned immediately after meeting
**Detail:** See BUG-001 above

### TASK-004: Fix Email Notifications (BUG-002 fix)
**Status:** Planned before Monday
**Detail:** See BUG-002 above. Juhan committed: *"before today's sleep, I will clear these three like these three tasks and also like the email"*

### TASK-005: Referral Section Copy Update
**Status:** Planned
**Detail:** Add text to referral page: *"Receive 5% of the commission earned on every mission completed by a talent you refer throughout their first year"*
Benoit: add this in the referral section — either as a 4th card or replacing "track results" card
**Files:** Referral page in `app/` — find where referral section cards are rendered

---

## Completed (Before/During Meeting)

- ✅ PDF resume import fixed — persistence and modal layout
- ✅ Talent profile editor UI polish (UIUX + navigation improvements)
- ✅ Proxy setup
- ✅ Job application eligibility check (removed annoying popup, shows proper messaging)
- ✅ Job offer page looks good (`/jobs` view page)
- ✅ Auto-upload resume on profile

---

## Planned for Monday Demo

1. **Messenger page** — full conversation flow between company and talent (end-to-end), live demo
2. **Email notifications** — live test: submit profile → receive email with calendar link

---

## Product Context (From This Meeting)

### How the Platform Works (Discovered/Confirmed)
- **Talent onboarding:** Create profile → fill details → toggle opportunities (mentor / talent / recruiter) → submit for review → admin approves → profile goes live
- **Referral system:** Talents and companies can refer others. Commission: 5% of mission earnings for 1 year
- **Blockchain:** Jobs/missions can be published on blockchain. Data stored: company ID, job ID, currency, commission %. Benoit wants to replace current blockchain section content with a video
- **Messenger:** Company ↔ talent messaging. Currently polling-based (too heavy). New: messages + email notification for new messages
- **Email triggers needed:**
  1. Talent submits profile for review → talent gets confirmation + calendar link (Benoit's meeting link)
  2. Talent submits profile for review → admin (Benoit) gets notification
  3. Company receives email when someone applies to their job
  4. New message → email notification to recipient (in progress)
- **Admin panel:** Benoit reviews talent profiles, approves/rejects. Can see referrals (once TASK-002 done)
- **Sharon:** Can be invited to QA sessions for live testing

---

## Action Items Summary

| # | Action | Owner | Priority | Deadline |
|---|---|---|---|---|
| 1 | Fix email notifications (all triggers) | Juhan | CRITICAL | Before Monday |
| 2 | Harden role toggle (don't reset approval) | Juhan | HIGH | Before Monday |
| 3 | Remove hourly rate from AI suggestions | Juhan | HIGH | Today |
| 4 | Show referrer in admin panel | Juhan | HIGH | Today |
| 5 | Add referral commission text (5%) to referral page | Juhan | MEDIUM | This week |
| 6 | Fix messenger polling overload | Juhan | HIGH | Monday demo |
| 7 | Complete messenger end-to-end (company ↔ talent) | Juhan | HIGH | Monday demo |
| 8 | Replace blockchain section content with video | Juhan | LOW | TBD |
| 9 | Polish company profile (match talent profile style) | Juhan | MEDIUM | TBD |
| 10 | Set up QA process (preview → test → prod) | Both | MEDIUM | Next rollout |
