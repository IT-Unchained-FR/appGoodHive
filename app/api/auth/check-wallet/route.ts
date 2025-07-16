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
    const { wallet_address, method } = await req.json();

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



    if (users.length > 0) {
      const user = users[0];

      // Check if user has email or okto_wallet_address
      const hasEmail = user.email && user.email.trim() !== "";
      const hasOktoWallet = user.okto_wallet_address && user.okto_wallet_address.trim() !== "";

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

      // Set user cookies for frontend access
      cookies().set("user_id", user.userid, {
        maxAge: 86400, // 24 hours
        path: "/",
      });

      if (user.email) {
        cookies().set("user_email", user.email, {
          maxAge: 86400, // 24 hours
          path: "/",
        });
      }

      cookies().set("user_address", user.wallet_address, {
        maxAge: 86400, // 24 hours
        path: "/",
      });

      return NextResponse.json({
        exists: true,
        isNewUser: false,
        needsEmailSetup: !hasEmail && !hasOktoWallet,
        user: {
          user_id: user.userid,
          email: user.email,
          wallet_address: user.wallet_address,
        },
      });
    } else {
      // Create new user with wallet address
      try {
        const newUsers = await sql`
          INSERT INTO goodhive.users (
            wallet_address,
            mentor_status,
            recruiter_status,
            talent_status
          ) VALUES (
            ${wallet_address},
            'pending',
            'pending',
            'pending'
          )
          RETURNING *
        `;

        const newUser = newUsers[0];

        // Create session token for new user
        const token = await new SignJWT({
          user_id: newUser.userid,
          wallet_address: newUser.wallet_address,
          email: newUser.email,
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

        // Set user cookies for frontend access
        cookies().set("user_id", newUser.userid, {
          maxAge: 86400, // 24 hours
          path: "/",
        });

        cookies().set("user_address", newUser.wallet_address, {
          maxAge: 86400, // 24 hours
          path: "/",
        });

        return NextResponse.json({
          exists: false,
          isNewUser: true,
          needsEmailSetup: true,
          user: {
            user_id: newUser.userid,
            email: newUser.email,
            wallet_address: newUser.wallet_address,
          },
        });
      } catch (createError) {
        console.error("Error creating new user:", createError);
        return NextResponse.json(
          { message: "Error creating user account" },
          { status: 500 },
        );
      }
    }
  } catch (error) {
    console.error("Error checking wallet:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
