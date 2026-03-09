# Messenger Polish & Completion

**Status:** Ready for Codex execution
**Created:** 2026-03-09
**Priority:** High — core feature used in every company ↔ talent interaction
**Architecture:** Read `docs/architecture/overview.md` before touching code

---

## Context

The messenger feature is functionally built (threads, messages, job requests, email notifications, polling) but has bugs and missing polish that prevent it from being production-ready. This document covers everything Codex needs to bring it to 100%.

Key files:
- `app/messages/page.tsx` — main messenger UI (3-column: threads, chat, requests)
- `app/api/messenger/threads/route.ts` — list + create threads
- `app/api/messenger/threads/[threadId]/messages/route.ts` — send + fetch messages
- `app/api/messenger/threads/[threadId]/read/route.ts` — mark as read
- `app/components/talent-page/TalentPageHeader.tsx` — "Contact Me" entry point
- `app/components/talent-page/MessageBoxModal` — first message modal
- `interfaces/messenger.ts` — TypeScript types

---

## MSG-001 — Fix Hardcoded Messages URL in Email

**File:** `app/api/messenger/threads/[threadId]/messages/route.ts:11`
**Problem:** URL is hardcoded to `https://app.goodhive.io/messages` — breaks in preview/dev environments.

```typescript
// Current (wrong)
const MESSAGES_APP_URL = "https://app.goodhive.io/messages";

// Fix
const MESSAGES_APP_URL = `${process.env.GOODHIVE_BASE_URL}/messages`;
```

**Acceptance criteria:** Email notification links work correctly in both preview and production.

---

## MSG-002 — Fix Hardcoded Dev Email Fallback

**File:** `app/api/messenger/threads/[threadId]/messages/route.ts`
**Problem:** `TEST_EMAIL` fallback is hardcoded to `jubayerjuhan.dev@gmail.com` — dev messages leak to a personal inbox.

```typescript
// Find this pattern and fix:
const testEmail = process.env.TEST_EMAIL || "jubayerjuhan.dev@gmail.com";

// Fix — no hardcoded fallback:
const testEmail = process.env.TEST_EMAIL;
if (!testEmail) {
  console.warn("TEST_EMAIL env var not set — skipping email in dev");
  return; // or skip the email send
}
```

**Acceptance criteria:** No personal email address anywhere in the codebase as a fallback.

---

## MSG-003 — Exponential Backoff on Poll Failures

**File:** `app/messages/page.tsx`
**Problem:** After 3 consecutive failures, polling stops and shows an error banner. It never recovers automatically. Network glitches trap users in error state.

**Current behaviour:**
- 3 failures → `setHasError(true)` → banner shown → polling continues at same rate

**Required behaviour:**
- On 1st failure: wait 5s before next attempt
- On 2nd failure: wait 10s
- On 3rd+ failure: wait 30s, show error banner
- On success after failures: reset backoff, clear error banner

**Implementation:**
- Add a `consecutiveFailures` ref for each polling loop (threads, messages, requests)
- Compute next interval: `Math.min(BASE_INTERVAL * 2 ** failures, MAX_INTERVAL)`
- On success: reset `consecutiveFailures` to 0, clear error state
- Use `setTimeout` with dynamic delay instead of fixed `setInterval`

**Acceptance criteria:**
- Network blip → auto-recovers without user intervention
- 3+ failures → error banner shown
- Recovery → banner disappears

---

## MSG-004 — Optimistic Message Send

**File:** `app/messages/page.tsx`
**Problem:** After hitting Send, the message only appears after the next poll cycle (up to 4s delay). Feels broken — users think send failed.

**Fix:**
- On send, immediately append message to local `messages` state with a temporary ID
- Mark it with `pending: true` to show a subtle sending indicator (spinner or greyed text)
- On poll success, replace the temp message with the real one from DB
- On send failure, remove the temp message and show toast error

**Acceptance criteria:**
- Message appears instantly in chat after Send
- Pending state visually distinct from sent state
- Failure removes temp message and shows error

---

## MSG-005 — Empty State for No Conversations

**File:** `app/messages/page.tsx`
**Problem:** When a user has no threads, the thread list area is blank — no message, no call to action.

**Fix:** Show an empty state in the thread list panel:
```
[icon: chat bubble]
No conversations yet
Start by contacting a talent from their profile.
```

For the chat area when no thread is selected:
```
[icon: arrow left]
Select a conversation to start messaging
```

**Acceptance criteria:** Empty states visible for both zero threads and no thread selected.

---

## MSG-006 — Loading Skeletons

**File:** `app/messages/page.tsx`
**Problem:** Thread list and message area flash blank white on initial load.

**Fix:** Show skeleton placeholders while fetching:
- Thread list: 5 skeleton rows (avatar circle + two lines of text)
- Message area: 3 skeleton message bubbles (alternating left/right)

Use Tailwind `animate-pulse` + `bg-gray-200 rounded` — no new dependencies needed.

**Acceptance criteria:** No blank flash on page load. Smooth transition from skeleton to content.

---

## MSG-007 — Message Length Limit

**Files:** `app/messages/page.tsx`, `app/api/messenger/threads/[threadId]/messages/route.ts`
**Problem:** No message length limit. API accepts any length. Could cause DB or rendering issues.

**Fix:**
- API: reject messages over 5000 characters with `400 Bad Request`
- UI: show character counter `"432 / 5000"` below the textarea, turning red at 4500+
- Disable Send button when over limit

**Acceptance criteria:** Cannot send messages over 5000 chars. Counter visible in UI.

---

## MSG-008 — Unread Badge on Navigation

**Problem:** Unread count is tracked in DB per thread but never shown in the main site navigation. Users don't know they have new messages unless they go to `/messages`.

**Files to touch:**
- Find the main navigation component (likely `app/components/navigation/` or `app/layout.tsx`)
- `app/api/messenger/threads/route.ts` — already returns unread count per thread

**Fix:**
- Add a lightweight API call on nav mount: `GET /api/messenger/threads?limit=1` — sum `unread_count` across threads
- Show a red dot or count badge on the "Messages" nav link
- Poll every 30s (not 4s — this is nav, not chat)
- Only fetch if user is logged in

**Acceptance criteria:**
- Red badge visible on nav Messages link when there are unread messages
- Badge disappears after visiting `/messages` and reading threads

---

## Execution Order

Work through tasks in this order — each is independent and can be committed separately:

1. **MSG-001** — hardcoded URL (5 min, low risk)
2. **MSG-002** — hardcoded email (5 min, low risk)
3. **MSG-007** — message length limit (30 min)
4. **MSG-005** — empty state (30 min)
5. **MSG-006** — loading skeletons (45 min)
6. **MSG-003** — exponential backoff (1h)
7. **MSG-004** — optimistic send (1h)
8. **MSG-008** — unread badge on nav (1h)

---

## Validation After Each Task

```bash
pnpm lint && pnpm tsc --noEmit
```

Lint warnings are expected (existing repo-wide). Only new errors introduced by your changes are blockers.

---

## Out of Scope (Future Sprint)

- File/attachment support (schema ready, big feature)
- Typing indicators (needs WebSocket/SSE)
- Admin message moderation
- Full-text search within messages
- Per-user notification preferences
