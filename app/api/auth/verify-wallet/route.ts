import postgres from "postgres";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

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
    const { wallet_address, user_id, email } = await req.json();

    if (!wallet_address || !user_id || !email) {
      return NextResponse.json(
        { message: "Wallet address, user ID, and email are required" },
        { status: 400 },
      );
    }

    // First, try to find user by email
    const existingUsers = await sql`
      SELECT * FROM goodhive.users
      WHERE email = ${email}
    `;

    let user;

    if (existingUsers.length > 0) {
      // User exists with this email, update their wallet_address
      const updatedUsers = await sql`
        UPDATE goodhive.users
        SET wallet_address = ${wallet_address}
        WHERE email = ${email}
        RETURNING *
      `;
      user = updatedUsers[0];
    } else {
      // Check if wallet address is already in use
      const walletUsers = await sql`
        SELECT * FROM goodhive.users
        WHERE wallet_address = ${wallet_address}
      `;

      if (walletUsers.length > 0) {
        return NextResponse.json(
          { message: "Wallet address already associated with another account" },
          { status: 409 },
        );
      }

      // Create new user
      const newUsers = await sql`
        INSERT INTO goodhive.users (
          wallet_address,
          email,
          mentor_status,
          recruiter_status,
          talent_status
        ) VALUES (
          ${wallet_address},
          ${email},
          'pending',
          'pending',
          'pending'
        )
        RETURNING *
      `;

      user = newUsers[0];
    }

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
      message: "Wallet verification successful",
      user: {
        user_id: user.userid,
        email: user.email,
        wallet_address: user.wallet_address,
        mentor_status: user.mentor_status,
        recruiter_status: user.recruiter_status,
        talent_status: user.talent_status,
      },
    });
  } catch (error) {
    console.error("Error verifying wallet:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
