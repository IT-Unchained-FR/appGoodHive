import type { NextRequest } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function GET(req: NextRequest) {
  try {
    const talents = await sql`
      SELECT 
        t.*,
        COALESCE(u.wallet_address, null) AS wallet_address
      FROM goodhive.talents t
      LEFT JOIN goodhive.users u ON t.user_id = u.userid
    `;

    console.log(`Retrieved ${talents.length} talents`);
    return new Response(
      JSON.stringify({
        message: "Successfully Retrieved All Talents.",
        talents,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.log(error, "error..");
    return new Response(JSON.stringify({ message: "Error fetching talents" }), {
      status: 500,
    });
  }
}
