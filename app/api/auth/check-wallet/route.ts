import postgres from "postgres";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-jwt-secret-key",
);

export async function POST(req: Request) {
  if (req.method !== "POST") {
    return NextResponse.json(
      { message: "Method Not Allowed" },
      { status: 405 },
    );
  }

  try {
    const { wallet_address } = await req.json();

    if (!wallet_address) {
      return NextResponse.json(
        { message: "Wallet address is required" },
        { status: 400 },
      );
    }

    // Get user details if wallet address exists
    const users = await sql`
      SELECT * FROM goodhive.users
      WHERE wallet_address = ${wallet_address}
    `;

    console.log(users, "Users...");

    if (users.length > 0) {
      const user = users[0];

      // Create session token
      const token = await new SignJWT({
        user_id: user.userid,
        wallet_address: user.wallet_address,
        email: user.email,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(JWT_SECRET);

      // Set session cookie
      cookies().set("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400, // 24 hours
      });

      return NextResponse.json({
        exists: true,
        user: {
          user_id: user.userid,
          email: user.email,
          wallet_address: user.wallet_address,
        },
      });
    } else {
      return NextResponse.json({
        exists: false,
        user: null,
      });
    }
  } catch (error) {
    console.error("Error checking wallet:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
