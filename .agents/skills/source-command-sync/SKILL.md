---
name: "source-command-sync"
description: "Sync with other AI assistants by reading and updating .ai-context/"
---

# source-command-sync

Use this skill when the user asks to run the migrated source command `sync`.

## Command Template

1. Read all files in .ai-context/ directory to understand current work
2. Show me a summary of:
   - What other AIs are currently working on
   - Recent architecture decisions
   - Pending todos
3. Ask me what I want to work on
4. Update current-task.md to mark me (Codex) as working on it
