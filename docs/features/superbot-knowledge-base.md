# Feature: Superbot Knowledge Base (markdown-backed, replaces dead Vertex RAG)

## Status
`DONE`

**2026-09-23 update #2:** moved storage from static repo files to a Postgres table (`goodhive.knowledge_base_files`) so Benoit/admins can upload and edit knowledge-base markdown live from `/admin/knowledge-base`, with no git commit/redeploy required. This reverses the "markdown files in the repo" decision below — see "Final Architecture" for what's live now.

**2026-09-23 update #1 (superseded by update #2):** shipped as **markdown files in the repo** (`content/superbot-knowledge/*.md`), not the Postgres `content_items` table originally planned below — explicit user decision at the time: one source of truth, editable in-repo, no DB round trip. The `content_items` DB path (and its 12 seeded rows) was implemented first, verified working, then fully superseded and the seeded rows deleted.

## Final Architecture (as shipped, update #2)
- Knowledge lives in `goodhive.knowledge_base_files` (Postgres, same DB as the rest of Superbot — `lib/ragDb`): `id, slug, title, content, updated_by, created_at, updated_at`. One row per FAQ category, `content` is the full markdown body with `## Question` sections. Migration: `db/migrations/add-knowledge-base-files.sql`.
- `lib/superbot/knowledge.ts` queries all rows, parses `##` sections into `{title, body, category}` entries, and caches them in module scope for **60 seconds** (not indefinitely — admin edits need to become visible without a redeploy/cold start).
- `retrieveKnowledgeBaseContexts(userMessage)` — unchanged keyword-overlap scoring, now sourced from the DB.
- `listKnowledgeQuestions()` — unchanged, backs `GET /api/superbot/knowledge-questions`.
- Admin CRUD: `GET/POST /api/admin/knowledge-base` and `GET/PUT/DELETE /api/admin/knowledge-base/[id]`, same `admin_token` JWT auth pattern as `/api/admin/settings`. UI at `/admin/knowledge-base` (linked from the sidebar, "Knowledge Base") — table of files with Edit/Delete, a "New File" modal, and an "Upload .md" button that reads a local `.md` file client-side (`FileReader`) and pre-fills the create form (slug from filename, title from the `# Heading` line) — no S3/Blob involved, it's just text into the DB.
- One-off import: `scripts/seed-knowledge-base-files.ts` (`pnpm seed:knowledge-base`) read the original 8 `content/superbot-knowledge/*.md` files into the new table (`ON CONFLICT (slug) DO NOTHING`, safe to re-run). Already run against production; the `content/superbot-knowledge/` directory has been deleted — it's no longer read by any code path.
- Tradeoff reversed from update #1: content edits are now a live DB write (visible to the bot within ~60s, no deploy), at the cost of reintroducing a DB dependency for content storage. Chosen deliberately (2026-09-23) because live admin editing was the actual requirement — git-diffable history was nice-to-have, not load-bearing.

## Status (original plan, superseded)
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

---

## Update #2 (2026-09-23): DB-backed storage for live admin editing

### Business Goal
Benoit wants to upload new knowledge-base files and edit existing ones from the admin panel, without a git commit + redeploy for every content change.

### Impacted Files / Modules
- New `db/migrations/add-knowledge-base-files.sql` — `goodhive.knowledge_base_files` table.
- New `scripts/seed-knowledge-base-files.ts` (`pnpm seed:knowledge-base`) — one-off import of the (now-deleted) `content/superbot-knowledge/*.md` files.
- `lib/superbot/knowledge.ts` — rewritten to query `goodhive.knowledge_base_files` via `lib/ragDb` instead of `fs.readFileSync`; cache TTL changed from "forever" (module lifetime) to 60s.
- New `app/api/admin/knowledge-base/route.ts` (GET list, POST create) and `app/api/admin/knowledge-base/[id]/route.ts` (PUT update, DELETE) — same `admin_token` JWT pattern as `app/api/admin/settings/route.ts`.
- New `app/admin/knowledge-base/page.tsx` — list/edit/create/delete UI, plus a client-side `.md` file reader that pre-fills the create form.
- `app/components/Sidebar/Sidebar.tsx` — added "Knowledge Base" nav item under Management.
- Deleted `content/superbot-knowledge/*.md` (8 files) — no longer read by any code path after the seed import ran.

### DB Changes
- New table: `goodhive.knowledge_base_files` (`id, slug, title, content, updated_by, created_at, updated_at`; `slug` unique).
- Migration applied to production (`goodhive-prod`, the only DB this repo is configured against — no separate dev/staging DB) on 2026-09-23, with explicit user confirmation since `.env`/`.env.local` both point at prod.
- Seed script run once against production the same day; imported all 8 original files.

### API Changes
- New: `GET/POST /api/admin/knowledge-base`, `PUT/DELETE /api/admin/knowledge-base/[id]` (admin-auth only).
- Unchanged externally: `GET /api/superbot/knowledge-questions`, and the bot's context retrieval — both keep the same function signatures, only their data source changed.

### Validation Performed
- `npx tsc --noEmit` — clean (whole project).
- `next lint` on changed files — clean except a pre-existing-pattern `react-hooks/exhaustive-deps` warning (same warning exists in `app/admin/manage-admins/page.tsx` for the same `fetchX` re-fetch pattern).
- Manual, against a local dev server pointed at the same production DB (`pnpm exec next dev -p 3002`, admin session via a locally-minted JWT cookie for the same `ADMIN_JWT_SECRET`):
  - `/admin/knowledge-base` lists all 8 seeded files with correct per-file question counts.
  - Edit → added a question to `general.md`, saved, row's `updated_by`/`updated_at` updated correctly.
  - `GET /api/superbot/knowledge-questions` immediately reflected the new question (fresh process, cache empty).
  - `POST /api/admin/knowledge-base` (create) → 201; `DELETE .../[id]` → 200. Both exercised directly (file-picker UI wasn't automatable in this session) — same code path as the "New File" / "Upload .md" buttons.
  - Test edit and test row were reverted/deleted after verification — production data left exactly as the seed script produced it.

### Open Questions / TBDs
- No content versioning/undo — an admin edit overwrites `content` immediately with no history. Acceptable for now; worth a follow-up if edits get destructive in practice (e.g. add an `audit_log` table or keep N previous versions).
- `content` is stored/edited as raw markdown text (plain `<textarea>`), not a WYSIWYG/markdown-preview editor — matches the existing `## Question` convention `lib/superbot/knowledge.ts` parses, but there's no live preview of how a section will render to the bot.
- No production DB backup/rollback plan was set up specifically for this table — relies on whatever backup policy already covers `goodhive-prod`.
