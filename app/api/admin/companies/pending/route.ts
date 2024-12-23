import {} from "@/lib/fetch-company-data";
import { getPendingCompanies } from "@/lib/fetch-pending-company";
import { getPendingTalents } from "@/lib/fetch-talent-data";
import type { NextRequest } from "next/server";

import postgres from "postgres";

export async function GET(req: NextRequest) {
  try {
    const pending_companies = await getPendingCompanies();
    return new Response(JSON.stringify(pending_companies), { status: 200 });
  } catch (error) {
    console.log(error, "error..");
    return new Response(
      JSON.stringify({ message: "Error fetching company data" }),
      {
        status: 500,
      },
    );
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  try {
    await sql`
      UPDATE goodhive.companies
      SET approved = true, inReview = false
      WHERE user_id = ${userId}
      `;

    await sql`
      UPDATE goodhive.users
      SET recruiter_status = 'approved'
      WHERE userid = ${userId}
      `;

    return new Response(
      JSON.stringify({ message: "Approved company successfully" }),
    );
  } catch (error) {
    console.log(error, "error..");
    return new Response(
      JSON.stringify({ message: "Unable to approve the company" }),
      {
        status: 500,
      },
    );
  }
}
