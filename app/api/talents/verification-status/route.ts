import sql from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userId =
      request.headers.get("x-user-id") ||
      request.nextUrl.searchParams.get("userId") ||
      request.cookies.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
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
