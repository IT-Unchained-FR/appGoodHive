import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    // Check if user exists and get their login method
    const users = await sql`
      SELECT 
        CASE 
          WHEN wallet_address IS NOT NULL AND email = ${email} THEN 'email'
          ELSE 'unknown'
        END as login_method
      FROM goodhive.users
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({
      loginMethod: users[0].login_method,
    });
  } catch (error) {
    console.error("Error checking account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
