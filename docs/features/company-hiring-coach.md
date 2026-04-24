# Feature: Company Hiring Coach MVP

## Summary

Company Hiring Coach gives company users a focused AI workspace inside the company dashboard. V1 includes three tools:

- Improve Job Post
- Generate Interview Questions
- Summarize Candidate

The feature reuses the existing Gemini integration and does not persist generated output. Results remain client-side until the company copies them or generates again.

## Access & Safety

- Entry point: `/companies/dashboard/hiring-coach`
- API namespace: `/api/companies/hiring-coach/*`
- All endpoints derive the actor from `getSessionUser()`.
- The actor must have a company profile.
- Jobs must belong to the logged-in company.
- Applications must belong to the selected company-owned job.
- Client-provided company IDs are not accepted by this feature.

## Tools

### Improve Job Post

Companies can select an existing job, paste draft notes, or use both. The AI returns a structured job post with:

- improved title
- overview
- responsibilities
- requirements
- nice-to-have skills
- benefits
- quality notes

### Interview Questions

Companies select a job and can optionally select an applicant for candidate-specific questions. The AI returns:

- technical questions
- behavioral questions
- role-fit questions
- evaluation criteria

### Candidate Summary

Companies select a job and an application. The AI returns:

- strengths
- gaps
- fit summary
- suggested next step
- interview focus areas

## Notes

- V1 intentionally does not save history or generated drafts.
- AI responses are required to parse as JSON and are normalized before reaching the UI.
- Invalid AI output returns a controlled error instead of rendering partial or malformed content.
