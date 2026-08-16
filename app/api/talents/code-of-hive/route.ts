import { NextResponse } from "next/server";

import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import {
  CODE_OF_HIVE_COHORT,
  CODE_OF_HIVE_VERSION,
  isKnownCodeOfHiveVersion,
} from "@/app/constants/code-of-hive";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

type SignatureRow = {
  talent: boolean | null;
  talent_status: string | null;
  code_of_hive_signed: boolean | null;
  code_of_hive_signed_at: Date | null;
  code_of_hive_version: string | null;
  code_of_hive_cohort: string | null;
};

/**
 * Signing is open to anyone holding the talent role, not only approved talents.
 * The Code is a commitment, not a credential — gating it on approval would shut
 * out members who are still in review when the announcement reaches them.
 */
function hasTalentRole(row: Pick<SignatureRow, "talent" | "talent_status">) {
  return Boolean(row.talent) || row.talent_status === "approved";
}

/**
 * How many Talents have given their word. Social proof for the landing page.
 *
 * Isolated so a counting failure can never break the CTA state — the page still
 * works, it just omits the count.
 */
async function loadSignatoryCount(): Promise<number | null> {
  const query = (async () => {
    try {
      const rows = await sql<{ count: string }[]>`
        SELECT COUNT(*)::TEXT AS count
        FROM goodhive.talents
        WHERE code_of_hive_signed = TRUE
      `;
      const parsed = Number(rows[0]?.count ?? 0);
      return Number.isFinite(parsed) ? parsed : null;
    } catch (error) {
      console.warn("Code of the Hive signatory count failed:", error);
      return null;
    }
  })();

  // The count is decorative. GoodHive runs Neon's free tier, which suspends
  // when idle, so a cold connect can block for the driver's full 10s timeout —
  // and a logged-out visitor's response needs no database at all. Race it so a
  // sleeping database costs the page a missing count, never a slow response.
  const bail = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));

  return Promise.race([query, bail]);
}

async function loadSignature(userId: string): Promise<SignatureRow | null> {
  const rows = await sql<SignatureRow[]>`
    SELECT
      t.talent,
      u.talent_status,
      t.code_of_hive_signed,
      t.code_of_hive_signed_at,
      t.code_of_hive_version,
      t.code_of_hive_cohort
    FROM goodhive.talents t
    LEFT JOIN goodhive.users u ON u.userid = t.user_id
    WHERE t.user_id = ${userId}
  `;

  return rows[0] ?? null;
}

/** Signature status for the current session user. Drives the page CTA state. */
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    const signatoryCount = await loadSignatoryCount();

    if (!sessionUser) {
      return NextResponse.json({
        authenticated: false,
        eligible: false,
        signed: false,
        signatory_count: signatoryCount,
      });
    }

    const row = await loadSignature(sessionUser.user_id);

    if (!row) {
      return NextResponse.json({
        authenticated: true,
        eligible: false,
        signed: false,
        signatory_count: signatoryCount,
      });
    }

    return NextResponse.json({
      authenticated: true,
      eligible: hasTalentRole(row),
      signed: Boolean(row.code_of_hive_signed),
      signed_at: row.code_of_hive_signed_at,
      version: row.code_of_hive_version,
      cohort: row.code_of_hive_cohort,
      current_version: CODE_OF_HIVE_VERSION,
      signatory_count: signatoryCount,
    });
  } catch (error) {
    console.error("Code of the Hive status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** Sign the Code. */
export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { error: "You must be signed in to give your word." },
        { status: 401 },
      );
    }

    let version = CODE_OF_HIVE_VERSION;
    try {
      const body = await request.json();
      if (typeof body?.version === "string") {
        version = body.version;
      }
    } catch {
      // Empty body is acceptable — fall back to the current version.
    }

    // The client echoes the version it rendered. If the Code was republished
    // while the page sat open, refuse rather than record a signature against
    // text the member never read.
    if (!isKnownCodeOfHiveVersion(version) || version !== CODE_OF_HIVE_VERSION) {
      return NextResponse.json(
        {
          error:
            "The Code has been updated. Please reload the page and read the current version before signing.",
          current_version: CODE_OF_HIVE_VERSION,
        },
        { status: 409 },
      );
    }

    const existing = await loadSignature(sessionUser.user_id);

    if (!existing) {
      return NextResponse.json(
        { error: "No talent profile found for this account." },
        { status: 404 },
      );
    }

    if (!hasTalentRole(existing)) {
      return NextResponse.json(
        { error: "Only GoodHive Talents can sign the Code of the Hive." },
        { status: 403 },
      );
    }

    if (existing.code_of_hive_signed) {
      return NextResponse.json(
        {
          error: "You have already given your word.",
          signed: true,
          signed_at: existing.code_of_hive_signed_at,
          version: existing.code_of_hive_version,
        },
        { status: 409 },
      );
    }

    // The WHERE clause — not the disabled button — is what enforces "cannot sign
    // twice". A double-click or replayed request updates zero rows.
    const updated = await sql<
      {
        code_of_hive_signed_at: Date;
        code_of_hive_version: string;
        code_of_hive_cohort: string;
      }[]
    >`
      UPDATE goodhive.talents
      SET
        code_of_hive_signed = TRUE,
        code_of_hive_signed_at = NOW(),
        code_of_hive_version = ${CODE_OF_HIVE_VERSION},
        code_of_hive_cohort = ${CODE_OF_HIVE_COHORT}
      WHERE user_id = ${sessionUser.user_id}
        AND code_of_hive_signed IS NOT TRUE
      RETURNING code_of_hive_signed_at, code_of_hive_version, code_of_hive_cohort
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "You have already given your word.", signed: true },
        { status: 409 },
      );
    }

    return NextResponse.json({
      signed: true,
      signed_at: updated[0].code_of_hive_signed_at,
      version: updated[0].code_of_hive_version,
      cohort: updated[0].code_of_hive_cohort,
    });
  } catch (error) {
    console.error("Code of the Hive signing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
