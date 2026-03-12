import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";

export async function POST() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await sql`
      UPDATE goodhive.notifications
      SET read = TRUE
      WHERE user_id = ${sessionUser.user_id}::uuid AND read = FALSE
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return NextResponse.json({ success: false, error: "Failed to update notifications" }, { status: 500 });
  }
}
