# Feature: GoodHive AI Matching Engine

## Status
`PLANNING` (Aug 26, 2026) — spec received from Benoit, assessed against the live codebase.

## Business Goal
Replace the single opaque "match %" with a recruiter-grade first-pass screening engine: a frozen
Hiring Scorecard per job, per-criterion evidence-based evaluation, deterministic weighted scoring
with gating caps, and a comparative ranking pass — so recruiters see *why* someone ranks where they
do and what to validate in interview.

Core principle (from spec §20): **LLM understands. JSON structures. Code calculates. LLM compares
and explains. Human decides.**

## User Story
> As a **recruiter**, I want an explainable shortlist of 5–10 candidates with per-criterion scores,
> supporting evidence, critical gaps and interview questions, so I can trust the shortlist without
> re-reading every CV.

---

## Verified Constraints (measured Aug 26, 2026 — not assumptions)

These three findings should drive sequencing. Each was measured, not estimated.

### 1. We do not have CV text for most candidates — this is the binding quality constraint

| Field (of 47 approved talents) | Coverage |
|---|---|
| `cv_url` | **47/47 (100%)** — a file link, not text |
| `resume_experience` | 10/47 |
| `resume_education` | 10/47 |
| `resume_projects` | 6/47 |
| `about_work` > 200 chars | 38/47 |
| `skills` | 46/47 |

The spec's evaluation model rests on distinguishing STRONG / MODERATE / WEAK / NO evidence
(§7). That is unanswerable from a 200-word bio and a comma-separated skills string — the only
input we hold for ~37 of 47 talents. **Prompt quality cannot compensate for absent input.**

The unlock is that `cv_url` is 100% populated, and we already own a working PDF→text path
(`app/api/pdf-to-profile`: local `pdf-parse`, remote extractor fallback, `chunkTextForAI`).
Extracting stored CVs into a text column is therefore **Phase 0 and a hard prerequisite** for
Phases 1–3 producing meaningful output.

### 2. Structured output is available — but only on 3 of 5 pool models

Tested against the live API:

| Model | `json_schema` |
|---|---|
| `qwen/qwen3.8-27b` | ✅ |
| `openai/gpt-oss-120b` | ✅ |
| `openai/gpt-oss-20b` | ✅ |
| `qwen/qwen3.6-27b` | ❌ fails schema validation |
| `groq/compound-mini` | ❌ unsupported |

Every stage of this spec is a JSON contract, so `response_format: { type: "json_schema" }` should
replace the current regex-and-hope parsing (`tryParseModelJson`). This requires
`generateWithFallback` to accept a schema and to **restrict the rotation pool** to schema-capable
models when one is supplied. `json_object` also works but requires the word "json" in the messages.

### 3. Free-tier rate limits make the naive per-candidate loop unshippable

Per-candidate Step 2 ≈ frozen scorecard (~800 tok) + CV text (~4,000 tok) + instructions (~700) +
output (~800) ≈ **~6.3K tokens**. Against the free tier (8K TPM per model; schema-capable
aggregate ≈ 24K TPM, ≈2.4M TPD):

- 47 candidates × 6.3K ≈ **~296K tokens per search**
- ≈ **12+ minutes wall-clock** for one search
- ≈ **8 full searches per day** before the daily budget is gone

Mitigations, in order: hard-constraint + lexical prefilter down to ~10–15 candidates before Step 2;
cache evaluations keyed on `(scorecard_id, talent_id)` so re-runs and pagination are free; run as a
background job with streamed progress rather than one blocking request. Beyond that, production use
realistically needs the paid Developer tier — worth pricing before committing to a launch date.

### 4. Scale — build for 47, design for thousands

Spec §6 proposes embeddings for retrieval. At 47 approved talents that layer is unnecessary, and
**Groq has no embeddings endpoint** (`lib/gemini.ts:getEmbedding` throws by design). If semantic
retrieval is wanted later, the natural home is Vertex AI — Google Cloud credentials and a RAG
corpus already exist (`lib/ragEngine.ts`). **Recommendation: do not build retrieval now.** Lexical
prefilter plus hard constraints is sufficient well past 100 talents.

---

## Architecture Mapping

| Spec stage | Where it lands |
|---|---|
| LLM Step 1 — Job → Scorecard | new `app/lib/ai/scorecard.ts` |
| Recruiter validation / freeze | new UI on `/recruiter/dashboard/find-talents` + `hiring_scorecards` table |
| Retrieval | **deferred** — hard constraints + `getCheapRelevanceScore` (already exists) |
| LLM Step 2 — Scorecard + CV → Evaluation | new `app/lib/ai/evaluate-candidate.ts` |
| Application code — weights, gates, caps | new `app/lib/matching/score.ts` — **pure, unit-testable, no LLM** |
| LLM Step 3 — Relative ranking | new `app/lib/ai/rank-candidates.ts` |
| UI breakdown + evidence (§13) | rework of `app/recruiter/dashboard/find-talents/page.tsx` |

`computeMatchScore` (`app/lib/ai/match-score.ts`) stays as-is for now — it is shared with
`app/api/companies/top-candidates` and `app/api/ai/match-score`. The new engine is additive; do not
rip out the old scorer until the new path is validated against a benchmark.

## Phases

**Phase 0 — CV text ingestion (prerequisite).**
Backfill script extracting text from the 47 `cv_url` PDFs into a new `talents.cv_text` column,
reusing `app/api/pdf-to-profile`'s extraction. Re-extract on CV upload. Without this, Phases 1–3
score bios, not CVs.

**Phase 1 — Scorecard + deterministic scoring.**
Step 1 prompt with `json_schema`; `hiring_scorecards` table; Step 2 evaluation; pure scoring module
with weights, gating and caps; store `raw_score`, `score_cap`, `final_score`, `cap_reason`.
Recruiter sees the breakdown. **Ship without Step 3** — deterministic scores plus evidence are
already a large improvement over today.

**Phase 2 — Recruiter overrides (§14) + confidence (§15).**
Editable scorecard before freeze; `confidence` separated from fit; low-confidence/high-potential
flagged for review rather than dropped.

**Phase 3 — Relative ranking (§12).** Step 3 comparative pass over the scored set.

**Phase 4 — Benchmarks (§16/§17).** LatiGen Founding CTO as the first fixture. Assert *ranking
bands* (strong / potential / weak / not relevant), never exact scores — LLM output is not
deterministic, so exact-score assertions will flap and get muted.

**Phase 5 — Feedback loop (§18).** Capture recruiter/client accept-reject to calibrate gates.

## DB Changes
- `talents.cv_text TEXT` (Phase 0)
- `hiring_scorecards` — `id, recruiter_id, job_description, scorecard jsonb, frozen_at, created_at`
- `candidate_evaluations` — `id, scorecard_id, talent_id, evaluation jsonb, raw_score, score_cap, final_score, cap_reason, confidence, created_at`, unique on `(scorecard_id, talent_id)` for the cache
- Benchmarks (Phase 4) can live as repo fixtures, not tables.

## AI / External Service Changes
- Model: existing Groq pool, **restricted to schema-capable models** for structured stages.
- `generateWithFallback` gains an optional `jsonSchema` option; when set, filter the rotation pool.
- Gating thresholds (§9: 20/50, 40/60, 40/70) belong in a config constant, not inline — the spec
  explicitly expects calibration.

## Out of Scope (this iteration)
- Embedding/semantic retrieval (§6) — deferred, see Constraint 4.
- Automatic hard exclusions. Per §10, "not evidenced" ≠ "does not have it"; exclusion stays a
  deliberate recruiter override.
- Replacing `computeMatchScore` on the company-side surfaces.

## Validation Commands
```bash
npx tsc --noEmit
npx next lint
# Phase 1: unit-test app/lib/matching/score.ts against the §9 worked examples (no LLM needed)
```

## Open Questions / TBDs
- **Blocking:** free tier caps a full search at ~12 min / ~8 searches per day. Move to Groq
  Developer tier, or accept background-job semantics with a much smaller candidate set?
- **Blocking Phase 0 quality:** are the 47 stored `cv_url` files real CVs, and are they reachable
  and parseable? Needs a sample extraction run before committing to Phase 0 scope.
- Should recruiters be able to save and reuse a scorecard across searches for the same client?
- §10 hard requirements: confirm the UI wording distinguishes "not evidenced" from "absent" — this
  is the spec's most easily lost nuance and the one most likely to cause unfair rejection.

## Review Checklist
- [ ] Acceptance criteria met
- [ ] No unrelated files changed
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Docs updated
