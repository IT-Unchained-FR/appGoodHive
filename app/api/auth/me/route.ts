import { getSessionUser } from "@/lib/auth/sessionUtils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        user_id: user.user_id,
        email: user.email,
        wallet_address: user.wallet_address,
      },
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
