import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";

const ALLOWED_STATUSES = [
  "immediately",
  "weeks_2",
  "weeks_4",
  "months_3",
  "not_looking",
] as const;

type AvailabilityStatus = (typeof ALLOWED_STATUSES)[number];

function isAvailabilityStatus(value: unknown): value is AvailabilityStatus {
  return typeof value === "string" && ALLOWED_STATUSES.includes(value as AvailabilityStatus);
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const actorUserId = sessionUser?.user_id ?? null;
    if (!actorUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { status?: unknown };
    if (!isAvailabilityStatus(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid availability status" },
        { status: 400 },
      );
    }

    const talentRows = await sql<{ user_id: string }[]>`
      SELECT user_id
      FROM goodhive.talents
      WHERE user_id = ${actorUserId}::uuid
      LIMIT 1
    `;

    if (talentRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const status = body.status;
    const updatedRows = await sql<{
      availability_status: string;
      availability_updated_at: string;
    }[]>`
      UPDATE goodhive.talents
      SET
        availability_status = ${status},
        availability_updated_at = NOW(),
        availability = CASE
          WHEN ${status} = 'immediately' THEN true
          ELSE false
        END
      WHERE user_id = ${actorUserId}::uuid
      RETURNING availability_status, availability_updated_at
    `;

    if (updatedRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Talent profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          status: updatedRows[0].availability_status,
          updatedAt: updatedRows[0].availability_updated_at,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to update availability status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update availability status" },
      { status: 500 },
    );
  }
}
