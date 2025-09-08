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
    const { walletAddress, email, isThirdwebWallet, walletType } = await req.json();

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
    let hasDuplicates = false;
    let duplicateAccounts = [];
    let extractedEmail = email;

    // If it's a Thirdweb in-app wallet, try to extract email from Thirdweb API
    if (isThirdwebWallet && !extractedEmail) {
      try {
        const thirdwebResponse = await fetch(`${req.url.split('/api')[0]}/api/auth/thirdweb-user-info?walletAddress=${normalizedAddress}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (thirdwebResponse.ok) {
          const thirdwebData = await thirdwebResponse.json();
          if (thirdwebData.userInfo?.primaryEmail) {
            extractedEmail = thirdwebData.userInfo.primaryEmail;
          }
        }
      } catch (error) {
        console.error("Failed to fetch email from Thirdweb:", error);
      }
    }

    try {
      // Search by appropriate wallet field based on type
      let existingUser = [];
      
      if (isThirdwebWallet) {
        // Search by thirdweb_wallet_address first
        existingUser = await sql`
          SELECT * FROM goodhive.users 
          WHERE LOWER(thirdweb_wallet_address) = ${normalizedAddress}
            AND (is_deleted IS NULL OR is_deleted = FALSE)
        `;
      } else {
        // Search by external wallet_address first
        existingUser = await sql`
          SELECT * FROM goodhive.users 
          WHERE LOWER(wallet_address) = ${normalizedAddress}
            AND (is_deleted IS NULL OR is_deleted = FALSE)
        `;
      }

      // If not found, check merged wallets
      if (existingUser.length === 0) {
        existingUser = await sql`
          SELECT * FROM goodhive.users 
          WHERE ${normalizedAddress} = ANY(
            SELECT LOWER(unnest(merged_wallet_addresses))
            FROM goodhive.users
            WHERE merged_wallet_addresses IS NOT NULL
          )
          AND (is_deleted IS NULL OR is_deleted = FALSE)
        `;
      }

      if (existingUser.length > 0) {
        user = existingUser[0];
        
        // Check for duplicate accounts with same email
        if (extractedEmail) {
          duplicateAccounts = await sql`
            SELECT userid, email, wallet_address, thirdweb_wallet_address, auth_method
            FROM goodhive.users
            WHERE LOWER(email) = ${extractedEmail.toLowerCase()}
            AND userid != ${user.userid}
            AND (is_deleted IS NULL OR is_deleted = FALSE)
          `;
          
          hasDuplicates = duplicateAccounts.length > 0;
        }

        // Update wallet address in correct field if needed
        if (isThirdwebWallet && !user.thirdweb_wallet_address) {
          await sql`
            UPDATE goodhive.users
            SET 
              thirdweb_wallet_address = ${normalizedAddress},
              wallet_type = CASE
                WHEN wallet_address IS NOT NULL THEN 'both'
                ELSE 'in-app'
              END,
              email = COALESCE(email, ${extractedEmail}),
              updated_at = NOW()
            WHERE userid = ${user.userid}
          `;
          
          // Refresh user data
          const updatedUser = await sql`
            SELECT * FROM goodhive.users WHERE userid = ${user.userid}
          `;
          user = updatedUser[0];
        } else if (!isThirdwebWallet && !user.wallet_address) {
          await sql`
            UPDATE goodhive.users
            SET 
              wallet_address = ${normalizedAddress},
              wallet_type = CASE
                WHEN thirdweb_wallet_address IS NOT NULL THEN 'both'
                ELSE 'external'
              END,
              updated_at = NOW()
            WHERE userid = ${user.userid}
          `;
          
          // Refresh user data
          const updatedUser = await sql`
            SELECT * FROM goodhive.users WHERE userid = ${user.userid}
          `;
          user = updatedUser[0];
        }
      } else {
        // Check if email exists in another account
        if (extractedEmail) {
          const emailUser = await sql`
            SELECT * FROM goodhive.users
            WHERE LOWER(email) = ${extractedEmail.toLowerCase()}
            AND (is_deleted IS NULL OR is_deleted = FALSE)
          `;
          
          if (emailUser.length > 0) {
            // Email exists - add wallet to existing account
            user = emailUser[0];
            
            if (isThirdwebWallet) {
              await sql`
                UPDATE goodhive.users
                SET 
                  thirdweb_wallet_address = ${normalizedAddress},
                  wallet_type = CASE
                    WHEN wallet_address IS NOT NULL THEN 'both'
                    ELSE 'in-app'
                  END,
                  auth_method = CASE
                    WHEN wallet_address IS NOT NULL THEN 'hybrid'
                    ELSE 'email'
                  END,
                  updated_at = NOW()
                WHERE userid = ${user.userid}
              `;
            } else {
              await sql`
                UPDATE goodhive.users
                SET 
                  wallet_address = ${normalizedAddress},
                  wallet_type = CASE
                    WHEN thirdweb_wallet_address IS NOT NULL THEN 'both'
                    ELSE 'external'
                  END,
                  auth_method = 'hybrid',
                  updated_at = NOW()
                WHERE userid = ${user.userid}
              `;
            }
          }
        }
        
        // If still no user, create new one
        if (!user) {
          const insertResult = await sql`
            INSERT INTO goodhive.users (
              wallet_address,
              thirdweb_wallet_address,
              wallet_type,
              auth_method,
              email
            ) VALUES (
              ${isThirdwebWallet ? null : normalizedAddress},
              ${isThirdwebWallet ? normalizedAddress : null},
              ${isThirdwebWallet ? 'in-app' : 'external'},
              ${extractedEmail ? 'hybrid' : 'wallet'},
              ${extractedEmail || null}
            )
            RETURNING *
          `;
          
          user = insertResult[0];
          isNewUser = true;
        }
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
        hasDuplicates,
        duplicateAccounts: duplicateAccounts.map(acc => ({
          user_id: acc.userid,
          email: acc.email,
          wallet_address: acc.wallet_address,
          auth_method: acc.auth_method,
        })),
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