import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

// Define the correct params type
type Params = {
  params: {
    address: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function GET(request: NextRequest, context: Params) {
  const { address: walletAddress } = context.params;

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false,
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
