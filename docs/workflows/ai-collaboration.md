# AI Collaboration Workflow

This repo uses file-based collaboration between **Claude Code** (architect/planner/reviewer) and **Codex** (implementer/executor).

## Roles

| Agent | Role |
|---|---|
| **Claude Code** | Architect, planner, code reviewer, innovation advisor |
| **Codex** | Implementation, execution, testing |

## Source of Truth Files

| File | Purpose |
|---|---|
| `docs/tasks/current-task.md` | Active task — single source of truth for what Codex should build |
| `docs/architecture/overview.md` | System architecture baseline |
| `docs/architecture/decisions.md` | ADR log for significant decisions |
| `docs/features/*.md` | Feature planning docs (one per feature) |
| `docs/reviews/*.md` | Code review records |
| `CLAUDE.md` | Claude Code execution guardrails |
| `AGENTS.md` | Codex execution guardrails |

**Chat is for coordination only. Repo files are the durable handoff record.**

## Standard Lifecycle

### 1. Claude Code Plans

- Read architecture + current task docs.
- Create/update a feature plan doc in `docs/features/`.
- Update `docs/tasks/current-task.md` with:
  - Scope and acceptance criteria
  - Impacted files/modules
  - Out-of-scope boundaries
  - Required validation commands
- Handoff to Codex via `current-task.md`.

### 2. Codex Implements

- Read `AGENTS.md`, `docs/tasks/current-task.md`, and relevant feature doc.
- Implement only scoped changes.
- Run: `pnpm lint` + `pnpm tsc --noEmit` at minimum.
- Update task checklist + validation results in `docs/tasks/current-task.md`.
- Handoff to Claude Code with: changed file list, what was deferred (TBD), test results, known risks.

### 3. Claude Code Reviews

- Review git diff + task/feature docs.
- Record findings using the review format in `CLAUDE.md`.
- Save review to `docs/reviews/YYYY-MM-DD-<feature>.md`.
- Set verdict and concrete fix list.

### 4. Fix Loop

- Codex applies blockers/important fixes.
- Re-runs relevant checks.
- Updates task/review docs until verdict is PASS.

## Exact Handoff Rules

**Claude → Codex (planning handoff) must include:**
- Feature doc path
- Explicit acceptance criteria (numbered list)
- Impacted files/modules
- Required validation commands
- Out-of-scope items

**Codex → Claude (implementation handoff) must include:**
- Changed file list
- What was implemented vs deferred (TBD)
- Commands/tests run and results
- Known risks or assumptions made

**Claude → Codex (review handoff) must include:**
- Prioritized blockers first
- File/line references for each issue
- Expected fix behavior

## Update Protocol

- Keep `current-task.md` updated after meaningful progress.
- Record unknowns as `TBD` instead of assumptions.
- If architecture changes, update:
  - `docs/architecture/overview.md`
  - `docs/architecture/decisions.md` (new ADR if decision-level)

## Feature Doc Template

See `docs/features/FEATURE_TEMPLATE.md`.

## Practical Defaults

- Keep docs lightweight and close to implementation reality.
- Prefer small, iterative PR-sized tasks over massive phases.
- Avoid broad refactors unless explicitly planned in scope.
- AI endpoint changes always include cost/rate-limit considerations.
