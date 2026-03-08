# Architecture Decision Records (ADRs)

## ADR-001: Raw pg over ORM

**Date:** 2024 (inferred)
**Status:** Active

**Decision:** Use raw `pg` PostgreSQL client directly instead of an ORM like Prisma or Drizzle.

**Rationale:** Flexibility for complex queries, existing codebase style.

**Consequences:** No type-safe query builder, schema changes require manual migration scripts, higher cognitive load for DB work.

---

## ADR-002: Iron Session for Auth

**Date:** 2024 (inferred)
**Status:** Active

**Decision:** Use Iron Session (HTTP-only encrypted cookies) as the primary session mechanism, supplemented by JWT (`jose`) for token verification.

**Rationale:** Simple, stateless, no Redis dependency.

**Consequences:** Session size limits apply; token revocation requires either short TTLs or a blocklist.

---

## ADR-003: Multi-AI Strategy

**Date:** 2025
**Status:** Active

**Decision:** Use multiple AI providers — Google Gemini/Vertex AI for profile enhancement and skill extraction, OpenAI for supplementary tasks, and custom Superbot.

**Rationale:** Different models have different strengths; redundancy reduces single-vendor risk.

**Consequences:** Multiple API keys to manage, cost monitoring across providers required, inconsistent response formats need normalization.

---

## ADR-004: Sanity as CMS

**Date:** 2024 (inferred)
**Status:** Active

**Decision:** Use Sanity headless CMS for blog and marketing content.

**Rationale:** Non-technical content editing, rich media support.

**Consequences:** Content schema changes require Sanity Studio deploys; CDN-cached content.

---

## ADR-005: Blockchain Credentials

**Date:** 2025
**Status:** Experimental

**Decision:** Use Thirdweb + Hardhat to issue on-chain skill/credential NFTs to talents.

**Rationale:** Tamper-proof, verifiable credentials as a differentiator.

**Consequences:** Gas costs, wallet onboarding friction for talents, experimental feature risk.

---

## ADR-006: Single Contact Email — benoit@goodhive.io

**Date:** 2026-03-09
**Status:** Active

**Decision:** All platform emails — admin notifications, contact page, footer, and any hardcoded contact address — use `benoit@goodhive.io`. There is no `contact@goodhive.io` or any other address in use.

**Consequence for Codex:**
- Never hardcode `contact@goodhive.io` or any other email anywhere.
- Admin notification email is controlled by `GoodHiveContractEmail` in `app/constants/common.ts` — currently set to `benoit@goodhive.io`.
- Contact page (`app/contact/page.tsx`) and footer (`app/components/footer/footer.constants.ts`) also use `benoit@goodhive.io`.
- Email sender address (the `from` field) is always `GoodHive <no-reply@goodhive.io>` — never expose a personal address as sender.

---

<!-- Add new ADRs below this line -->
