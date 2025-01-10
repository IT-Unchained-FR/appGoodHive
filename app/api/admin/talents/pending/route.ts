import { getPendingTalents } from "@/lib/fetch-talent-data";
import type { NextRequest } from "next/server";

import postgres from "postgres";

export async function GET(req: NextRequest) {
  console.log("Getting Talents");
  try {
    const pending_users = await getPendingTalents();
    console.log(pending_users, "pending talents");
    console.log(pending_users.length, "pending talents");
    return new Response(JSON.stringify(pending_users), { status: 200 });
  } catch (error) {
    console.log(error, "error..");
    return new Response(
      JSON.stringify({ message: "Error fetching users data" }),
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
      UPDATE goodhive.talents
      SET approved = true, talent = true, inReview = false
      WHERE user_id = ${userId}
      `;

    await sql`
      UPDATE goodhive.users
      SET talent_status = 'approved'
      WHERE userid = ${userId}
      `;

    return new Response(
      JSON.stringify({ message: "Approved talent successfully" }),
    );
  } catch (error) {
    console.log(error, "error..");
    return new Response(
      JSON.stringify({ message: "Unable to approve the talent" }),
      {
        status: 500,
      },
    );
  }
}
