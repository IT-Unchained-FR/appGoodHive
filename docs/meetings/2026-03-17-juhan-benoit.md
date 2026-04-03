# Meeting: Juhan × Benoit — March 17, 2026

**Source:** Bluedot transcript
**Attendees:** Jubayer Juhan (dev), Benoit Kulesza (boss/owner)

---

## Key Decisions

| Decision | Detail |
|---|---|
| **Ship only what works** | Benoit confirmed: only ship to production things that are tested and working. Assignment feature was NOT working → keep hidden. |
| **Career Coach is NOT priority** | Nice to have, good for marketing/investors, but not needed at this stage. Don't invest more time in it now. |
| **Minimize AI usage** | Gemini prices may spike significantly — they're testing the market. Keep AI as experimentation, minimize access until there are paying clients. Seek startup credits if possible. |
| **Contract signing is next big thing** | Benoit wrote a specific contract. Wants companies/talents to sign a global contract on profile creation + a SOW (Statement of Work) on every job offer. Considering blockchain signing vs DocuSign. |
| **Calendly link — 1 hour, not 45 min** | Benoit is updating his Calendly to a 1-hour meeting. Will send new link. Current link `goodhive-intro-call` is the right slug name. |

---

## Bugs Found In Meeting

### BUG-003: "Available now" badge showing twice on talent profile (LOW)
**What happened:** Benoit noticed "Available now" appearing duplicated on the profile page.
**Fix needed:** Find and remove the duplicate render in talent profile page.
**Priority:** LOW

### BUG-004: Assignment failing with "job must be approved" error (MEDIUM)
**What happened:** Trying to assign a talent to a job failed even though the job was approved.
**Likely cause:** Review status check in assignment API not matching correctly.
**Priority:** MEDIUM — blocked until fixed, but feature is hidden so not urgent for prod.

### BUG-005: Career Coach intermittently not responding (LOW)
**What happened:** Career coach wasn't responding during demo (was working 2 hours prior).
**Likely cause:** DB connection issue or Gemini API rate limit.
**Priority:** LOW — career coach is not a priority per Benoit.

### BUG-006: Company welcome email missing Calendly link (FIXED ✅)
**What happened:** Benoit checked his email during the meeting and confirmed no Calendly link in the company welcome email.
**Fix:** Already applied — `new-company-user.tsx` updated with `goodhive-intro-call` link.

---

## Benoit's Next Big Feature: Contract Signing

**What he described:**
- He wrote a specific legal contract for GoodHive
- Two levels of signing:
  1. **Global contract** — signed once when a company creates their profile (onboarding)
  2. **SOW (Statement of Work / Service Order)** — signed every time a company posts a new job offer
- **Signing method:** Considering blockchain-based signature (on Polygon) vs traditional tools like DocuSign
- Juhan confirmed this is buildable

**Why this matters:**
- Legal protection for GoodHive on every engagement
- Professional onboarding signal for clients ("we take this seriously")
- Blockchain signature = Web3 differentiator, aligns with Benoit's core vision
- Goes live with first real clients

**Benoit's preference:** Blockchain signing where possible — fits the Web3 ethos.

---

## What Was Demoed & Approved for Production

| Feature | Status |
|---|---|
| Messaging system (company ↔ talent) with email notifications | ✅ Approved to ship |
| Job creation with AI description builder (Gemini) | ✅ Approved to ship |
| Job management panel in company dashboard | ✅ Approved to ship |
| Job submission for review flow | ✅ Approved to ship |
| Blockchain job publish + token funding | ✅ Approved to ship |
| Admin job/company/talent approval panels | ✅ Approved to ship |
| Career Coach | ⏳ Not priority — ship later with video explainer |
| Assignment feature | ❌ Not working — keep hidden |

---

## Other Notes

- Benoit wants a **video explainer** for the Career Coach when it eventually ships — short onboarding video shown on first visit
- Profile has "7 next chapter" sections — Benoit noticed this as a UX label
- Blockchain publishing on Polygon Amoy (testnet) — Benoit's existing jobs were on wrong chain (not Amoy), need to create new ones
- Juhan to seek Gemini/Google startup credits to keep AI costs free
- Database migrations were being done during/around this meeting (already completed)

---

## Action Items

| Item | Owner | Priority |
|---|---|---|
| Contract signing feature — design + build | Juhan/Codex | P1 — next sprint |
| Benoit to send new 1-hour Calendly link | Benoit | Pending |
| Fix "Available now" duplicate on profile | Codex | P2 |
| Fix assignment "job must be approved" error | Codex | P2 (hidden feature) |
| Seek Google/Gemini startup credits | Juhan | P2 |
| Career Coach video explainer (when ready) | Benoit + Juhan | Future |
