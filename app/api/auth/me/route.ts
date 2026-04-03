import { JWT_SECRET, handleAuthError } from "@/lib/auth/jwtConfig";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

type SessionJwtPayload = {
  user_id?: string;
  email?: string;
  wallet_address?: string;
  auth_method?: string;
  iat?: number;
  exp?: number;
};

export async function GET() {
  try {
    // Get the session token from cookies
    const sessionToken = cookies().get("session_token")?.value;
    console.log(sessionToken, "Session Token");

    if (!sessionToken) {
      return NextResponse.json(
        { error: "No session token found" },
        { status: 401 },
      );
    }

    // Verify the JWT token
    const { payload } = await jwtVerify<SessionJwtPayload>(sessionToken, JWT_SECRET);
    const userId = payload.user_id;

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session token" },
        { status: 401 },
      );
    }

    console.log(payload, "payload");
    const users = await sql`
      SELECT talent_status, mentor_status, recruiter_status
      FROM goodhive.users
      WHERE userid = ${userId}
    `;
    const statusRow = users[0] || {};

    // Return the user data from the token
    return NextResponse.json({
      user_id: userId,
      email: payload.email,
      wallet_address: payload.wallet_address,
      auth_method: payload.auth_method || "email",
      talent_status: statusRow.talent_status || "pending",
      mentor_status: statusRow.mentor_status || "pending",
      recruiter_status: statusRow.recruiter_status || "pending",
      iat: payload.iat,
      exp: payload.exp,
    });
  } catch (error) {
    console.log("error payload...", error);
    const authError = handleAuthError(error);
    console.error("Token verification error:", authError.message);

    return NextResponse.json(
      { error: authError.message, code: authError.code },
      { status: authError.statusCode },
    );
  }
}
