import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";

import sql from "@/lib/db";
import { getAdminJWTSecret, isAdminAuthError } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

// Mirrors app/api/admin/talents/status/route.ts: revoking is destructive, so it
// asserts the admin role on the token rather than only checking the token parses.
const verifyAdminToken = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    throw new Error("No token provided");
  }

  try {
    const decoded = verify(token, getAdminJWTSecret()) as { role: string };
    if (decoded.role !== "admin") {
      throw new Error("Not authorized");
    }
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

type SignatureRow = {
  code_of_hive_signed: boolean | null;
  code_of_hive_signed_at: Date | null;
  code_of_hive_version: string | null;
  code_of_hive_cohort: string | null;
};

/** Signature detail for the admin review surface. */
export async function GET(request: Request) {
  try {
    await verifyAdminToken();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    const rows = await sql<SignatureRow[]>`
      SELECT
        code_of_hive_signed,
        code_of_hive_signed_at,
        code_of_hive_version,
        code_of_hive_cohort
      FROM goodhive.talents
      WHERE user_id = ${userId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Talent not found" }, { status: 404 });
    }

    return NextResponse.json({
      signed: Boolean(rows[0].code_of_hive_signed),
      signed_at: rows[0].code_of_hive_signed_at,
      version: rows[0].code_of_hive_version,
      cohort: rows[0].code_of_hive_cohort,
    });
  } catch (error) {
    if (isAdminAuthError(error)) {
      return NextResponse.json({ error: (error as Error).message }, { status: 401 });
    }

    console.error("Code of the Hive admin read error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Revoke a badge.
 *
 * Clears the signature entirely rather than flagging it, so the Talent can give
 * their word again later. The Phase 2 token columns are cleared too — a revoked
 * commitment must not leave a mintable SBT reference behind.
 */
export async function DELETE(request: Request) {
  try {
    await verifyAdminToken();

    let userId: string | undefined;
    try {
      const body = await request.json();
      userId = typeof body?.user_id === "string" ? body.user_id : undefined;
    } catch {
      userId = undefined;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    const revoked = await sql<{ user_id: string }[]>`
      UPDATE goodhive.talents
      SET
        code_of_hive_signed = FALSE,
        code_of_hive_signed_at = NULL,
        code_of_hive_version = NULL,
        code_of_hive_cohort = NULL,
        code_of_hive_token_id = NULL,
        code_of_hive_token_chain = NULL,
        code_of_hive_token_tx = NULL
      WHERE user_id = ${userId}
      RETURNING user_id
    `;

    if (revoked.length === 0) {
      return NextResponse.json({ error: "Talent not found" }, { status: 404 });
    }

    return NextResponse.json({ revoked: true, user_id: revoked[0].user_id });
  } catch (error) {
    if (isAdminAuthError(error)) {
      return NextResponse.json({ error: (error as Error).message }, { status: 401 });
    }

    console.error("Code of the Hive revoke error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
