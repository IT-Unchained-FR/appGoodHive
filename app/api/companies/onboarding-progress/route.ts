import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/sessionUtils";
import { getCompanyOnboardingProgress } from "@/lib/jobs/company-onboarding";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const progress = await getCompanyOnboardingProgress(sessionUser.user_id);
    return NextResponse.json({ success: true, data: progress });
  } catch (error) {
    console.error("Failed to load company onboarding progress:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load onboarding progress" },
      { status: 500 },
    );
  }
}
