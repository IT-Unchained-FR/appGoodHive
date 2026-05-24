# Feature: Recruiter Dashboard — Feature Battle Plan

## Status
`IN PROGRESS`

## Business Goal
The recruiter dashboard currently only has two pages (Find Talents + Talent Pipeline). Adding a proper home dashboard, analytics, and productivity tools makes the recruiter experience feel complete, professional, and impressive — increasing recruiter retention and GoodHive's value proposition.

---

## 🟢 Small Features (Quick wins — ~1–2h each)

### 1. Recruiter Home Dashboard
**Status:** `IN PROGRESS`

> As a **recruiter**, I want a proper home page when I log in so I can see my activity at a glance instead of being dumped into the search page.

**What it shows:**
- Welcome header with recruiter's first name
- 4 stat cards: Total Searches, Talents in Pipeline, Interviewing, Hired This Month
- "Top Talents This Week" — last search results (top 3 cards with avatar, name, match score, skills)
- "Recent Searches" — last 5 searches with timestamp and quick re-run button

**Impacted Files:**
- `app/recruiter/dashboard/page.tsx` — replace redirect with real page
- `app/api/recruiter/search-history/route.ts` — already exists (GET)
- `app/api/pipeline/route.ts` — already exists (GET, counts by stage)

**API Changes:** None — uses existing endpoints.

---

### 2. Pipeline Count Badges on Sidebar
**Status:** `PLANNED`

> As a **recruiter**, I want to see live counts next to each pipeline stage in the sidebar so I know my workload at a glance.

**What it shows:**
- Sidebar item: "Talent Pipeline (8)" with a small amber badge
- Optionally: breakdown tooltip on hover showing per-stage counts

**Impacted Files:**
- `app/recruiter/dashboard/layout.tsx` — add badge to sidebar items

**API Changes:** None — reuse `GET /api/pipeline`.

---

### 3. Export Pipeline to CSV
**Status:** `PLANNED`

> As a **recruiter**, I want to export my pipeline as a CSV so I can share it with clients or track it in a spreadsheet.

**What it shows:**
- Single "Export CSV" button in the pipeline page header
- Downloads: talent name, title, skills, stage, notes, date added

**Impacted Files:**
- `app/recruiter/dashboard/pipeline/page.tsx` — add export button + client-side CSV generation

**API Changes:** None — uses already-loaded pipeline data.

---

## 🟡 Medium Features (~half day each)

### 4. Recruiter Analytics Page
**Status:** `PLANNED`

> As a **recruiter**, I want to see charts of my pipeline conversion rates and search activity over time so I can track my performance.

**What it shows:**
- Pipeline funnel chart: Shortlisted → Contacted → Interviewing → Hired
- Search activity over time (bar chart by week)
- Hired vs Rejected ratio (donut chart)
- Top skills found across all searches

**Impacted Files:**
- `app/recruiter/dashboard/analytics/page.tsx` — new page
- `app/api/recruiter/analytics/route.ts` — new API (aggregation queries)
- `app/recruiter/dashboard/layout.tsx` — add Analytics to sidebar

**API Changes:**
| Method | Path | Description |
|---|---|---|
| GET | `/api/recruiter/analytics` | Returns pipeline counts by stage, searches by week, hired/rejected totals |

**DB Changes:** None — computed from existing `company_talent_pipeline` and `recruiter_search_history` tables.

---

### 5. Candidate Comparison View
**Status:** `PLANNED`

> As a **recruiter**, I want to select 2–3 talents from my pipeline and compare them side by side so I can make faster recommendations to clients.

**What it shows:**
- Checkbox on each pipeline card to select for comparison
- "Compare (2)" floating button appears when 2+ selected
- Side-by-side modal: name, title, skills, rate, match score, availability, notes

**Impacted Files:**
- `app/recruiter/dashboard/pipeline/page.tsx` — add selection state + comparison modal

**API Changes:** None.

---

### 6. "Send to Client" Talent Summary
**Status:** `PLANNED`

> As a **recruiter**, I want to generate a professional talent summary from my pipeline to send to client companies.

**What it shows:**
- Button on each pipeline card: "Send to Client"
- AI generates a clean professional blurb (name anonymized or not, skills, rate, availability, match reasons)
- Copy to clipboard or open email draft

**Impacted Files:**
- `app/recruiter/dashboard/pipeline/page.tsx` — add button + modal
- `app/api/recruiter/client-summary/route.ts` — new API (Gemini prompt)

**API Changes:**
| Method | Path | Description |
|---|---|---|
| POST | `/api/recruiter/client-summary` | Generates a professional talent summary for client sharing |

---

## Build Order (Recommended)
1. ✅ **Home Dashboard** — most visual, instant wow factor
2. ✅ **Pipeline Badges** — quick win on top of home dashboard work
3. ✅ **Export CSV** — useful, fast to build
4. 🟡 **Analytics Page** — chart-heavy, most impressive for boss demo
5. 🟡 **Candidate Comparison** — great UX feature
6. 🟡 **Send to Client** — AI feature, strong differentiator

## Validation Commands
```bash
pnpm lint
pnpm tsc --noEmit
```
