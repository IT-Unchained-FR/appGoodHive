# Feature: Code of the Hive — MVP

## Status
`IN REVIEW` — all three phases built, typechecked, linted, and visually verified. Migration not yet applied to any environment.

## Business Goal
Benoit has two client meetings this week and a newsletter going out to every Hive member. The Code of the Hive is the announcement centrepiece: a public, signed commitment that turns GoodHive's trust promise into something visible on every Talent profile.

Strategically it is the foundation layer of the reputation system — the Code is the *promise*, reputation (peer recommendations, Hiring Sprints, placements) will later be the *proof*. It also lays the schema groundwork for Phase 2 Soulbound Tokens without blocking MVP on blockchain.

## User Story
> As a **Talent**, I want to read the Code of the Hive and formally give my word, so that a public badge on my profile signals my commitment to clients and fellow members.

> As an **Admin**, I want to see who signed, when, and which version — and revoke a badge if necessary.

## Acceptance Criteria
1. `/code-of-the-hive` is publicly accessible (logged out included).
2. A logged-in Talent can sign the Code.
3. Signature + timestamp + version are persisted.
4. The Talent cannot sign twice (enforced server-side).
5. A signed Talent gets the badge on their profile.
6. The badge is visible publicly (not gated behind `canViewSensitive`).
7. The badge links back to `/code-of-the-hive`.
8. Existing Talent accounts work without migration issues.
9. Logged-out visitor clicking the CTA returns to `/code-of-the-hive` after auth.
10. Admin can see signed status / date / version and revoke.

## Out of Scope
- **SBT minting / any blockchain interaction** — Phase 2. No wallet prompt, no transaction. Schema placeholders only.
- **Reputation points** — signing awards zero points, by explicit design.
- **Non-Talent roles** — companies, recruiters, mentors cannot sign in MVP. Confirmed talent-only with Benoit.
- **Any admin surface beyond read + revoke** — spec says "Do not build additional administration for MVP."
- Email confirmation on signing, social share cards, signatory directory/leaderboard.

## Impacted Files / Modules

**New**
- `database/migrations/add_code_of_hive.sql` — schema
- `app/constants/code-of-hive.ts` — versioned Code content (7 principles + Commitment)
- `app/code-of-the-hive/page.tsx` — public landing page
- `app/code-of-the-hive/page.module.scss` — page styles
- `app/components/code-of-hive/SignCodeModal.tsx` — confirmation modal
- `app/components/code-of-hive/CodeOfHiveBadge.tsx` — compact profile chip
- `app/components/code-of-hive/CodeOfHiveSeal.tsx` — full artwork variant
- `app/api/talents/code-of-hive/route.ts` — `POST` sign
- `app/api/admin/talents/code-of-hive/route.ts` — `DELETE` revoke
- `public/img/code-of-hive-badge.png` + `.webp` — **asset must be committed by Juhan**

**Modified**
- `app/api/talents/my-profile/route.ts` — add signature columns to `SELECT`
- `app/talents/[user_id]/types.ts` — extend `TalentProfileData`
- `app/components/talent-page/TalentPageHeader.tsx` — render badge chip
- `app/admin/talent/[user_id]/page.tsx` — admin read + revoke control
- `app/api/admin/talents/[userId]/route.ts` — include signature fields in admin payload
- `database/schema-latest.sql` — keep in sync

## API Changes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/talents/code-of-hive` | `getSessionUser()` + talent role | Sign the Code. Idempotent-safe: returns `409` if already signed. |
| DELETE | `/api/admin/talents/code-of-hive` | `requireAdminAuth()` | Revoke a badge; nulls all signature fields. |

Read path reuses the existing `GET /api/talents/my-profile?user_id=` — no new read endpoint.

### POST contract
```jsonc
// request
{ "version": "1.0" }   // client echoes the version it rendered

// 200
{ "signed": true, "signed_at": "2026-08-16T...Z", "version": "1.0" }
// 409 — already signed
// 403 — not a talent
// 409 — version mismatch (client rendered stale text)
```

Echoing the version guards a real edge case: if Benoit edits the Code while a Talent has the page open, we must not record them as having signed text they never saw.

## DB Changes

- New tables: none
- New columns on `goodhive.talents`:

```sql
ALTER TABLE goodhive.talents
ADD COLUMN IF NOT EXISTS code_of_hive_signed      BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS code_of_hive_signed_at   TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS code_of_hive_version     VARCHAR(10),
ADD COLUMN IF NOT EXISTS code_of_hive_cohort      VARCHAR(50),
-- Phase 2 SBT placeholders — unused in MVP (spec §6)
ADD COLUMN IF NOT EXISTS code_of_hive_token_id    VARCHAR(255),
ADD COLUMN IF NOT EXISTS code_of_hive_token_chain VARCHAR(50),
ADD COLUMN IF NOT EXISTS code_of_hive_token_tx    VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_talents_code_of_hive_signed
  ON goodhive.talents (code_of_hive_signed) WHERE code_of_hive_signed = TRUE;
```

All columns nullable or defaulted → every existing Talent row stays valid, satisfying AC-8. Follows the established `ADD COLUMN IF NOT EXISTS` pattern from `add_talent_rate_range.sql`.

**On `code_of_hive_cohort`:** the badge artwork has `NUPTIAL FLIGHT 2026` permanently rendered into it. Storing the cohort at signing time (`"nuptial-flight-2026"`) and mapping cohort → asset path means the 2027 artwork is a config entry, not a migration plus backfill. One column, added now while the table is already being altered.

## Design Implementation

The supplied artwork is a high-detail raster seal: gold shield, bee motif, `CODE OF THE HIVE` / `COMMITTED MEMBER` / `NUPTIAL FLIGHT 2026`. Two render variants are required — scaling the full seal down to profile-header size renders its fine text illegible.

| Variant | Where | Size | Composition |
|---|---|---|---|
| `CodeOfHiveSeal` | Landing page hero, success state, badge modal | 240–320px | Full artwork, `next/image`, `priority` on landing only |
| `CodeOfHiveBadge` | Talent profile header | ~28px glyph + text | Gold hexagon glyph + "Code of the Hive" + "Member since August 2026" |
| `CodeOfHiveBadge variant="compact"` | Talent cards on `/companies/search-talents` | ~130x26px | Same chip, denser: 15px glyph, 11px title, no "Member since" subtitle. Sits under the talent name, above the location line. |

The compact chip matches the MVP spec's own description (`⬡ Code of the Hive / Member since August 2026`), so spec and artwork agree. Clicking either navigates to `/code-of-the-hive`.

**On `variant="compact"`:** shipped in the MVP but unused, and it only dropped the subtitle — the chip kept profile-header sizing. As of 2026-08-19 it also carries a `.compact` size modifier, because at 13px text beside a 12-14px card name the default chip out-weighed the name it was vouching for. The navy-and-gold palette is unchanged on purpose: the chip's job is to read as the same object the viewer saw on the landing page, and deep navy is the highest-contrast mark available against the card's cream/amber ground.

**Asset handling:** export WebP alongside the PNG and serve via `next/image`. Talent profile pages are already image-heavy; the full seal must not be shipped on profile routes at all — only the hexagon glyph is.

Palette pulled from the artwork for page accents: gold `#F0B429`/`#FFD75E`, deep purple `#4A1D7A`, near-black navy `#1A1333`. Reconcile against existing tokens in `app/globals.css` before hardcoding.

## AI / External Service Changes
None. No AI calls, no S3 uploads, no email sends, no blockchain transactions in this feature.

## Implementation Phases

**Phase A — design-independent (start immediately)**
1. Migration + `schema-latest.sql` sync
2. `app/constants/code-of-hive.ts` — content keyed by version `"1.0"`
3. `POST /api/talents/code-of-hive` with conditional-update double-sign guard
4. `my-profile` route + `types.ts` field plumbing

**Phase B — needs the badge asset**
5. `CodeOfHiveSeal` + `CodeOfHiveBadge` components
6. `/code-of-the-hive` landing page with three CTA states
7. `SignCodeModal` + success state
8. Badge slot in `TalentPageHeader`

**Phase C — admin + verification**
9. Admin read + revoke
10. Full acceptance-criteria pass

## Key Implementation Notes

**Double-sign guard (AC-4)** — enforce in SQL, not UI:
```sql
UPDATE goodhive.talents
SET code_of_hive_signed = TRUE, code_of_hive_signed_at = NOW(), ...
WHERE user_id = $1 AND code_of_hive_signed IS NOT TRUE
RETURNING code_of_hive_signed_at;
```
Zero rows returned → already signed → `409`. Immune to double-click and replayed requests.

**Badge is DB-derived only** — no client-supplied input reaches the badge render path, satisfying spec §4 ("cannot be manually added by the Talent").

**Public visibility (AC-6)** — the badge renders outside the `canViewSensitive` gate in `TalentPageHeader`. Note that `app/talents/[user_id]/page.tsx:140` returns an "under review" screen for `!approved` talents, so an unapproved Talent's badge is not publicly visible until approval — correct behaviour, not a bug.

**Return-after-login (AC-9)** — reuse the existing `ReturnUrlManager.setPromptedAuth()` in `app/utils/returnUrlManager.ts`. No new auth work.

**Versioned content** — the 7 principles live in a constant keyed by version, never inline in JSX. This is what makes `code_of_hive_version` meaningful when the text evolves.

## Validation Commands
```bash
pnpm lint
pnpm tsc --noEmit
```

Manual acceptance pass:
- Logged out → `/code-of-the-hive` renders → "Join the Code" → auth → lands back on `/code-of-the-hive`
- Logged-in Talent → sign → success state → badge on profile
- Double-click "Sign the Code" → exactly one signature row
- Log out → view that Talent's public profile → badge visible, links to the Code
- Admin → talent detail → signed/date/version shown → revoke → badge disappears
- Non-talent (company/recruiter) account → no sign CTA

## Open Questions / TBDs
- **RESOLVED — roles:** Talent only. Other roles possibly later.
- **RESOLVED — design:** artwork supplied; see Design Implementation.
- **Talent eligibility:** plan gates on holding the talent role (`talent = true`), not `talent_status = 'approved'`, so in-review members reached by the newsletter can still sign. Awaiting Benoit's confirmation — low risk either way, one-line change.
- **RESOLVED — signatory count:** built. `GET /api/talents/code-of-hive` returns `signatory_count`; the page shows "N members have given their word." Hidden below 5 signatories, since a low number reads as weakness rather than proof.
- **RESOLVED — badge asset:** `public/img/Code_Of_The_Hive_Nuptial_Flight.png` (source) plus the derived `code-of-hive-badge.webp` that actually ships.
- **RESOLVED — migration:** applied to `goodhive-prod` on 2026-08-16 with explicit authorization, in a single transaction. 199 talent rows before and after; 45 → 52 columns; all existing rows backfilled to `code_of_hive_signed = false` (not NULL) by the column default.

## Review Checklist
- [ ] Acceptance criteria met (all 10)
- [ ] No unrelated files changed
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Migration verified against a copy of production data
- [ ] Docs updated (`current-task.md` handoff note)
