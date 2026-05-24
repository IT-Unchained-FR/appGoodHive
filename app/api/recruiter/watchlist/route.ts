import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { isApprovedRecruiterOrCompany } from "@/app/lib/recruiting-auth";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

// ── GET — return saved watchlist description + last_run_at ─────────────────────
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const authorized = await isApprovedRecruiterOrCompany(sessionUser.user_id);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Recruiter or company access required" },
        { status: 403 },
      );
    }

    const rows = await sql<{ description: string; last_run_at: string | null }[]>`
      SELECT description, last_run_at
      FROM goodhive.recruiter_watchlist
      WHERE recruiter_id = ${sessionUser.user_id}::uuid
      LIMIT 1
    `;

    return NextResponse.json({
      success: true,
      data: rows.length > 0 ? rows[0] : null,
    });
  } catch (error) {
    console.error("Failed to fetch watchlist:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch watchlist" }, { status: 500 });
  }
}

// ── POST — upsert watchlist description ───────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const authorized = await isApprovedRecruiterOrCompany(sessionUser.user_id);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Recruiter or company access required" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { description?: unknown };
    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (description.length < 50) {
      return NextResponse.json(
        { success: false, error: "Description must be at least 50 characters" },
        { status: 400 },
      );
    }
    if (description.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Description must be at most 5000 characters" },
        { status: 400 },
      );
    }

    await sql`
      INSERT INTO goodhive.recruiter_watchlist (recruiter_id, description)
      VALUES (${sessionUser.user_id}::uuid, ${description})
      ON CONFLICT (recruiter_id) DO UPDATE
        SET description = EXCLUDED.description,
            updated_at  = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save watchlist:", error);
    return NextResponse.json({ success: false, error: "Failed to save watchlist" }, { status: 500 });
  }
}

// ── PATCH — stamp last_run_at = NOW() after a successful search run ────────────
export async function PATCH() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await sql`
      UPDATE goodhive.recruiter_watchlist
      SET last_run_at = NOW(),
          updated_at  = NOW()
      WHERE recruiter_id = ${sessionUser.user_id}::uuid
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update watchlist last_run_at:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update watchlist" },
      { status: 500 },
    );
  }
}
