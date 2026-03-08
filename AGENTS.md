# AGENTS.md

Operational guide for Codex in this repository.

## Role

Codex is the **implementation and execution agent**.

- Build features based on `docs/tasks/current-task.md` and relevant feature docs.
- Keep changes scoped to the active task.
- Do not rely on chat history as system memory; update repo docs as you work.

## Stack Summary

- **Framework:** Next.js App Router (`app/`) — Next.js 14+
- **Language:** TypeScript (strict), React 18/19
- **Styling/UI:** Tailwind CSS + Framer Motion + Radix UI + `class-variance-authority`
- **Data:** Raw `pg` (PostgreSQL) via `app/lib/db.ts` — no ORM
- **Auth:** Iron Session (HTTP-only cookies) + JWT (`jose`/`jsonwebtoken`) + bcryptjs
- **AI:** Google Vertex AI + Gemini (`@google/generative-ai`) + OpenAI
- **Storage:** AWS S3 (`@aws-sdk/client-s3`)
- **Blockchain:** Thirdweb + Hardhat contracts (`contracts/`)
- **CMS:** Sanity (`@sanity/client`) for blog/content
- **Email:** Resend
- **Validation:** Zod + Yup + react-hook-form
- **Testing:** Playwright (e2e smoke)

## Repository Shape

```
app/
  api/           — API route handlers (app/api/**/route.ts)
  admin/         — Admin panel pages
  auth/          — Auth pages (login, register, etc.)
  jobs/          — Job listing pages
  talents/       — Talent profile pages
  companies/     — Company pages
  user-profile/  — User profile pages
  superbot/      — AI chat assistant
  lib/           — Server helpers (db, auth, email, AI, services)
components/      — (root) Shared UI components
app/components/  — App-level components
types/           — TypeScript interfaces
utils/           — Utility functions
hooks/           — React hooks
contracts/       — Hardhat Solidity contracts
prisma/ or db/   — DB migration scripts
docs/            — Planning, architecture, reviews, tasks, AI workflow
```

## Coding Conventions

- TypeScript strict mode; avoid `any`.
- Use `@/` imports (e.g. `@/app/lib/db`, `@/components/Button`).
- API route handlers follow this pattern:
  1. Parse/validate request body with Zod or manual checks
  2. Auth check via Iron Session or JWT guard
  3. DB query via `pg` pool from `app/lib/db.ts`
  4. Return `NextResponse.json({ success: true, data })` or `{ success: false, error }`
- Keep server logic in `app/lib/` not inline in route handlers.
- React components: PascalCase filenames.
- API route files: always `route.ts`.
- Preserve existing UI design tokens and animation style (Framer Motion).

## Commands

```bash
# Install
pnpm install

# Dev server
pnpm dev

# Build
pnpm build

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# E2E tests
pnpm playwright test
```

## Execution Rules

- Do not rewrite unrelated files.
- Keep scope tight to the active task and acceptance criteria.
- Preserve existing architectural patterns and design style.
- Prefer minimal, reviewable diffs.
- Update docs when behavior/architecture changes:
  - `docs/architecture/overview.md` for structural changes
  - `docs/architecture/decisions.md` for new decisions
  - `docs/tasks/current-task.md` status/checklist updates
- Run `lint` + `tsc --noEmit` after changes minimum.
- If an assumption is required and cannot be verified, mark it as `TBD` in docs.

## Definition of Done

A task is done when all are true:

1. Implementation matches `docs/tasks/current-task.md` scope.
2. No unrelated files were modified.
3. Lint and typecheck pass.
4. Relevant tests pass.
5. Docs/task status are updated for handoff.
6. Review-ready summary includes: changed files, validation run, known risks/TBDs.
