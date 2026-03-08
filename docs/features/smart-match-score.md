# Feature: Smart Job-Talent Match Score (AI)

## Status
`PLANNED`

## Business Goal
Benoit's #1 innovation request: companies waste time reviewing bad-fit candidates; talents apply to jobs they'll never get. A real-time AI match score reduces friction on both sides and makes GoodHive feel intelligent — not just a job board.

## User Stories
> As a **company**, I want to see a match score (%) for each talent against my job posting so I can instantly prioritize who to contact.

> As a **talent**, I want to see how well I match a job before applying so I don't waste my time.

## How It Works (Architecture)

1. When a company views `app/talents/page.tsx` with a job filter, or when a talent views `app/jobs/[id]/page.tsx`:
2. Client sends `POST /api/ai/match-score` with `{ jobId, talentId }`
3. API fetches the job description + required skills + the talent's skills + bio from DB
4. Builds a structured Gemini prompt:
   ```
   Job: [title, description, required skills, experience level]
   Talent: [skills, bio, years of experience, certifications]

   Return JSON: { score: 0-100, reasons: string[], gaps: string[] }
   ```
5. Gemini returns `{ score: 82, reasons: ["Strong React skills", "3yr exp match"], gaps: ["No TypeScript"] }`
6. Cached in memory or DB for 1 hour (job+talent pair) — don't re-call Gemini for same pair
7. Displayed as a color-coded badge: 🟢 80%+, 🟡 50-79%, 🔴 <50%

## Acceptance Criteria
1. `POST /api/ai/match-score` returns `{ score: number, reasons: string[], gaps: string[] }` for a given `{ jobId, talentId }` pair
2. Response cached in `match_score_cache` table (or Redis if available) with 1-hour TTL
3. Company talent list shows match score badge per talent when a job is selected/filtered
4. Talent job detail page shows "Your match score" card with reasons and gaps
5. Score computation uses Gemini 1.5 Flash (cheaper/faster than Pro for this use case)
6. If Gemini call fails, return `{ score: null }` gracefully — don't break the UI
7. Rate limit: max 10 score computations per minute per company/talent

## Out of Scope
- Bulk matching across all talents × all jobs (too expensive)
- Storing historical match scores for analytics (Phase 2)
- Custom matching weights per company preference

## Impacted Files / Modules

### New Files
- `app/api/ai/match-score/route.ts` — POST handler
- `app/lib/ai/match-score.ts` — Gemini prompt builder and response parser
- `app/components/MatchScoreBadge.tsx` — UI badge component

### Modified Files
- `app/talents/page.tsx` — add match score badge to talent cards (when company logged in with job filter)
- `app/jobs/[id]/page.tsx` — add "Your match score" card (when talent logged in)
- DB: new table `match_score_cache (id, job_id, talent_id, score, reasons jsonb, gaps jsonb, expires_at, created_at)`

## API Spec

```
POST /api/ai/match-score
Auth: Iron Session (talent or company)
Body: { jobId: string, talentId: string }
Response: {
  success: true,
  data: {
    score: number | null,        // 0-100
    reasons: string[],           // why it's a good match
    gaps: string[],              // what's missing
    cached: boolean              // was this from cache?
  }
}
```

## DB Changes

```sql
CREATE TABLE match_score_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  score INTEGER,
  reasons JSONB DEFAULT '[]',
  gaps JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, talent_id)
);
CREATE INDEX ON match_score_cache(job_id, talent_id, expires_at);
```

## Gemini Prompt Template

```
You are a technical recruiter AI. Given a job description and a talent profile, calculate how well this talent matches the job.

JOB:
Title: {{jobTitle}}
Description: {{jobDescription}}
Required Skills: {{requiredSkills}}
Experience Level: {{experienceLevel}}
Location: {{location}}

TALENT:
Skills: {{talentSkills}}
Bio: {{talentBio}}
Years of Experience: {{yearsExperience}}
Previous Roles: {{previousRoles}}

Return ONLY valid JSON:
{
  "score": <integer 0-100>,
  "reasons": [<max 3 short strings explaining why they match>],
  "gaps": [<max 3 short strings explaining what's missing>]
}
```

## AI Cost Estimate
- Gemini 1.5 Flash: ~$0.00015 per 1K input tokens, ~$0.0006 per 1K output tokens
- Typical prompt: ~500 tokens in, ~150 tokens out → ~$0.00016 per call
- With 1-hour cache, 1000 unique pairs/day = ~$0.16/day — negligible

## Validation Commands
```bash
pnpm lint
pnpm tsc --noEmit
```

## Open Questions / TBDs
- TBD: Do we have `jobs` and `talents` table column names confirmed? Check `app/lib/fetch-talent-data.ts` and `app/lib/fetch-company-jobs.ts`
- TBD: Which field stores skills — array, JSON, or comma-separated string?
- TBD: Should score be visible to both talent AND company, or only company?
