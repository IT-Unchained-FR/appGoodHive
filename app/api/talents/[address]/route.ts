import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } },
) {
  const { address: walletAddress } = params;

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  if (!walletAddress) {
    return new NextResponse(
      JSON.stringify({ message: "Missing address parameter" }),
      {
        status: 404,
      },
    );
  }

  try {
    const user = await sql`
        SELECT *
        FROM goodhive.users
        WHERE wallet_address = ${walletAddress}
      `;

    if (user.length === 0) {
      return new NextResponse(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    return new NextResponse(JSON.stringify(user[0]));
  } catch (error) {
    console.error("Error retrieving data:", error);

    return new NextResponse(
      JSON.stringify({ message: "Error retrieving data" }),
      {
        status: 500,
      },
    );
  }
}
