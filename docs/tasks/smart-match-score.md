# Smart Job-Talent Match Score (AI) — Codex Task Plan

**Status:** Ready for Codex execution
**Created:** 2026-03-09
**Priority:** P0 — Benoit's #1 innovation request
**Feature doc:** `docs/features/smart-match-score.md`
**Architecture:** Read `docs/architecture/overview.md` before touching code

---

## Context

Companies waste time reviewing bad-fit candidates. Talents apply to jobs they'll never get. A Gemini-powered match score (0–100) shown on the talent list and job detail page solves this — making GoodHive feel intelligent, not just a job board.

### Confirmed DB Field Names (verified from codebase)

**Talent fields** (`goodhive.talents` table):
- `skills` — comma-separated string e.g. `"React,TypeScript,Node.js"`
- `description` — bio (base64 encoded — decode with `safeBase64Decode()` from `app/api/talents/my-profile/route.ts`)
- `first_name`, `last_name`
- `years_experience` — computed via `calculateYearsExperience()` from parsed experience

**Job fields** (`goodhive.job_offers` table):
- `title` — job title
- `description` — job description
- `skills` — comma-separated string e.g. `"React,TypeScript"`
- `city`, `country`

---

## MATCH-001 — DB Migration: Create Cache Table

**File to create:** `db/migrations/add-match-score-cache.sql`

```sql
CREATE TABLE IF NOT EXISTS goodhive.match_score_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  talent_id UUID NOT NULL,
  score INTEGER,
  reasons JSONB DEFAULT '[]',
  gaps JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, talent_id)
);
CREATE INDEX IF NOT EXISTS idx_match_score_cache_lookup
  ON goodhive.match_score_cache(job_id, talent_id, expires_at);
```

**Run this migration against the dev DB before proceeding.**
Connection string is in `DATABASE_URL` env var.

---

## MATCH-002 — Gemini Helper: `app/lib/ai/match-score.ts`

**Create this file.** Use the existing Gemini client pattern from `app/lib/gemini.ts`.

```typescript
import { getGeminiClient } from "@/lib/gemini";

export interface MatchScoreResult {
  score: number | null;
  reasons: string[];
  gaps: string[];
}

export async function computeMatchScore(params: {
  jobTitle: string;
  jobDescription: string;
  jobSkills: string[];
  talentBio: string;
  talentSkills: string[];
  yearsExperience: number | null;
}): Promise<MatchScoreResult> {
  const prompt = `You are a technical recruiter AI. Given a job description and a talent profile, calculate how well this talent matches the job.

JOB:
Title: ${params.jobTitle}
Description: ${params.jobDescription}
Required Skills: ${params.jobSkills.join(", ")}

TALENT:
Skills: ${params.talentSkills.join(", ")}
Bio: ${params.talentBio}
Years of Experience: ${params.yearsExperience ?? "Unknown"}

Return ONLY valid JSON (no markdown, no explanation):
{
  "score": <integer 0-100>,
  "reasons": [<max 3 short strings why they match>],
  "gaps": [<max 3 short strings what is missing>]
}`;

  try {
    const gemini = getGeminiClient(); // use existing client from app/lib/gemini.ts
    const result = await gemini.generateContent(prompt);
    const text = result.response.text().trim();
    // Strip markdown code fences if present
    const json = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(json);
    return {
      score: typeof parsed.score === "number" ? Math.min(100, Math.max(0, parsed.score)) : null,
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 3) : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.slice(0, 3) : [],
    };
  } catch {
    return { score: null, reasons: [], gaps: [] };
  }
}
```

**Note:** Check `app/lib/gemini.ts` for the exact export name and client interface. Adapt accordingly.

---

## MATCH-003 — API Route: `app/api/ai/match-score/route.ts`

**Create this file.**

```typescript
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { computeMatchScore } from "@/lib/ai/match-score";
import { safeBase64Decode } from "@/lib/utils"; // find the correct import path

export async function POST(req: NextRequest) {
  try {
    const { jobId, talentId } = await req.json();

    if (!jobId || !talentId) {
      return NextResponse.json({ success: false, error: "jobId and talentId required" }, { status: 400 });
    }

    // 1. Check cache first
    const cached = await sql`
      SELECT score, reasons, gaps
      FROM goodhive.match_score_cache
      WHERE job_id = ${jobId}::uuid
        AND talent_id = ${talentId}::uuid
        AND expires_at > NOW()
      LIMIT 1
    `;

    if (cached.length > 0) {
      return NextResponse.json({
        success: true,
        data: { ...cached[0], cached: true },
      });
    }

    // 2. Fetch job data
    const jobs = await sql`
      SELECT title, description, skills
      FROM goodhive.job_offers
      WHERE id = ${jobId}::uuid
      LIMIT 1
    `;
    if (jobs.length === 0) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }
    const job = jobs[0];

    // 3. Fetch talent data
    const talents = await sql`
      SELECT description, skills, first_name, last_name
      FROM goodhive.talents
      WHERE user_id = ${talentId}::uuid
      LIMIT 1
    `;
    if (talents.length === 0) {
      return NextResponse.json({ success: false, error: "Talent not found" }, { status: 404 });
    }
    const talent = talents[0];

    // 4. Compute score via Gemini
    const result = await computeMatchScore({
      jobTitle: job.title ?? "",
      jobDescription: job.description ?? "",
      jobSkills: job.skills ? job.skills.split(",").map((s: string) => s.trim()) : [],
      talentBio: safeBase64Decode(talent.description) ?? "",
      talentSkills: talent.skills ? talent.skills.split(",").map((s: string) => s.trim()) : [],
      yearsExperience: null, // computed client-side; skip for now
    });

    // 5. Cache the result for 1 hour
    await sql`
      INSERT INTO goodhive.match_score_cache (job_id, talent_id, score, reasons, gaps, expires_at)
      VALUES (
        ${jobId}::uuid,
        ${talentId}::uuid,
        ${result.score},
        ${JSON.stringify(result.reasons)}::jsonb,
        ${JSON.stringify(result.gaps)}::jsonb,
        NOW() + INTERVAL '1 hour'
      )
      ON CONFLICT (job_id, talent_id) DO UPDATE SET
        score = EXCLUDED.score,
        reasons = EXCLUDED.reasons,
        gaps = EXCLUDED.gaps,
        expires_at = EXCLUDED.expires_at
    `;

    return NextResponse.json({
      success: true,
      data: { ...result, cached: false },
    });
  } catch (error) {
    console.error("Match score error:", error);
    return NextResponse.json({ success: false, error: "Failed to compute match score" }, { status: 500 });
  }
}
```

**Note:** Find where `safeBase64Decode` is defined (check `app/api/talents/my-profile/route.ts` imports) and use the correct import path.

---

## MATCH-004 — Badge Component: `app/components/MatchScoreBadge.tsx`

**Create this file.**

```tsx
"use client";

interface Props {
  score: number | null;
  reasons?: string[];
  gaps?: string[];
  showTooltip?: boolean;
}

export function MatchScoreBadge({ score, reasons = [], gaps = [], showTooltip = false }: Props) {
  if (score === null) return null;

  const color =
    score >= 80 ? "bg-green-100 text-green-800 border-green-200" :
    score >= 50 ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                  "bg-red-100 text-red-800 border-red-200";

  const badge = (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      <span>{score}% match</span>
    </span>
  );

  if (!showTooltip || (reasons.length === 0 && gaps.length === 0)) return badge;

  return (
    <div className="relative group inline-block">
      {badge}
      <div className="absolute z-10 hidden group-hover:block bottom-full mb-2 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-700">
        {reasons.length > 0 && (
          <div className="mb-2">
            <p className="font-semibold text-green-700 mb-1">Why it matches</p>
            <ul className="space-y-0.5">
              {reasons.map((r, i) => <li key={i}>✓ {r}</li>)}
            </ul>
          </div>
        )}
        {gaps.length > 0 && (
          <div>
            <p className="font-semibold text-red-600 mb-1">Gaps</p>
            <ul className="space-y-0.5">
              {gaps.map((g, i) => <li key={i}>✗ {g}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## MATCH-005 — Talent Job Search Page: Show Score per Talent

**File:** `app/api/talents/job-search/route.ts` and/or the talent listing page

**Goal:** When a company is logged in and has selected a job (via `jobId` query param), show a match score badge next to each talent card.

**How to integrate:**
1. Find where talent cards are rendered in `app/talents/page.tsx` (or similar)
2. If `jobId` is present in the URL and viewer is a company:
   - For each talent in the list, call `POST /api/ai/match-score` with `{ jobId, talentId: talent.user_id }`
   - Show `<MatchScoreBadge score={score} reasons={reasons} gaps={gaps} showTooltip={true} />` on the card
3. Fetch scores in parallel using `Promise.allSettled` — don't block page render
4. Show a loading skeleton badge (`--% match`) while fetching
5. If fetch fails, don't show badge (fail silently)

**Important:** Only show scores when company is logged in AND a jobId filter is active. Don't show to talents or unauthenticated users.

---

## MATCH-006 — Job Detail Page: Show "Your Match Score"

**File:** `app/jobs/[id]/page.tsx` (or wherever the job detail page is)

**Goal:** When a talent is viewing a job detail page, show a "Your Match Score" card.

**How to integrate:**
1. On page load, if viewer is a logged-in talent, call `POST /api/ai/match-score` with `{ jobId: params.id, talentId: session.userId }`
2. Show a card below the job description:

```
┌─────────────────────────────────┐
│  Your Match Score               │
│  ████████░░  82%                │
│                                 │
│  ✓ Strong React skills          │
│  ✓ 3yr experience matches       │
│                                 │
│  ✗ No TypeScript mentioned      │
└─────────────────────────────────┘
```

3. While loading: show a skeleton card
4. On error or score = null: hide the card entirely

---

## Execution Order

Work through tasks in this order — commit each separately:

1. **MATCH-001** — DB migration (run it + commit the SQL file)
2. **MATCH-002** — Gemini helper `app/lib/ai/match-score.ts`
3. **MATCH-003** — API route `app/api/ai/match-score/route.ts`
4. **MATCH-004** — Badge component
5. **MATCH-005** — Talent listing integration
6. **MATCH-006** — Job detail page integration

---

## Validation After Each Task

```bash
pnpm lint && pnpm tsc --noEmit
```

Lint warnings are expected (existing repo-wide). Only new errors you introduced are blockers.

Manual test after MATCH-003:
```bash
curl -X POST http://localhost:3000/api/ai/match-score \
  -H "Content-Type: application/json" \
  -d '{"jobId":"<real-job-id>","talentId":"<real-talent-user-id>"}'
```

---

## Out of Scope

- Bulk pre-computing all talent × job pairs
- Score visible in admin panel
- Historical score analytics
- Custom matching weights per company
