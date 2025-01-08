import type { NextRequest } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get("user_id");

  try {
    const company = await sql`
      SELECT * FROM goodhive.companies WHERE user_id = ${user_id}
    `;

    if (company.length === 0) {
      return new Response(JSON.stringify({ message: "Company not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(company[0]), { status: 200 });
  } catch (error) {
    console.log(error, "error..");
    return new Response(JSON.stringify({ message: "Error fetching company" }), {
      status: 500,
    });
  }
}
