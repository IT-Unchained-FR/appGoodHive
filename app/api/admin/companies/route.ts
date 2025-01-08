import type { NextRequest } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function GET(req: NextRequest) {
  try {
    const companies = await sql`
      SELECT 
        t.*,
        COALESCE(u.wallet_address, null) AS wallet_address
      FROM goodhive.companies t
      LEFT JOIN goodhive.users u ON t.user_id = u.userid
    `;

    console.log(`Retrieved ${companies.length} companies`);
    return new Response(
      JSON.stringify({
        message: "Successfully Retrieved All companies.",
        companies,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.log(error, "error..");
    return new Response(
      JSON.stringify({ message: "Error fetching companies" }),
      {
        status: 500,
      },
    );
  }
}
