# Architecture Overview — GoodHive

> This document is the **primary context file** for any AI agent (Claude Code, Codex, or other LLMs) working in this repo. Read this before touching any code.

---

## 1. What is GoodHive?

GoodHive is a **full-stack AI-powered talent marketplace** built with Next.js. It connects:

- **Talents** — skilled professionals who create profiles, list skills, upload CVs, and apply to jobs
- **Companies** — businesses that post job offers, search talents, and manage applications
- **Admins** — platform operators who moderate, approve, and govern content

Key differentiators:
- AI-powered profile enhancement (Gemini extracts and enriches skills from PDF CVs)
- AI Superbot — a chatbot assistant embedded in the platform
- Blockchain-based skill credential NFTs (Thirdweb)
- Real-time messenger between talents and companies
- Telegram bot for outreach automation
- Referral system for growth

---

## 2. Tech Stack (Full Detail)

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14+ App Router | `app/` directory, Server Components + Client Components |
| Language | TypeScript (strict) | `tsconfig.json` strict mode; avoid `any` |
| Styling | Tailwind CSS + Framer Motion + Radix UI | Custom tokens in `app/globals.css`; animations in `app/globals-animations.css` |
| Database | PostgreSQL via `pg` (raw SQL) | No ORM — see `app/lib/db.ts` |
| Auth | Iron Session + JWT (`jose`/`jsonwebtoken`) + bcryptjs | HTTP-only cookies; admin has separate auth |
| AI | Google Gemini (`@google/generative-ai`), Google Vertex AI, OpenAI | Gemini primary; OpenAI secondary |
| File Storage | AWS S3 (`@aws-sdk/client-s3`) | Profile photos, CVs, attachments |
| Email | Resend | Transactional emails via templates in `app/lib/email/` |
| CMS | Sanity | Blog, marketing content; separate Sanity Studio |
| Blockchain | Thirdweb + Hardhat | Skill credential NFTs; contracts in `contracts/` |
| Forms | react-hook-form + Zod + Yup | Mixed validation libs (tech debt) |
| Tables | mantine-react-table | Data tables in admin |
| Drag-and-drop | @dnd-kit | Profile section ordering |
| Package manager | pnpm | Use `pnpm` always, never `npm` or `yarn` |
| Deployment | Vercel + Google Cloud Run | `vercel.json` config; `cloudbuild.yaml` for GCR |
| Analytics | Vercel Analytics + Speed Insights | `@vercel/analytics`, `@vercel/speed-insights` |
| Monitoring | Sentry | `sentry.client.config.ts`, `sentry.server.config.ts` |

---

## 3. Directory Structure (Annotated)

```
GoodHive-Web/
├── app/                          # Next.js App Router root
│   ├── api/                      # All API route handlers
│   │   ├── admin/                # Admin governance APIs
│   │   │   ├── companies/        # Approve/reject companies
│   │   │   ├── jobs/             # Manage job listings
│   │   │   ├── talents/          # Manage talent profiles
│   │   │   └── referrals/        # Referral admin
│   │   ├── ai-enhance/           # AI profile text enhancement (Gemini)
│   │   ├── ai-extract-skills/    # AI skill extraction from PDF/text
│   │   ├── applications/         # Job application CRUD
│   │   ├── auth/                 # Login, register, logout, session
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── logout/
│   │   │   └── session/          # Iron session read endpoint
│   │   ├── blockchain/           # Web3 credential minting APIs
│   │   ├── companies/            # Company CRUD + search
│   │   ├── content-items/        # Content management
│   │   ├── job-requests/         # Job request handling
│   │   ├── jobs/                 # Job listing CRUD + search
│   │   ├── messenger/            # Real-time messaging (polling-based)
│   │   ├── pdf-to-profile/       # PDF CV → structured profile data (AI)
│   │   ├── profile/              # User profile update APIs
│   │   ├── prompts/              # AI prompt management
│   │   ├── referrals/            # Referral link system
│   │   ├── send-email/           # Email dispatch API
│   │   ├── superbot/             # AI chatbot conversation API
│   │   ├── talents/              # Talent listing + search + detail
│   │   ├── telegram/             # Telegram bot webhook
│   │   └── upload-file/          # S3 file upload signed URL
│   ├── lib/                      # Server-side helpers and services
│   │   ├── db.ts                 # PostgreSQL pool singleton (pg)
│   │   ├── auth/                 # Session utilities, JWT helpers, guards
│   │   ├── admin-auth.ts         # Admin-specific auth logic
│   │   ├── admin-validations.ts  # Admin input validation
│   │   ├── access-control.ts     # Role-based access control
│   │   ├── gemini.ts             # Gemini AI client wrapper
│   │   ├── googleAuth.ts         # Google OAuth helper
│   │   ├── email/                # Resend email templates and dispatch
│   │   ├── contracts/            # Blockchain contract interaction helpers
│   │   ├── blog.ts               # Sanity blog fetch helpers
│   │   ├── analytics.ts          # Analytics helpers
│   │   ├── ga.ts                 # Google Analytics helper
│   │   ├── admin-filters.ts      # Admin list filter logic
│   │   ├── country-mapping.ts    # Country code → name mapping
│   │   ├── fetch-admin-companies.ts  # Fetch companies for admin
│   │   ├── fetch-admin-jobs.ts   # Fetch jobs for admin
│   │   ├── fetch-admin-talents.ts    # Fetch talents for admin
│   │   ├── fetch-company-data.ts # Fetch company profile data
│   │   ├── fetch-company-jobs.ts # Fetch jobs for a company
│   │   ├── fetch-pending-company.ts  # Pending company approval data
│   │   ├── fetch-profile-data.ts # Fetch talent profile data
│   │   └── fetch-talent-data.ts  # Fetch individual talent data
│   ├── admin/                    # Admin panel UI pages
│   ├── auth/                     # Auth UI pages (login/register)
│   ├── jobs/                     # Job listing pages
│   ├── talents/                  # Talent listing + profile pages
│   ├── companies/                # Company listing + profile pages
│   ├── user-profile/             # Logged-in user's own profile
│   ├── superbot/                 # AI assistant page
│   ├── blog/                     # Sanity CMS blog
│   ├── messages/                 # Messenger UI
│   ├── about-us/                 # Marketing page
│   ├── faq/                      # FAQ page
│   ├── contact/                  # Contact page
│   ├── components/               # App-level components (layout, nav, etc.)
│   ├── hooks/                    # App-level React hooks
│   ├── contexts/                 # React context providers
│   ├── config/                   # App-level config constants
│   ├── constants/                # Shared constants
│   ├── db/                       # DB migration SQL scripts
│   ├── email-templates/          # Email HTML templates
│   ├── layout.tsx                # Root layout (fonts, providers, analytics)
│   ├── globals.css               # Design tokens, base styles, Tailwind
│   └── globals-animations.css    # Framer Motion animation utilities
├── components/                   # Root-level shared React components (UI kit)
├── types/                        # Global TypeScript interfaces
├── utils/                        # Pure utility functions
├── hooks/                        # Root-level custom React hooks
├── interfaces/                   # Additional TypeScript interfaces
├── middleware.ts                 # Next.js middleware (route protection)
├── contracts/                    # Hardhat Solidity contracts
├── prisma/                       # (Legacy/partial) Prisma schema
├── scripts/                      # DB seeding and migration scripts
├── public/                       # Static assets
└── docs/                         # Planning, architecture, tasks, reviews
    ├── architecture/             # overview.md, decisions.md
    ├── features/                 # Feature plan docs (one per feature)
    ├── tasks/                    # current-task.md (active work)
    ├── reviews/                  # Code review records
    └── workflows/                # ai-collaboration.md
```

---

## 4. Data Flow (Step by Step)

### Typical Talent Profile API Request
1. Client component calls `fetch('/api/profile', { method: 'POST', body: JSON.stringify(data) })`
2. `app/api/profile/route.ts` receives the request
3. Reads Iron Session cookie → extracts `userId`, `role`
4. Validates request body (Zod or manual)
5. Calls `app/lib/db.ts` pool: `pool.query('UPDATE talents SET ... WHERE id = $1', [userId, ...])`
6. Returns `NextResponse.json({ success: true, data: updatedProfile })`

### AI Profile Enhancement Flow
1. User uploads PDF CV
2. `POST /api/pdf-to-profile` → extracts text via `pdf-parse` + Puppeteer
3. Text sent to Gemini via `app/lib/gemini.ts` with structured prompt
4. Gemini returns JSON: `{ skills, experience, education, summary }`
5. Front-end populates profile fields
6. User reviews and saves → `POST /api/profile`

### Auth Flow (Iron Session)
1. `POST /api/auth/login` → validates credentials → creates Iron Session → sets encrypted cookie
2. Subsequent requests → middleware reads session → injects user context
3. `GET /api/auth/session` → returns current user from session
4. `POST /api/auth/logout` → destroys session

---

## 5. Database (PostgreSQL Raw SQL)

**Connection:** `app/lib/db.ts` exports a `pg.Pool` singleton.

**Key tables (inferred):**
- `talents` — talent profiles (id, user_id, skills, bio, experience, etc.)
- `companies` — company profiles (id, name, industry, status, etc.)
- `jobs` — job listings (id, company_id, title, description, status, etc.)
- `applications` — talent ↔ job applications (id, talent_id, job_id, status, etc.)
- `users` — authentication (id, email, password_hash, role, etc.)
- `messages` — messenger messages (id, sender_id, receiver_id, content, etc.)
- `referrals` — referral tracking

**Pattern for writing queries:**
```typescript
import { pool } from '@/app/lib/db';
const { rows } = await pool.query(
  'SELECT * FROM talents WHERE id = $1',
  [talentId]
);
```

---

## 6. Auth Patterns

```typescript
// Read session in API route
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/app/lib/auth/session-options';

const session = await getIronSession(req, res, sessionOptions);
if (!session.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
```

```typescript
// Admin auth check
import { verifyAdminToken } from '@/app/lib/admin-auth';
const admin = await verifyAdminToken(request);
if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

---

## 7. AI Integration Patterns

```typescript
// Gemini call (app/lib/gemini.ts)
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
const result = await model.generateContent(prompt);
const text = result.response.text();
```

**Cost considerations:**
- Always set `maxOutputTokens` limits on Gemini calls
- Rate-limit AI endpoints (currently no rate limiting — tech debt)
- Log AI call durations and token counts for cost monitoring

---

## 8. API Response Conventions

Current (inconsistent — tech debt):
```typescript
// Most routes return:
return NextResponse.json({ success: true, data: result });
return NextResponse.json({ success: false, error: 'message' }, { status: 400 });

// Some return flat objects (inconsistent):
return NextResponse.json(result);
return NextResponse.json({ error: 'message' }, { status: 500 });
```

**Target convention (use for new routes):**
```typescript
return NextResponse.json({ success: true, data: result });
return NextResponse.json({ success: false, error: 'Descriptive message' }, { status: statusCode });
```

---

## 9. Frontend Patterns

**Server Component (default, SSR):**
```typescript
// app/talents/page.tsx
export default async function TalentsPage() {
  const data = await fetchTalentData(); // server-side call to DB helper
  return <TalentList talents={data} />;
}
```

**Client Component (for interactivity):**
```typescript
'use client';
import { useState } from 'react';
// interactive component
```

**Data fetching from client:**
```typescript
const res = await fetch('/api/talents', { method: 'GET' });
const { success, data } = await res.json();
```

---

## 10. Known Technical Debt

| Issue | Location | Impact |
|---|---|---|
| Raw SQL everywhere | All `app/api/**/route.ts` | Hard to refactor, no type safety |
| Mixed validation (Zod vs Yup vs manual) | Various | Inconsistent error messages |
| No unified API response envelope | All API routes | Client code handles multiple shapes |
| No rate limiting on AI endpoints | `/api/ai-*`, `/api/superbot` | Cost risk, abuse vector |
| Multiple `pg` client instantiations | Various `lib/` files | Potential connection pool exhaustion |
| `any` types in AI integration | `app/lib/gemini.ts` area | Type safety gaps |
| No test coverage beyond Playwright smoke | N/A | Regressions hard to catch |
| Messenger is polling-based | `/api/messenger` | Not real-time, high server load at scale |

---

## 11. Environment Variables (Key)

```
# Database
DATABASE_URL=postgresql://...

# Auth
IRON_SESSION_SECRET=...
JWT_SECRET=...

# AI
GEMINI_API_KEY=...
OPENAI_API_KEY=...
GOOGLE_APPLICATION_CREDENTIALS=...  (Vertex AI)

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
S3_BUCKET_NAME=...

# Email
RESEND_API_KEY=...

# CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=...

# Blockchain
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=...

# Telegram
TELEGRAM_BOT_TOKEN=...
```

---

## 12. Current Feature Inventory

| Feature | Status | Key Files |
|---|---|---|
| Talent profiles | Live | `app/talents/`, `app/api/talents/`, `app/api/profile/` |
| Company profiles | Live | `app/companies/`, `app/api/companies/` |
| Job listings + applications | Live | `app/jobs/`, `app/api/jobs/`, `app/api/applications/` |
| Admin panel | Live | `app/admin/`, `app/api/admin/` |
| AI profile enhancement | Live | `app/api/ai-enhance/`, `app/api/ai-extract-skills/` |
| PDF-to-profile (AI) | Live | `app/api/pdf-to-profile/` |
| Superbot AI assistant | Live | `app/superbot/`, `app/api/superbot/` |
| Real-time messenger | Live (polling) | `app/messages/`, `app/api/messenger/` |
| Referral system | Live | `app/api/referrals/` |
| Blockchain credentials | Experimental | `app/api/blockchain/`, `contracts/` |
| Blog (Sanity CMS) | Live | `app/blog/`, `app/lib/blog.ts` |
| Telegram bot | Live | `app/api/telegram/` |
| Google OAuth | Live | `app/lib/googleAuth.ts` |
| Email notifications | Live | `app/lib/email/`, `app/api/send-email/` |
