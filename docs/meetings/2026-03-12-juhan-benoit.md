# Meeting: Juhan × Benoit — March 12, 2026

**Source:** Bluedot transcript
**Attendees:** Jubayer Juhan (dev), Benoit Kulesza (boss/owner)
**Next meeting:** Monday March 16, 2026

---

## Key Decisions

| Decision | Detail |
|---|---|
| **STOP new features — stabilize first** | Benoit explicitly asked: pause all new development until existing flows work reliably. Clients are coming soon; broken UX will cost talent and clients. |
| **Thirdweb connection cap** | Optimize wallet auth check — check per session, not per page visit. Running out of credits at $5/month plan; next tier is $90. |
| **Revenue model confirmed** | Only active revenue: 5% platform fee on mission payouts. No subscription or talent fees for now. |
| **Next meeting** | Monday March 16, 2026, same time |

---

## Bugs Found In Meeting

### BUG-001: Profile submission email missing appointment link (HIGH)
**What happened:** Benoit received the profile-submitted notification email but the Calendly link (45-minute assessment interview) was missing — it showed nothing where the link should be.
**Root cause:** Recent email refactor (integrating email + in-app notifications) broke the appointment link injection.
**Fix needed:** Restore the 45-minute Calendly booking link in the talent profile-submitted email. Benoit's 45-min link = for assessment interviews of new talent.
**Priority:** HIGH — talents who submit profiles cannot book their assessment interview

---

### BUG-002: Admin notification email shows "undefined undefined" for new company (MEDIUM)
**What happened:** Benoit's inbox showed an email: *"Admin — New company. Undefined. Undefined."* — company name/details not interpolated.
**Root cause:** Template variable substitution broken in the admin new-company notification email.
**Fix needed:** Fix the company name/field interpolation in the admin new-company email template.
**Priority:** MEDIUM — admin still gets notified, but content is unusable

---

### BUG-003: Company dashboard — jobs not visible (HIGH)
**What happened:** Benoit's company dashboard shows "5 jobs" in the count but the list is empty. Can't view, update, or publish jobs.
**Root cause:** Database connection instability (too many concurrent connections across environments). May also be a query/session mismatch.
**Fix needed:** Fix job listing query in company dashboard. Verify session/auth correctly identifies the company account.
**Priority:** HIGH — core company workflow is broken

---

### BUG-004: Admin talent filter — 204 response (MEDIUM)
**What happened:** Admin talent filter returns a 204 (no content) in some cases instead of filtered results. Benoit's own profile did not appear correctly until filters were cleared.
**Root cause:** Filter query edge case or response format mismatch (204 vs 200 + empty array).
**Fix needed:** Investigate the filter API handler — return 200 + empty array instead of 204, and verify filter logic handles all role combinations.
**Priority:** MEDIUM — admin can still list talents without filters

---

### BUG-005: Blockchain job publish fails + "Manage Funds" UX is wrong (MEDIUM)
**What happened:** "Publish on Blockchain" fails. The "Manage Funds" CTA appears *after* publishing attempt, but it should appear *before* — as a prompt to provision the smart contract first.
**Root cause:** UX flow reversed. The correct sequence is: create job → manage/provision funds → then publish on blockchain.
**Fix needed:**
1. Show a "Provision Funds" CTA prominently before the publish-on-blockchain button.
2. Publishing on blockchain should only be actionable after funds are provisioned (or show a clear prompt).
**Priority:** MEDIUM — blockchain flow is not critical path right now but needs fixing for companies

---

### BUG-006: Thirdweb auth consuming too many credits (HIGH)
**What happened:** Running out of Thirdweb credits (zero remaining shown in inspector). Multiple environments (localhost:3000, localhost:3001, preview.goodhive.io, www.goodhive.io) each consuming auth credits, causing wallet connection failures for users.
**Root cause:** Wallet/auth check fires on every page visit instead of once per session.
**Fix needed:** Cache the wallet auth check in the session — only recheck when session expires or user explicitly reconnects. Limit to max 2 simultaneous environments touching Thirdweb.
**Priority:** HIGH — blocking user login in production

---

## Action Items for Juhan (Priority Order)

| # | Task | Priority |
|---|---|---|
| 1 | Fix Thirdweb credit exhaustion — cache wallet auth per session, not per page | P0 |
| 2 | Fix DB connection stability — cap connections, ensure single DB per environment | P0 |
| 3 | Fix company job dashboard — jobs not loading for company account | P1 |
| 4 | Fix profile submission email — restore 45-min Calendly appointment link | P1 |
| 5 | Fix admin new-company email — "undefined undefined" template interpolation | P1 |
| 6 | Fix admin talent filter — 204 response + filter edge cases | P2 |
| 7 | Fix blockchain publish UX — show "Provision Funds" CTA before publish button | P2 |

---

## Features Shown (Not Yet Live / Not Blocked)

- **Career Coach** (nav link added, backend in progress) — Benoit liked it, deferred to later
- **My Assignments** page — shown, deferred until DB stable
- **My Payouts** page — shown, deferred until DB stable
- **In-app notifications** (bell icon, top-right) — shown in preview, not in prod yet

---

## Context Notes

- Benoit is starting a client campaign soon — platform reliability is non-negotiable
- Preview (`preview.goodhive.io`) and prod (`goodhive.io`) share the same Resend email server — this caused some email confusion
- Benoit is dyslexic — keep UI copy simple and avoid complex navigation
- Alvaro (a talent) submitted a profile yesterday but did NOT receive the appointment link email — Benoit had to send manually
- Benoit manually sent Alvaro a follow-up email; fix must be deployed before next talent onboards
