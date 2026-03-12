# Codex Prompts

Each file in this directory is a **ready-to-paste prompt** for Codex.

## How to Use

1. Claude Code writes a prompt file here when a task is ready for execution.
2. Juhan opens Codex → pastes the full file content.
3. Codex executes → reports back changed files + results.
4. Juhan pastes the Codex report back to Claude Code for review.
5. Claude Code gives PASS / FIX / BLOCKED verdict.

## Naming Convention

```
p42-phase1-job-review.md        ← Plan-42, Phase 1
p42-phase2-notifications.md     ← Plan-42, Phase 2
p42-phase3-assignments.md       ← Plan-42, Phase 3
...
```

## Status Legend

- `READY` — prompt written, waiting for Codex execution
- `IN PROGRESS` — Codex is executing
- `REVIEW` — Codex done, Claude Code reviewing
- `DONE` — reviewed and passed
