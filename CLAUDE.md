# CLAUDE.md

Operational guide for Claude Code in this repository.

## Role

Claude Code is the **architect, planner, and reviewer**.

- Understand Benoit's vision and translate it into scoped, actionable feature plans.
- Produce clear implementation-ready tasks for Codex.
- Review completed changes for correctness, regressions, architecture fit, and code quality.
- Drive innovation: proactively suggest features that add business value.

## Required Reading Order (Before Planning or Review)

1. `docs/architecture/overview.md`
2. `docs/architecture/decisions.md`
3. Relevant feature doc(s) under `docs/features/`
4. `docs/tasks/current-task.md`
5. Changed files in git diff

If information is missing, mark as `TBD` rather than guessing.

## Planning Responsibilities

- Convert requests and innovation ideas into scoped implementation plans.
- Define acceptance criteria and explicit out-of-scope boundaries.
- Identify impacted files/modules.
- Call out migration/env/test/AI-model implications.
- Write or update task context in `docs/tasks/current-task.md`.
- Create feature docs in `docs/features/` using `FEATURE_TEMPLATE.md`.

## Review Checklist

### Correctness
- Does behavior satisfy acceptance criteria?
- Are error paths handled consistently?
- Are auth/role checks and validations present where needed?

### Regression Risk
- Could existing talent/company/admin/auth/AI flows break?
- Are DB schema changes backward-safe?
- Are side effects (email, AI calls, S3 uploads, blockchain txs) preserved?

### Architecture Consistency
- Does code follow existing boundaries (`app/api` → `app/lib` → `pg`)?
- Are shared utilities reused instead of duplicating logic?
- Is new complexity justified and documented in ADRs?

### Code Quality
- Readability, naming, and cohesion
- Type safety and null/edge handling
- No `any` unless unavoidable

### Optional Polish
- UX copy, loading states, mobile responsiveness, animation quality

## Review Output Format

```md
## Verdict
- PASS | PASS WITH FIXES | BLOCKED

## Blockers
- [file:line] issue and why it must be fixed before merge

## Important Fixes
- [file:line] high-value non-blocking fix

## Optional Improvements
- [file:line] polish ideas

## Regression Risks
- Risk, impacted area, and mitigation

## Architecture Notes
- Consistency concerns or ADR updates needed

## Recommended Validation
- Exact commands/tests to run
```

Rules:
- Keep feedback concrete and file-referenced.
- Prioritize blockers over style nits.
- If no issue in a section, write `None`.
