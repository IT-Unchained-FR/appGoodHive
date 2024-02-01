import postgres from "postgres";

import type { NextRequest } from "next/server";
import { generateReferralCode } from "@/app/utils/generate-referral-code";

// Force the browser to always fetch the latest data from the server
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParamsEntries = request.nextUrl.searchParams.entries();
  const searchParams = Object.fromEntries(searchParamsEntries);

  // FIXME: use snake_case instead of camelCase
  const { walletAddress } = searchParams;

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  if (!walletAddress) {
    return new Response(
      JSON.stringify({ message: "Missing walletAddress parameter" }),
      {
        status: 404,
      }
    );
  }

  try {
    const user = await sql`
      SELECT *
      FROM goodhive.referrals
      WHERE wallet_address = ${walletAddress}
    `;

    if (user.length === 0) {
      const referralCode = generateReferralCode(6);

      await sql`
        INSERT INTO goodhive.referrals (wallet_address, referral_code)
        VALUES (
          ${walletAddress},
          ${referralCode}
        )
      `;
      return new Response(JSON.stringify({ message: "Referral code created successfully!" }), {
        status: 200,
      });
    } else {
      return new Response(
        JSON.stringify({ message: "Referral code already exists." }),
        {
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error("Error creating referral:", error);

    return new Response(JSON.stringify({ message: "Error retrieving data" }), {
      status: 500,
    });
  }
}
