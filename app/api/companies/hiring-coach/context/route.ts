import { NextResponse } from "next/server";

import { getHiringCoachContext } from "@/lib/ai/company-hiring-coach";
import { getSessionUser } from "@/lib/auth/sessionUtils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const context = await getHiringCoachContext(sessionUser.user_id);
    if (!context) {
      return NextResponse.json(
        { success: false, error: "Company profile not found" },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, data: context }, { status: 200 });
  } catch (error) {
    console.error("Failed to load hiring coach context:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load hiring coach context" },
      { status: 500 },
    );
  }
}
