# Feature: Pre-Computed Talent Profile Evaluation (Approval-Time Scoring Cache)

## Status
`VERIFIED ON DEV` (Aug 28, 2026) — implemented and verified end-to-end on branch
`claude/talent-profile-precomputed-scoring`. Migration applied to dev; backfill run against all
47 approved talents (47/47 covered, CV text extracted for all 47). Search-path verified to consume
the cache with zero re-evaluation calls. Not yet applied to prod; not yet committed. CV extraction
is in scope for v1 (confirmed by Benoit/Juhan) and is implemented and verified.

## Business Goal
`/recruiter/dashboard/find-talents` re-evaluates every candidate's profile with the LLM on
**every single search**. For a search that scores 30 candidates, that's 30 LLM calls, every time,
even when the underlying talent pool hasn't changed since the last search five minutes ago. This
burns tokens/cost linearly with search volume instead of with talent-pool growth, and it's pure
waste — a talent's skills and bio don't change between two searches an hour apart.

The fix: evaluate a talent's profile with AI **once**, at the moment they're approved, and persist
the result. Every subsequent recruiter search reuses that cached evaluation instead of re-reading
and re-scoring the raw profile. Cost then scales with (approvals + profile edits), not with
(searches × candidates scored).

This is the same principle already named in `docs/features/ai-matching-engine.md` ("LLM
understands once, code calculates, LLM explains") but scoped to ship independently and much
sooner — it does not require the scorecard/freeze/comparative-ranking machinery that doc
describes. The JSONB summary this feature produces becomes a direct input to that bigger engine
later; nothing here needs to be redone.

## User Story
> As a **recruiter**, I want candidate searches to return quickly and cheaply without re-analyzing
> every talent's full profile from scratch, so the team can run more searches without burning AI
> budget on redundant work.

> As an **admin**, when I approve a talent, I want their profile evaluated once so every future
> recruiter search benefits from that analysis immediately.

---

## Current Behavior (verified against live code, Aug 28, 2026)

`app/api/recruiter/top-talents/route.ts`:
1. SQL pre-filter narrows the approved/available pool to `MAX_TALENTS_TO_CONSIDER = 120`.
2. A cheap lexical relevance score (`getCheapRelevanceScore`, no LLM) trims that to
   `MAX_TALENTS_TO_SCORE = 30`.
3. **Every one of those 30** gets its own `computeMatchScore` call (`app/lib/ai/match-score.ts`) —
   a fresh Groq LLM call per talent, batched 3-at-a-time with a 1s delay between batches
   (route.ts:323-399). That's up to 30 LLM calls, ~9+ seconds of batch delay alone, on **every**
   search, regardless of whether the same 30 talents were just scored in the previous search.
4. The prompt sends the talent's raw `description`/`about_work` bio text fresh every time
   (route.ts:328, 364). CV text (`cv_url`) is **not** read anywhere in this path today — it isn't
   parsed at all, so CV content currently has zero influence on match scores despite being 100%
   populated across approved talents (per `ai-matching-engine.md`'s data audit).
5. Nothing about a talent's evaluation is cached or reused between searches. Two recruiters
   searching for similar roles an hour apart pay for the same 30 LLM calls twice.

There is no existing pre-computed scoring, evaluation cache, or "understood profile" concept
anywhere in the codebase today — `talents` has no `ai_profile_summary`-shaped column, and no
`cv_text` column exists (confirmed: zero references in `app/`, `lib/`, or migrations).

## Acceptance Criteria

1. When a talent is approved (single approval via `app/api/admin/talents/status/route.ts`, or bulk
   approval via `app/api/admin/talents/bulk-approve/route.ts`), their profile is evaluated by the
   LLM **once** and the structured result is persisted on `goodhive.talents`.
2. The evaluation step reads the talent's skills, bio (`description`/`about_work`),
   `resume_experience`/`resume_education`/`resume_projects`/`resume_certifications`, and — new —
   extracts and stores CV text from `cv_url` (reusing the existing `app/api/pdf-to-profile`
   extraction path, e.g. its `pdf-import-utils.ts` helpers `chunkTextForAI`/`mergeExtractedResumeFacts`)
   so CV content finally contributes to matching, at no extra cost to the search path since it's
   read once.
3. A failed evaluation **never blocks or fails talent approval**. Approval always succeeds; a
   failed/missing evaluation is retryable and self-heals (see Acceptance Criteria 6).
4. `app/api/recruiter/top-talents/route.ts` uses the stored evaluation instead of re-reading and
   re-sending raw bio/CV text to the LLM on every search. Per-search LLM input shrinks from
   "full bio prose" to "compact structured summary" for every candidate that has one.
5. If a talent in the scoring shortlist has no cached evaluation yet (approved before this shipped,
   or evaluation previously failed), the search **still returns a score for them** — fall back to
   today's raw-bio prompt for just that candidate, and queue them for evaluation so the next search
   is fast for them too. Search must never silently drop a candidate for lacking a cache entry.
6. When an approved talent edits profile fields that feed the evaluation (skills, bio,
   resume_experience/education/projects, or re-uploads a CV) via `app/api/talents/my-profile`, the
   cached evaluation is marked stale rather than left silently wrong. Staleness is resolved lazily
   (recomputed next time the talent surfaces in a search, or via a small on-demand endpoint /
   backfill script) — talents are never blocked from saving their profile waiting on AI.
7. Existing already-approved talents (the current pool) are backfilled with an evaluation via a
   one-off script before this ships, so day one of the new search path has full coverage.
8. `computeMatchScore` / `app/api/companies/top-candidates` (the shared company-side surface) keep
   compiling and behaving exactly as today — this feature is additive to the recruiter path; it
   does not change the company-side match-score contract. (It may optionally also benefit later,
   out of scope for this iteration.)
9. Measurable outcome: a repeat search against an unchanged talent pool issues **zero** additional
   LLM evaluation-understanding calls for talents already cached — verified by `groq_usage` row
   counts (`lib/ai/groq.ts` already logs every call) before/after a same-query re-run.

## Out of Scope (this iteration)
- The full Hiring Scorecard / comparative-ranking engine from `ai-matching-engine.md` — this
  feature produces the cached "profile understanding" layer that engine would consume later, but
  does not implement scorecards, gating caps, or Step 3 ranking.
- Changing `computeMatchScore`'s use on `app/api/companies/top-candidates` — untouched.
- Re-evaluating on every minor profile field change in real time — staleness is handled lazily, not
  synchronously on save.
- A dedicated admin UI to view/edit a talent's cached evaluation — internal data only for now.
- Vector/embedding retrieval — still deferred per `ai-matching-engine.md`'s existing rationale.

## Impacted Files / Modules

### New Files
- `app/lib/ai/evaluate-talent-profile.ts` — the one-time evaluation: builds the prompt from skills
  + bio + resume_* fields + extracted CV text, calls `generateWithFallback`, parses/validates the
  structured JSON result, and writes it to `goodhive.talents`. Exposes
  `evaluateAndStoreTalentProfile(userId: string)`, idempotent and safe to re-run.
- `app/lib/ai/extract-cv-text.ts` (or reuse/export a function from
  `app/api/pdf-to-profile/pdf-import-utils.ts` if it's already structured for reuse) — fetches
  `cv_url`, extracts text (existing `pdf-parse` / remote extractor fallback), returns plain text
  capped at a sane length for prompt budgets.
- `scripts/backfill-talent-profile-evaluations.ts` — one-off: finds all `approved = true` talents
  with no cached evaluation, runs `evaluateAndStoreTalentProfile` with modest concurrency (match the
  existing 3-at-a-time / 1s-delay pattern already used in `top-talents/route.ts`).
- `app/api/admin/talents/evaluate-pending/route.ts` (optional but recommended) — admin-triggered
  endpoint that evaluates the next N talents needing evaluation (missing or stale). Doubles as the
  backfill mechanism and the staleness-resolution mechanism without needing a cron job in v1.

### Modified Files
- `app/api/admin/talents/status/route.ts` — after the `approved = true` UPDATE succeeds (around
  line 122-130), call `evaluateAndStoreTalentProfile(userId)` inline, wrapped in try/catch exactly
  like the existing `sendReviewEmailSafely` pattern already in this file — a failure logs and moves
  on, never blocks the approval response. (This route also writes `goodhive.admin_audit_log`; no
  change needed there — evaluation is a separate concern from the audit trail.)
- `app/api/admin/talents/bulk-approve/route.ts` — same trigger after the batch `approved = true`
  UPDATE, run with `Promise.allSettled` at limited concurrency (do not fire N unbounded parallel LLM
  calls for a large batch approval).
- `app/api/recruiter/top-talents/route.ts` — `TalentRow` SELECT gains
  `ai_profile_summary, ai_profile_evaluated_at, ai_profile_stale`; the per-candidate scoring block
  (lines ~326-393) prefers the cached summary when present and fresh, falls back to today's raw-bio
  behavior when absent/stale, and triggers a best-effort background evaluation for any fallback
  candidate so they're cached for next time.
- `app/lib/ai/match-score.ts` — `ComputeMatchScoreParams` gains an optional
  `talentProfileSummary` (structured, compact) as an alternative to / supplement of `talentBio`;
  prompt builder prefers the compact summary when supplied.
- `app/api/talents/my-profile/route.ts` — on UPDATE, if any of skills/description/about_work/
  resume_experience/resume_education/resume_projects/resume_certifications/cv_url changed for an
  already-approved talent, set `ai_profile_stale = true`. Cheap flag flip, no AI call on the save
  path.

## API Changes
| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/talents/evaluate-pending` | *(new, optional)* Admin-only. Evaluates up to N approved talents missing/stale evaluations. Body: `{ limit?: number }`. |

No changes to the public contract of `POST /api/recruiter/top-talents` — request/response shape is
unchanged; only what feeds the LLM internally changes.

## DB Changes
```sql
ALTER TABLE goodhive.talents
  ADD COLUMN IF NOT EXISTS cv_text TEXT,
  ADD COLUMN IF NOT EXISTS ai_profile_summary JSONB,
  ADD COLUMN IF NOT EXISTS ai_profile_summary_version SMALLINT,
  ADD COLUMN IF NOT EXISTS ai_profile_evaluated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_profile_stale BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_talents_needs_evaluation
  ON goodhive.talents (approved)
  WHERE approved = true AND (ai_profile_evaluated_at IS NULL OR ai_profile_stale = true);
```
- `ai_profile_summary_version` guards against a future prompt/schema change silently mis-parsing
  old cached JSON — bump it whenever the evaluation prompt's output shape changes, and treat a
  stored version below current as equivalent to missing.
- `cv_text` is extracted once at evaluation time and persisted so it never needs re-extraction —
  directly reusable later by `ai-matching-engine.md`'s Phase 0 if/when that work starts, so this
  migration effectively also delivers that prerequisite.

## AI / External Service Changes
- Model: existing Groq pool via `generateWithFallback` (`lib/ai/groq.ts`) — no new provider.
- New prompt (`evaluate-talent-profile.ts`): one call per talent, at approval time only. Input:
  skills + bio + resume_* + CV text (capped, e.g. ~4-6K tokens per the budget `ai-matching-engine.md`
  already measured for CV-inclusive prompts). Output: structured JSON — normalized skill list,
  inferred seniority/years-of-experience, key strengths, notable domains/projects, a short
  plain-English summary paragraph, and confidence/coverage flags (e.g. "CV text unavailable").
  Use `response_format: json_schema` if/when the pool's schema-capable models are wired up (see
  `ai-matching-engine.md` constraint #2); otherwise reuse the existing `tryParseModelJson` fallback
  pattern already in `match-score.ts`.
- Cost shift, not just cost reduction: today's cost is `searches × candidates_scored` LLM calls.
  After this: `approvals + profile_edits` LLM calls for the "understanding" step (one-time, heavier
  prompt since it now includes CV), plus `searches × candidates_scored` calls for the matching step
  — but each of *those* calls now sends a compact structured summary instead of raw bio prose,
  cutting per-call token volume substantially. At the current ~47 approved talents, one-time
  evaluation cost is a rounding error next to what repeated full-bio re-scoring costs across many
  searches.
- Stretch (flag as Phase 2, not required for this doc's acceptance criteria): use the cached
  structured summary for a **code-only** pre-rank (no LLM) to shrink the shortlist from 30 down to
  ~10 before the per-search LLM match call, the same way `getCheapRelevanceScore` already does
  lexically today — cutting per-search LLM call count, not just per-call size.

## Validation Commands
```bash
pnpm lint
pnpm tsc --noEmit
# Manual: approve a talent in /admin/talent-approval, confirm ai_profile_summary populates
# Manual: run a recruiter search twice in a row against an unchanged pool; confirm groq_usage
#         gains zero new "evaluate-profile" feature rows on the second run (only match-score calls)
# Manual: edit an approved talent's skills via /talents/my-profile; confirm ai_profile_stale flips true
```

## Open Questions / TBDs
- **Trigger mechanics for bulk approval:** await evaluations inline (bounded concurrency, matching
  the existing 3-at-a-time pattern) vs. a genuinely async queue. Recommend starting with bounded
  inline concurrency — no new infra — and revisiting only if bulk-approve batches grow large enough
  to risk the function timeout.
- **CV extraction reliability:** `ai-matching-engine.md` flagged this as unverified — "are the 47
  stored `cv_url` files real CVs, and are they reachable/parseable?" Needs a sample run before
  committing scope. If extraction fails for a talent, evaluation should still proceed using
  skills/bio/resume_* alone rather than blocking on CV.
- **Staleness resolution timing:** lazy-on-next-search vs. a scheduled sweep via
  `/api/admin/talents/evaluate-pending` on a cron. V1 can be manual/on-demand; revisit if stale
  profiles pile up unnoticed.
- Should `ai_profile_summary` also be surfaced to admins on `/admin/talent/[user_id]` for
  visibility/debugging? Not required for acceptance, but likely a fast, high-value add-on once this
  lands.

## Review Checklist
- [ ] Acceptance criteria met
- [ ] No unrelated files changed
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Docs updated
