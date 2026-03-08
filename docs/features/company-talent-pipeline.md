# Feature: Company Talent Shortlisting & Pipeline Board

## Status
`PLANNED`

## Business Goal
Companies using GoodHive have no way to organize the talents they're interested in. They browse, like someone, then lose track. A lightweight Kanban pipeline (Shortlisted → Contacted → Interview → Hired) makes GoodHive a full recruitment tool, not just a directory — increasing company stickiness and subscription value.

## User Stories
> As a **company**, I want to save/shortlist talents I'm interested in so I can find them again.

> As a **company**, I want to move shortlisted talents through pipeline stages (Shortlisted → Contacted → Interviewing → Hired/Rejected).

> As a **company**, I want to add private notes to a talent in my pipeline.

> As a **company**, I want to see my full pipeline on a Kanban board.

## How It Works (Architecture)

### Kanban Stages
```
Shortlisted → Contacted → Interviewing → Hired
                                       → Rejected (archived)
```

### Data Model
```sql
CREATE TABLE company_talent_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('shortlisted', 'contacted', 'interviewing', 'hired', 'rejected'))
    DEFAULT 'shortlisted',
  notes TEXT,
  job_id UUID REFERENCES jobs(id),  -- which job they're being considered for
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, talent_id, job_id)
);
CREATE INDEX ON company_talent_pipeline(company_id, stage);
CREATE INDEX ON company_talent_pipeline(talent_id);
```

### UI Layout
- `/companies/pipeline` — full Kanban board (drag-and-drop using @dnd-kit, already installed)
- "Save to pipeline" button on every talent card/profile
- Each Kanban card shows: avatar, name, top 3 skills, match score (if AI feature enabled), note preview

## Acceptance Criteria
1. "Save to Pipeline" button on talent profile pages (visible to logged-in companies only)
2. `POST /api/pipeline` creates or updates a pipeline entry
3. `GET /api/pipeline` returns company's full pipeline grouped by stage
4. `PATCH /api/pipeline/:id` updates stage and/or notes
5. `DELETE /api/pipeline/:id` removes talent from pipeline
6. `/companies/pipeline` page shows Kanban board with drag-and-drop stage moves
7. Drag-and-drop uses existing `@dnd-kit` (already in deps) — no new packages
8. Notes are editable inline on the Kanban card (textarea modal)
9. Hired/Rejected column collapsed by default but expandable

## Out of Scope
- Email automation when stage changes (Phase 2)
- Sharing pipeline with team members (multi-seat company accounts)
- Analytics on pipeline conversion rates

## Impacted Files / Modules

### New Files
- `app/api/pipeline/route.ts` — GET (list), POST (add talent)
- `app/api/pipeline/[id]/route.ts` — PATCH (update stage/notes), DELETE (remove)
- `app/companies/pipeline/page.tsx` — Kanban board page
- `app/components/PipelineKanban.tsx` — Kanban board component (uses @dnd-kit)
- `app/components/PipelineCard.tsx` — single talent card in pipeline
- `app/components/SaveToPipelineButton.tsx` — button on talent profiles

### Modified Files
- `app/talents/[id]/page.tsx` — add "Save to Pipeline" button (company auth check)
- `app/talents/page.tsx` — add "Save" icon on talent list cards
- DB: `company_talent_pipeline` table (new)

## API Spec

```
POST /api/pipeline
Auth: Iron Session (company)
Body: { talentId: string, jobId?: string, stage?: string }
Response: { success: true, data: PipelineEntry }

GET /api/pipeline?jobId=optional
Auth: Iron Session (company)
Response: {
  success: true,
  data: {
    shortlisted: PipelineEntry[],
    contacted: PipelineEntry[],
    interviewing: PipelineEntry[],
    hired: PipelineEntry[],
    rejected: PipelineEntry[]
  }
}

PATCH /api/pipeline/:id
Auth: Iron Session (company, must own entry)
Body: { stage?: string, notes?: string }
Response: { success: true, data: PipelineEntry }

DELETE /api/pipeline/:id
Auth: Iron Session (company, must own entry)
Response: { success: true }
```

## Validation Commands
```bash
pnpm lint
pnpm tsc --noEmit
```

## Open Questions / TBDs
- TBD: How is company auth distinguished from talent auth in session? Check `app/lib/auth/` for role field
- TBD: Does `@dnd-kit` work with Server Components? Kanban board will need `'use client'`
