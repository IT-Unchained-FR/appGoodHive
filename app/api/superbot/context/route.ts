import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { buildTalentContext } from "@/lib/ai/superbot-context";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const context = await buildTalentContext(sessionUser.user_id);
    return NextResponse.json({ success: true, data: context });
  } catch (error) {
    console.error("Failed to build superbot context:", error);
    return NextResponse.json({ success: false, error: "Failed to load context" }, { status: 500 });
  }
}
