import postgres from "postgres";
import { SignJWT } from "jose";
import { JWT_SECRET } from "@/lib/auth/jwtConfig";
import { NextResponse } from "next/server";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(req: Request) {
  try {
    const { walletAddress, email } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Normalize wallet address to lowercase
    const normalizedAddress = walletAddress.toLowerCase();

    let user;
    let isNewUser = false;

    try {
      // First, try to find user by wallet address
      const existingUser = await sql`
        SELECT * FROM goodhive.users 
        WHERE LOWER(wallet_address) = ${normalizedAddress}
      `;

      if (existingUser.length > 0) {
        user = existingUser[0];
      } else {
        // Create new user with wallet address
        const insertResult = await sql`
          INSERT INTO goodhive.users (
            wallet_address,
            auth_method,
            email
          ) VALUES (
            ${normalizedAddress},
            'wallet',
            ${email || null}
          )
          RETURNING *
        `;
        
        user = insertResult[0];
        isNewUser = true;
      }

      // Generate JWT session token
      const token = await new SignJWT({
        user_id: user.userid,
        email: user.email || null,
        wallet_address: user.wallet_address,
        auth_method: user.auth_method || 'wallet',
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d") // 7 days expiry
        .sign(JWT_SECRET);

      // Create response with user data
      const response = NextResponse.json({
        message: isNewUser ? "Account created successfully" : "Login successful",
        user: {
          user_id: user.userid,
          email: user.email,
          wallet_address: user.wallet_address,
          auth_method: user.auth_method,
        },
        isNewUser,
        token,
      });

      // Set secure HTTP-only cookies
      response.cookies.set("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      });

      response.cookies.set("user_id", user.userid.toString(), {
        httpOnly: false, // Allow client access for backward compatibility
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      if (user.email) {
        response.cookies.set("user_email", user.email, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60,
          path: "/",
        });
      }

      response.cookies.set("loggedIn_user", JSON.stringify({
        user_id: user.userid,
        email: user.email,
        wallet_address: user.wallet_address,
        talent: user.talent || false,
        mentor: user.mentor || false,
        recruiter: user.recruiter || false,
        talent_status: user.talent_status || 'pending',
        mentor_status: user.mentor_status || 'pending',
        recruiter_status: user.recruiter_status || 'pending',
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      return response;

    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Database error during authentication" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Thirdweb authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}