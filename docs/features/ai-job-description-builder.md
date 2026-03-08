# Feature: AI-Generated Job Description Builder

## Status
`PLANNED`

## Business Goal
Companies often post vague or incomplete job descriptions, which attracts wrong candidates. An AI builder that asks a few questions and generates a professional JD saves companies time and dramatically improves match quality — a clear value-add Benoit can show.

## User Story
> As a **company**, when I post a new job, I want to describe what I need in plain language and have AI generate a professional, structured job description automatically.

## How It Works (Architecture)

### Step-by-step UI Flow
1. Company clicks "Post a Job"
2. Step 1: Quick form — role title, seniority level, key skills needed (free text), work type (remote/hybrid/onsite), salary range
3. Step 2: "Generate with AI" button → calls `/api/ai/generate-job-description`
4. Gemini generates: full job description with sections: Overview, Responsibilities, Requirements, Nice-to-have, What we offer
5. Company reviews in rich text editor (react-quill, already installed)
6. Can regenerate with different tone: Professional / Startup / Friendly
7. Saves the job posting normally

### Gemini Prompt
```
You are an expert recruiter. Write a compelling job description for:

Role: {{title}}
Seniority: {{seniority}}
Key skills needed: {{skills}}
Work type: {{workType}}
Salary range: {{salary}}
Company name: {{companyName}}
Company description: {{companyBio}}
Tone: {{tone}} (professional / startup / friendly)

Return ONLY a JSON:
{
  "title": "Final job title",
  "overview": "2-3 sentence role overview",
  "responsibilities": ["bullet", "bullet", "bullet", "bullet", "bullet"],
  "requirements": ["bullet", "bullet", "bullet", "bullet"],
  "niceToHave": ["bullet", "bullet", "bullet"],
  "benefits": ["bullet", "bullet", "bullet"]
}
```

## Acceptance Criteria
1. New job posting form has AI generation section (Step 1: inputs, Step 2: generate + edit)
2. `POST /api/ai/generate-job-description` accepts `{ title, seniority, skills, workType, salary, tone }`, returns structured JD
3. Generated JD pre-fills the job description editor (react-quill)
4. Company can regenerate with different tone without losing other form data
5. Full job form still works without AI (backward compatible)
6. Graceful degradation: if Gemini fails, show error toast and let user type manually
7. Rate limit: 5 AI generations per company per hour

## Out of Scope
- Auto-posting to external job boards
- SEO optimization of JD text (Phase 2)
- Collaborative editing with team members

## Impacted Files / Modules

### New Files
- `app/api/ai/generate-job-description/route.ts` — POST handler
- `app/lib/ai/job-description.ts` — prompt builder, response parser
- `app/components/JobDescriptionAIBuilder.tsx` — UI step component

### Modified Files
- `app/jobs/new/page.tsx` (or wherever job creation form lives) — add AI builder step

## Validation Commands
```bash
pnpm lint
pnpm tsc --noEmit
```

## Open Questions / TBDs
- TBD: Where is the job creation form? Check `app/jobs/` or `app/companies/` for job posting pages
- TBD: Is react-quill already used in the job form? Check existing form implementation
