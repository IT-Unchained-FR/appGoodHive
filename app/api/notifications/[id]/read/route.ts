import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await sql`
      UPDATE goodhive.notifications
      SET read = TRUE
      WHERE id = ${params.id}::uuid AND user_id = ${sessionUser.user_id}::uuid
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return NextResponse.json({ success: false, error: "Failed to update notification" }, { status: 500 });
  }
}
