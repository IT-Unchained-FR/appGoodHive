import { getAdminCompanies } from "@/lib/fetch-admin-companies";
import type { NextRequest } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function GET(req: NextRequest) {
  console.log("Getting Companies");

  try {
    const companies = await getAdminCompanies();
    return new Response(JSON.stringify(companies), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error fetching companies" }),
      {
        status: 500,
      },
    );
  }
}
