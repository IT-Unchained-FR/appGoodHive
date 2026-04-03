# Meeting: Juhan × Benoit — March 26, 2026

**Source:** Bluedot transcript
**Attendees:** Jubayer Juhan (dev), Benoit Kulesza (boss/owner)
**Next meeting:** Monday March 30, 2026 (same time)

---

## Key Decisions

| Decision | Detail |
|---|---|
| **Fix bugs before anything else** | Same directive as March 12 — stabilization mode. No new features until critical bugs are resolved. |
| **Talent email missing Calendly link is P0** | Real users (Felipe, Solar) could not book their interview. Fix immediately. |
| **New Calendly event names** | Talent: "GoodHive Interview Call" — Company: "Start your Talent Sprint" (30 min) |
| **Contract signing — future feature** | Benoit updated the GoodHive contract. Companies must sign on profile approval + sign an order form on each new job post. Not for now — finalize contract first. |
| **Sharon to test on preview** | After Juhan deploys fixes to preview, Sharon runs full QA before anything goes to production. |

---

## Bugs — Priority Order

### 🔥 BUG-P0: Talent welcome email missing Calendly interview link
**What happened:** Talents who submitted their profile (Felipe, Solar, others) never received a Calendly booking link in their welcome email. Benoit had to manually follow up.
**Fix:** Add "GoodHive Interview Call" Calendly link to the talent profile-submitted email.
**Priority:** P0 — fix right now, real users are blocked.

### 🔥 BUG-P0: Company welcome email — wrong CTA copy for Calendly
**What happened:** Company email CTA text does not match the new Calendly event name.
**Fix:** Update CTA in company welcome email to say "Start your Talent Sprint" / "Book your call" — use the correct Calendly link Benoit will send.
**Priority:** P0 — fix alongside talent email.

### 🔥 BUG-P1: Job listing page — talent identity visible when logged out
**What happened:** Benoit was presenting the site and noticed the talent's identity/premium badge is visible to unauthenticated users on the job listing page.
**Fix:** Gate identity/premium info behind auth. Show contact CTA only to logged-in users.
**Priority:** P1 — embarrassing in demos.

### 🔥 BUG-P1: Benoit's talent profile not working correctly
**What happened:** Benoit's profile has gone through many test stages and the availability status is not rendering/behaving correctly.
**Fix:** Juhan to inspect Benoit's profile DB state and repair it. Test availability toggle end-to-end.
**Priority:** P1 — Benoit demos with his own profile.

### ⚠️ BUG-P2: "Seda" test profile — stale test account
**What happened:** A test profile ("Seda" / SYEDA?) created by Juhan for JC Masters testing is still in the system.
**Fix:** Juhan to remove or Benoit to disapprove this profile from admin.
**Priority:** P2.

---

## Feature Requests (Not Now)

### Admin Dashboard — Full Talent Contact Info Export
**What Benoit wants:** All talent columns visible in the admin panel (email, phone, LinkedIn, etc.) so they can export and run outreach campaigns on Telegram and LinkedIn.
**Priority:** P2 — after bug fixes.

### Contract E-Signature Flow (Future Sprint)
**What Benoit described:**
- GoodHive contract must be signed by companies at two points:
  1. Once when company profile is **approved** (global contract)
  2. Every time a company **posts a new job** (order form / SOW)
- Form should be pre-populated from company profile data — they only need to sign
- Benoit is still finalizing the contract — will send when ready
**Juhan's note:** Has done similar work before (Australian property inspection app). Should be straightforward once contract is finalized.
**Priority:** Future — blocked on Benoit sending final contract.

### Video Thumbnails for How It Works Section
**What Benoit wants:** Better thumbnails on the homepage "How it works" videos (like YouTube-style cover images).
**Status:** Sharon is sending new onboarding videos (talent + company). Waiting on Sharon's links + thumbnails.
**Priority:** P2 — blocked on Sharon.

---

## Availability Status Label Change
- Change "Not looking" label → "Not available" in the availability status options.
- Benoit asked: does "available in two weeks" auto-update to "available now" after 2 weeks?
  - Juhan confirmed: yes it should.

---

## Action Items

| Item | Owner | Priority |
|---|---|---|
| Add Calendly link to talent profile-submitted email | Juhan | 🔥 P0 — now |
| Update company email CTA copy + Calendly link | Juhan | 🔥 P0 — now |
| Fix job listing page — hide identity when logged out | Juhan/Codex | P1 |
| Fix Benoit's talent profile state | Juhan | P1 |
| Remove/disapprove "Seda" test profile | Juhan/Benoit | P2 |
| Admin panel — add full contact columns + export | Codex | P2 |
| Change "Not looking" → "Not available" availability label | Codex | P2 |
| Benoit to send final contract doc for e-signature feature | Benoit | Pending |
| Benoit to send new Calendly links (talent + company) | Benoit | Pending |
| Sharon to send new onboarding videos + thumbnails | Sharon | Pending |
| Sharon to QA on preview after Juhan deploys fixes | Sharon | After fixes |
