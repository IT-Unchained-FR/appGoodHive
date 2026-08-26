# Feature: AI Talent Finder — Location & Language Hard Constraints

## Status
`PLANNING` (Aug 26, 2026)

## Business Goal
`/recruiter/dashboard/find-talents` currently returns remote talents in other countries for onsite roles, and ignores stated language requirements. Recruiters lose trust in the shortlist and fall back to manual search, which defeats the point of the AI finder. Constraints that are contractual (must be onsite in Paris, must speak French) must behave as **filters**, not as soft signals an LLM may weigh away.

## User Story
> As a **recruiter**, I want onsite roles to only surface talents who can actually work at that location, and language requirements to be respected, so the shortlist is actionable without me re-checking every candidate.

## Root Cause (verified Aug 26, 2026)

Four independent defects, in order of impact:

1. **The model never receives location or language.**
   `app/api/recruiter/top-talents/route.ts:259-266` calls `computeMatchScore` with only
   `jobDescription`, `talentBio`, `talentSkills`. `city`/`country` are SELECTed and rendered in
   the UI but never enter the prompt. `remote_only` and `resume_languages` are not even
   SELECTed. `app/lib/ai/match-score.ts:56-73` has no prompt slots for them.
   The LLM is not ignoring the constraint — it never sees it.

2. **Two prompt fields are hardcoded to dead values.**
   Same call site passes `jobTitle: "Talent Search"` and `jobSkills: []`. Every search tells the
   model the job title is literally "Talent Search" with no required skills.

3. **No structured recruiter input.**
   `app/recruiter/dashboard/find-talents/page.tsx:332,377` posts only free-text
   `{ jobDescription }`. "Onsite in Berlin, must speak German" competes with the rest of the prose.

4. **No hard filter at any layer.** SQL filters on `approved`/`availability` only.

Latent, not yet biting: `MAX_TALENTS_TO_CONSIDER = 120` with `ORDER BY last_active DESC` would
select by recency rather than fit — currently harmless because only 47 talents are approved, but
it becomes a real defect past 120. `MAX_TALENTS_TO_SCORE = 30` **is** already binding.

## Data Reality (production query, Aug 26, 2026)

| Field | Coverage (of 47 approved) | Notes |
|---|---|---|
| `country` | 47/47 (100%) | Clean ISO-2 (`FR` 32, `IN` 5, `BD` 2, `US` 2, …) — safe to filter on |
| `city` | 47/47 (100%) | Free text, not normalized |
| `remote_only` | 32/47 set, 17 true | 15 NULL = unknown, must not be treated as false |
| `resume_languages` | 14/47 set, several are literally `'[]'` | **Under 10 talents have real data** |

`resume_languages` is a JSON string of `{language, proficiency}`, populated **only** by the
resume-import path (`app/api/pdf-to-profile`). Proficiency is inconsistent free text
(`native`, `fluent`, `Business proficiency`, `Intermediate`).

**Consequence:** country is filterable today. Language is **not** — hard-filtering on it would
exclude ~80% of the pool for missing data, which is worse than the current bug.

## Acceptance Criteria

1. Recruiter can specify `workMode` (`onsite` | `hybrid` | `remote` | `any`), `country`, `city`,
   and `requiredLanguages[]` alongside the free-text description.
2. When `workMode` is `onsite` or `hybrid` **and** a country is given, SQL excludes talents in a
   different country and talents with `remote_only = true`. `remote_only IS NULL` is retained
   (unknown ≠ disqualified).
3. Hard constraints are enforced **after** scoring as well: a candidate violating a hard filter is
   never returned regardless of LLM score.
4. Constraints are injected into the prompt so `reasons`/`gaps` reference them, and the prompt caps
   the score when a constraint is unmet.
5. `jobTitle` and `jobSkills` carry real values, not `"Talent Search"` / `[]`.
6. Language is enforced **softly**: talents with known non-matching languages are down-ranked and
   flagged in `gaps`; talents with no language data are kept and surfaced as
   "language not specified" rather than silently dropped.
7. Zero results from an over-tight filter returns an explicit "no talent matches these constraints"
   state with the constraint that eliminated everyone — never a silent fallback to unfiltered results.
8. Existing behaviour is preserved when no constraints are supplied (`workMode: "any"`).

## Out of Scope
- ~~Adding a structured `languages` field to the talent profile form~~ — **done Aug 26, 2026.**
  See "Structured Languages" below.
- City-level radius / commute-distance matching. Country-level only for now.
- Backfilling `remote_only` for the 15 NULL rows.
- Reworking `MAX_TALENTS_TO_CONSIDER` ordering (separate task; not yet binding at 47 talents).

## Impacted Files / Modules
- `app/recruiter/dashboard/find-talents/page.tsx` — constraint inputs; send structured body.
- `app/api/recruiter/top-talents/route.ts` — parse/validate constraints, SQL pre-filter,
  SELECT `remote_only` + `resume_languages`, post-filter guard, pass real title/skills.
- `app/lib/ai/match-score.ts` — extend `ComputeMatchScoreParams` with optional
  `location`, `workMode`, `requiredLanguages`, `talentCountry`, `talentLanguages`; add prompt
  slots and the score-cap rule.
- `app/api/companies/top-candidates/route.ts` — **shares `computeMatchScore`**; must keep
  compiling. New params are optional, so it is unaffected, but verify.

## API Changes
| Method | Path | Description |
|---|---|---|
| POST | `/api/recruiter/top-talents` | Body gains optional `workMode`, `country`, `city`, `requiredLanguages[]`, `jobTitle`, `jobSkills[]`. Existing `{ jobDescription }` body stays valid. |

## DB Changes
- None. `country`, `city`, `remote_only`, `resume_languages` all already exist on `goodhive.talents`.

## AI / External Service Changes
- Model: unchanged — the shared Groq pool via `generateWithFallback`.
- Prompt: `app/lib/ai/match-score.ts` gains a constraints block. Keep it above the JSON contract
  so it is not truncated on tight token budgets.
- Cost/rate-limit: SQL pre-filtering **reduces** LLM calls (fewer candidates reach scoring), which
  helps against the 8K TPM free-tier ceiling. No increase expected.

## Validation Commands
```bash
npx tsc --noEmit
npx next lint
# Manual: onsite + FR must return zero non-FR talents and zero remote_only=true talents
```

## Open Questions / TBDs
- **RESOLVED Aug 26, 2026:** a controlled vocabulary now backs the languages field
  (`app/constants/languages.ts`). Coverage is still the limit — only **5 of 47 approved talents**
  have usable language data — but the field is now structured, discoverable and normalised, so
  coverage grows as talents edit their profiles. A prompt to fill it in would accelerate that.
- **TBD:** should `hybrid` filter identically to `onsite`? Assumed yes (both require presence).
- **TBD:** `city` is unnormalized free text. Country-level filtering only until it is cleaned.

## Review Checklist
- [ ] Acceptance criteria met
- [ ] No unrelated files changed
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Docs updated

---

## Structured Languages (shipped Aug 26, 2026)

The languages editor already existed and was wired end-to-end (form → API → `resume_languages` →
public profile). Two things made it useless for matching:

1. **Both fields were free text.** Production held `french` / `French` / `FRENCH` as three distinct
   values, `Bangali` for Bengali, 16 spellings of five proficiency levels (including
   `TOEIC 975/990`), and — because the resume importer scraped CV "Languages" sections —
   `Python`, `Bash`, `Solidity`, `Rust` and `C/C++` stored as spoken languages.
2. **It was buried** at the bottom of the resume-refinement panel, labelled "Optional".

### What changed
- `app/constants/languages.ts` — 70 languages (ISO 639-1 + aliases incl. endonyms) and five
  CEFR-mapped proficiency levels with a `rank`. `normalizeLanguage` / `normalizeProficiency` map
  legacy free text onto them; unrecognised input returns `null`, which is how programming
  languages get excluded.
- `StructuredProfileEditor` — both inputs are now `<select>`s. Legacy values are normalised for
  display, and an entry that cannot be matched shows an inline warning rather than being silently
  dropped. Section copy now states the benefit ("Recruiters filter on this").
- `app/lib/matching/constraints.ts` — `parseTalentLanguages` returns
  `{ code, label, proficiencyRank }`; both sides of a comparison go through the vocabulary.
- Recruiter finder — language free-text replaced by a picker over the same list, with chips.

### Matching semantics
- Required language met at **B2 (professional) or above**; below that is flagged, not excluded.
- **Unknown is never punished.** No languages on profile, or a language with no stated level,
  costs nothing and surfaces as a gap to verify.
- Missing language costs 25 points; listed-but-below-B2 costs 10.

### Known follow-up
`resume_languages` still holds legacy free text for existing rows. Reads are normalised, so nothing
is broken, but a one-off backfill writing canonical values would let the column be queried in SQL
rather than filtered in application code.
