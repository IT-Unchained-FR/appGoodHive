# Feature: Superbot Knowledge Base (Postgres-backed, replaces dead Vertex RAG)

## Status
`PLANNING`

## Business Goal
The public Superbot widget (`app/components/superbot/SuperbotWidget.tsx`) currently cannot answer any real question. Every query returns a generic "I couldn't find enough information in my knowledge base" reply, because its only context source is Google Vertex AI RAG Engine (`lib/ragEngine.ts`), which is:
- Not something the team is actively using (confirmed 2026-09-21).
- Was already blocked on Google Cloud billing (`goodhive-1706112296263` — `BILLING_DISABLED`), independent of the "not using it" decision.
- Has been unused/dead since the Groq migration (commit `8b83176`, "RAG embeddings (unused) throw a clear error pointing to disable flag") but was never fully turned off in Vercel — `RAG_CORPUS_RESOURCE`/`RAG_ENGINE_ENABLED` are now removed/disabled in Production and Preview as of this task, so the bot fails fast instead of erroring, but still can't answer anything.

`goodhive.content_items` — a table that already exists with a working CRUD API (`app/api/content-items/route.ts`, `app/api/content-items/[id]/route.ts`) and schema `id, type, title, body, cta_label, cta_url, status` — is the obvious replacement knowledge source. It's currently used only to populate the widget's "suggested questions" chips (`type=faq`), and has **0 rows in production**, so even that is running on the frontend's hardcoded `FALLBACK_SUGGESTED_QUESTIONS`.

## User Story
> As a visitor talking to GoodHive Navigator, I want it to actually answer questions about GoodHive (how hiring works, fees, tokenomics, onboarding) using real content the team maintains, instead of always deflecting to "book a call."

> As an admin/Benoit, I want to add/edit FAQ-style knowledge entries through the existing content-items API/UI (or a lightweight admin form) without needing a Google Cloud RAG corpus.

## Acceptance Criteria
1. `generateChatResponse` (`lib/rag.ts`) no longer depends on `retrieveRagContexts`/Vertex AI for its knowledge base.
2. A real, non-empty set of `goodhive.content_items` rows (`type` e.g. `knowledge_base` or reuse `faq`, `status='active'`) exists in production, covering the core GoodHive topics (what it is, how hiring works, fees/tokenomics, talent onboarding, company onboarding, wallets).
3. On each user message, the bot retrieves relevant active content items and feeds them into the Groq prompt as the knowledge base context (same `buildRagKnowledgeBase`-style formatting already used).
4. If no content item matches well enough, the existing graceful fallback message still applies — no regression there.
5. Suggested-questions chips (`GET /api/content-items?type=faq&status=active`) and the new answer-context lookup can share the same table without stepping on each other (e.g. distinguish via `type`, or just reuse `type=faq` for both if content overlaps).
6. No dependency on Google Vertex AI / Google Cloud billing anywhere in the live request path for Superbot.

## Out of Scope
- Real vector/semantic search (embeddings) — v1 can use simple keyword/`ILIKE`/Postgres full-text search (`tsvector`) over `title`/`body`; semantic ranking is a future enhancement if keyword matching proves too weak.
- A dedicated admin UI for managing knowledge entries — v1 can seed via SQL or the existing generic `POST /api/content-items`; a nicer admin form is a follow-up.
- Multi-language content.
- Removing `lib/ragEngine.ts` entirely — leave the file in place (already env-gated off) in case Vertex RAG is revisited later; just stop calling it from the active path once the new source is in place.

## Impacted Files / Modules
- `lib/rag.ts` — replace the `retrieveRagContexts` call and `ragContexts`/`buildRagKnowledgeBase` wiring with a new content-items lookup.
- New `lib/superbot/knowledge.ts` (suggested) — fetches candidate `goodhive.content_items` rows for a given user message (keyword match over `title`/`body`, `status='active'`), returns them in the same `RagContext`-like shape so `buildRagKnowledgeBase`'s formatting can be reused with minimal change.
- `app/api/superbot/chat/route.ts` — no change expected (already channel-agnostic).
- `lib/ragEngine.ts` — no code change; stays dead/env-gated.
- Data: seed real content into `goodhive.content_items` (no schema/migration change — table already exists).

## API Changes
None required — reuses existing `GET/POST /api/content-items`.

## DB Changes
- New tables: none (`goodhive.content_items` already exists).
- New columns: none.
- Migrations: none. Optional: a `tsvector` generated column + GIN index on `content_items(title, body)` if keyword search needs to scale past a handful of rows — not needed at expected FAQ-table size (dozens of rows).
- Data seeding: insert real GoodHive knowledge-base rows (`type`, `title`, `body`, `cta_label`, `cta_url`, `status='active'`) — content to be provided by Benoit/GoodHive team, not fabricated by the AI.

## AI / External Service Changes
- AI model used: unchanged — Groq via `generateWithFallback` (`lib/ai/groq`), already the active generation path (ADR: Groq replaced Gemini for generation, commit `8b83176`).
- Prompts: `buildSystemPrompt`/`buildRagKnowledgeBase` in `lib/rag.ts` stay structurally the same; only the source of `ragContexts` changes from Vertex AI to Postgres.
- Cost/rate-limit notes: removes an external Google Cloud API call per message entirely (was failing anyway) — net reduction in external dependencies and latency.

## Validation Commands
```bash
pnpm lint
pnpm tsc --noEmit
```
Plus manual: open the Superbot widget on a dev server, ask 3–4 real GoodHive questions covered by seeded content, confirm relevant (non-generic) answers; ask one deliberately out-of-scope question, confirm the graceful fallback still fires.

## Open Questions / TBDs
- TBD: exact `type` value(s) to use for answer-context rows vs. the existing `type=faq` suggested-questions rows — reuse one type or split into two?
- TBD: who owns writing the actual FAQ/knowledge content (Benoit) — this task should not fabricate GoodHive facts.
- TBD: keyword-match ranking approach — simple `ILIKE '%term%'` over a handful of extracted keywords, or Postgres `tsvector`/`ts_rank`? Decide once the real content volume is known.
- TBD: should the Telegram channel (`channel: "telegram"` in `lib/superbot/engine.ts`) get the same knowledge source? (Almost certainly yes, since `generateChatResponse` is shared — confirm no telegram-specific formatting assumptions break.)

## Review Checklist
- [ ] Acceptance criteria met
- [ ] No unrelated files changed
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Docs updated
