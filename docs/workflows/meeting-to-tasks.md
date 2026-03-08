# Workflow: Meeting Transcript → Tasks

## Purpose
Convert Bluedot meeting transcripts into structured tasks, bugs, and decisions that Codex can immediately act on.

## When to Use
After every Juhan × Benoit meeting — paste the Bluedot transcript and ask Claude Code to process it.

## How to Trigger
Tell Claude Code: *"Here is the meeting transcript from [date]. Please process it."*

Claude Code will:
1. Create `docs/meetings/YYYY-MM-DD-juhan-benoit.md` with the structured notes
2. Update `docs/tasks/current-task.md` with new tasks, bugs, and priorities
3. Update `docs/architecture/decisions.md` if any decisions were made
4. Update feature docs in `docs/features/` if relevant features were discussed

---

## Meeting Note Format (What Claude Produces)

```md
# Meeting: Juhan × Benoit — [Date]

## Key Decisions
| Decision | Detail |

## Bugs Found
### BUG-NNN: [Name] ([HIGH/CRITICAL/MEDIUM])
- What happened
- Root cause
- Fix needed
- Priority

## Tasks In Progress
### TASK-NNN: [Name]
- Status
- Detail
- Files

## Completed
- ✅ Item

## Planned for [Next Meeting Date]
- Item

## Product Context Discovered
- Business rules, flows, or constraints that LLMs need to know

## Action Items Summary
| # | Action | Owner | Priority | Deadline |
```

---

## Rules for Processing Transcripts

1. **Extract intent, not just words.** Juhan and Benoit speak conversationally. Infer the actual bug/task from context.
2. **Business context goes into meeting doc.** Architecture/flow revelations also update `docs/architecture/overview.md`.
3. **Priorities from Benoit's tone:**
   - "super important" / "critical" → 🔴 CRITICAL
   - "we need to" / "I'd like to" → 🔴 HIGH
   - "afterward" / "fine tuning" / "later" → 🟡 MEDIUM or 🟢 BACKLOG
4. **Always capture email/copy requirements** — Benoit is precise about wording.
5. **Any new platform flow discovered** → add to `docs/architecture/overview.md` Feature Inventory section.

---

## Bluedot Integration
- Transcripts available at: `https://app.bluedothq.com/preview/[id]`
- Juhan can paste transcript text directly into Claude Code chat
- Claude Code processes and saves to `docs/meetings/`

---

## File Naming
```
docs/meetings/YYYY-MM-DD-juhan-benoit.md
```
If other attendees (Sharon, etc.):
```
docs/meetings/YYYY-MM-DD-juhan-benoit-sharon.md
```
