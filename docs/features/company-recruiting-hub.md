# Feature: Company Recruiting Hub

## Status
`IN PROGRESS`

## Business Goal
Companies need the same recruiting power as recruiters — pipeline management, candidate comparison, AI-powered client summaries, and analytics. All built on the same shared code with zero duplication.

---

## Core Principle: No Code Duplication

The pipeline API (`/api/pipeline`) already serves both companies and recruiters.  
All pipeline UI components are extracted into `app/components/pipeline/` and shared.

---

## Shared Components to Extract

### `app/components/pipeline/`
| File | What it does |
|---|---|
| `pipeline-types.ts` | `PipelineEntry`, `Stage`, `STAGES`, `PipelineData` types + constants |
| `PipelineAvatar.tsx` | Avatar with image/initials fallback |
| `AnalysisText.tsx` | Markdown renderer for AI output |
| `CompareModal.tsx` | Side-by-side comparison + AI analysis via Gemini |
| `SendToClientModal.tsx` | AI-generated professional summary, copy + email |
| `TalentCard.tsx` | Kanban card with select, notes, stage, send, delete |
| `KanbanColumn.tsx` | Droppable/sortable column |
| `PipelineBoard.tsx` | Full board: DnD, state, CSV export, floating compare bar |

---

## Tasks

### ✅ Already Done (Recruiter side)
- Pipeline kanban (drag & drop)
- Candidate comparison + AI analysis
- Send to Client modal
- Export CSV
- Pipeline count badge in sidebar
- Analytics page

---

### Task 1 — Extract Shared Pipeline Components
**Files created:** `app/components/pipeline/` (8 files)  
**Files refactored:** `app/recruiter/dashboard/pipeline/page.tsx` → thin wrapper  
**Outcome:** Zero duplication, both roles share the same UI logic.

---

### Task 2 — Upgrade Company Pipeline Page
**File:** `app/companies/pipeline/page.tsx` → replace with `PipelineBoard` wrapper  
**Gains:**
- ✅ Candidate comparison modal + AI analysis
- ✅ Send to Client (AI summary → copy/email)
- ✅ Export CSV
- ✅ Avatar with fallback, rate/availability/bio in cards
- ✅ Select bar for multi-select comparison

---

### Task 3 — Pipeline Count Badge in Company Sidebar
**File:** `app/companies/dashboard/layout.tsx`  
Same pattern as recruiter sidebar — live count badge on "Talent Pipeline" nav item.

---

### Task 4 — Company Dashboard Home: Pipeline Stat Cards
**File:** `app/companies/dashboard/page.tsx`  
Add 3 pipeline-aware stat cards (sourced from `/api/pipeline`):
- **Candidates in Pipeline** (total)
- **Interviewing** (stage count)
- **Hired This Month**

Also add a "Recent Pipeline Activity" mini-section (last 3 candidates moved).

---

### Task 5 — Company Analytics: Talent Pipeline Section
**File:** `app/companies/dashboard/analytics/page.tsx`  
Add a new "Talent Pipeline" tab/section alongside the existing job analytics:
- Pipeline funnel (Shortlisted → Contacted → Interviewing → Hired)
- Hired vs Rejected donut
- Pipeline activity trend (weekly additions)

**API:** Extend `GET /api/companies/dashboard-stats` or add `/api/companies/pipeline-stats`.

---

## Build Order
1. Extract shared components → refactor recruiter page ← **starting now**
2. Company pipeline page upgrade
3. Company sidebar badge
4. Company dashboard home stat cards
5. Company analytics talent section

## Out of Scope
- Search history for companies (they use job postings, not freeform search)
- Separate "Find Talents" page for companies (they already have Top Candidates + job applicants)
