import sql from "@/lib/db";
import { getApiUserId } from "@/lib/auth/api-guards";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Always the caller's own status — the header/query/cookie inputs this
    // used to accept let anyone probe another account's review state.
    const userId = await getApiUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Query the actual approval status from talents table
    const talentProfile = await sql`
      SELECT approved, inreview
      FROM goodhive.talents
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (talentProfile.length === 0) {
      return NextResponse.json(
        {
          isApproved: false,
          inReview: false,
          hasProfile: false
        },
        { status: 200 },
      );
    }

    const profile = talentProfile[0];

    return NextResponse.json({
      isApproved: profile.approved === true,
      inReview: profile.inreview === true,
      hasProfile: true,
    });
  } catch (error) {
    console.error("Error checking verification status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
