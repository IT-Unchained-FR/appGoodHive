import {
  SEVEN_DAYS_IN_SECONDS,
  clientAccessibleCookieConfig,
  secureHttpOnlyCookieConfig,
} from "@/lib/auth/cookieConfig";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-jwt-secret-key",
);

export async function POST(req: Request) {
  try {
    const {
      okto_wallet_address,
      email,
      login_method,
      user_id,
      wallet_address,
    } = await req.json();

    if (!okto_wallet_address) {
      return NextResponse.json(
        { message: "Wallet address is required" },
        { status: 400 },
      );
    }

    // Check if user exists with this email
    const existingUsers = await sql`
      SELECT * FROM goodhive.users
      WHERE email = ${email}
    `;

    let user;

    if (existingUsers.length > 0) {
      // User exists with this email, update their okto_wallet_address and login_method
      const updatedUsers = await sql`
        UPDATE goodhive.users
        SET okto_wallet_address = ${okto_wallet_address},
            ${wallet_address ? sql`wallet_address = ${wallet_address},` : sql``}
            login_method = ${login_method}
        WHERE email = ${email}
        RETURNING *
      `;
      user = updatedUsers[0];
    } else {
      // Create new user
      const newUsers = await sql`
        INSERT INTO goodhive.users (
          okto_wallet_address,
          email,
          login_method,
          mentor_status,
          recruiter_status,
          talent_status
        ) VALUES (
          ${okto_wallet_address},
          ${email},
          ${login_method},
          'pending',
          'pending',
          'pending'
        )
        RETURNING *
      `;

      user = newUsers[0];
    }

    // Create session token with 7-day expiration
    const token = await new SignJWT({
      user_id: user.userid,
      wallet_address: user.okto_wallet_address,
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${SEVEN_DAYS_IN_SECONDS}s`)
      .sign(JWT_SECRET);

    // Set session cookie with secure config
    cookies().set("session_token", token, secureHttpOnlyCookieConfig);

    // Set user cookies for frontend access with client-accessible config
    cookies().set("user_id", user.userid, clientAccessibleCookieConfig);

    if (user.email) {
      cookies().set("user_email", user.email, clientAccessibleCookieConfig);
    }

    cookies().set(
      "user_address",
      user.wallet_address,
      clientAccessibleCookieConfig,
    );

    return NextResponse.json({
      exists: true,
      isNewUser: false,
      needsEmailSetup: !user.email,
      user: {
        user_id: user.userid,
        email: user.email,
        wallet_address: user.wallet_address,
      },
    });
  } catch (error) {
    console.error("Error in verify-wallet:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
