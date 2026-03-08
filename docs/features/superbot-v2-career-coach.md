# Feature: Superbot v2 — Context-Aware Career Coach

## Status
`PLANNED`

## Business Goal
The current Superbot is a generic chatbot. v2 makes it a **personalized career coach** that knows the talent's actual profile data, their applications, jobs they've viewed, and the GoodHive job market — giving contextual, actionable advice. This is the "wow" feature Benoit can demo.

## User Stories
> As a **talent**, I want the Superbot to know my profile and current applications so it can give me real advice — not just generic tips.

> As a **talent**, I want Superbot to proactively suggest jobs that fit my profile.

> As a **talent**, I want Superbot to review my profile bio and suggest improvements specific to my field.

## How It Works (Architecture)

### Context Injection Pipeline
When a talent opens Superbot:
1. `GET /api/superbot/context` loads the talent's full context:
   - Profile: skills, bio, experience, certifications
   - Active job applications and their statuses
   - Top 5 matching jobs from the current market (using match score AI)
   - Profile completeness score
2. System prompt is built dynamically:
   ```
   You are GoodHive Career Coach. You know this talent personally:
   Name: {{name}}
   Skills: {{skills}}
   Experience: {{yearsExp}} years
   Bio: {{bio}}
   Active applications: {{applications}}
   Recommended jobs right now: {{topJobs}}
   Profile completeness: {{completeness}}%

   Your role: Give specific, personalized career advice. Be honest, encouraging, and actionable.
   If asked about jobs, reference the real jobs above. If asked to improve their bio, give specific rewrites.
   ```
3. Conversation history stored per-talent in DB (not just session)
4. Superbot can call internal "tools":
   - `search_jobs(query)` — searches GoodHive jobs
   - `improve_bio(currentBio)` — returns improved bio draft
   - `check_application_status(jobId)` — returns application status

### Conversation Storage
```sql
CREATE TABLE superbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON superbot_conversations(talent_id, created_at DESC);
```

## Acceptance Criteria
1. `GET /api/superbot/context` returns talent's profile + applications + top job suggestions — auth required
2. Superbot system prompt is dynamically injected with real talent context per session
3. Conversation history persists across sessions (stored in DB per talent)
4. Superbot can search real GoodHive jobs and reference them by name in replies
5. "Improve my bio" command returns a specific rewritten bio draft
6. UI shows typing indicator while Gemini is generating
7. Conversation resets button clears history for that talent
8. Works for authenticated talents only — unauthenticated users get generic Superbot

## Out of Scope
- Company-specific Superbot (separate feature)
- Voice interface
- Multi-language support (English only for now)

## Impacted Files / Modules

### New Files
- `app/api/superbot/context/route.ts` — GET, builds and returns talent context JSON
- `app/lib/ai/superbot-context.ts` — context builder (fetches profile, apps, jobs)
- `app/lib/ai/superbot-prompt.ts` — dynamic system prompt builder

### Modified Files
- `app/api/superbot/route.ts` — inject context into system prompt, load/save history from DB
- `app/superbot/page.tsx` — add persistent history UI, typing indicator, "reset" button
- DB: `superbot_conversations` table (new)

## API Spec

```
GET /api/superbot/context
Auth: Iron Session (talent)
Response: {
  success: true,
  data: {
    profile: { name, skills, bio, yearsExperience, completeness: number },
    applications: [{ jobTitle, company, status, appliedAt }],
    suggestedJobs: [{ id, title, company, matchScore }]
  }
}

POST /api/superbot
Auth: Iron Session (talent) or anonymous (generic mode)
Body: { message: string, conversationId?: string }
Response: { success: true, data: { reply: string, conversationId: string } }
```

## AI Cost Notes
- Gemini 1.5 Flash for conversation (speed + cost)
- System prompt with context: ~800-1200 tokens per request
- Keep conversation history to last 10 messages to control token count
- Estimated: ~$0.0003 per message with history — very cheap

## Validation Commands
```bash
pnpm lint
pnpm tsc --noEmit
```

## Open Questions / TBDs
- TBD: Current Superbot (`app/api/superbot/route.ts`) — does it use Gemini or OpenAI? Check before modifying.
- TBD: Is there already a conversation table? Check existing DB migrations in `app/db/`.
- TBD: Profile completeness score algorithm — what fields count?
