import type { NextRequest } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function GET(req: NextRequest) {
  try {
    const users = await sql`
      SELECT *
      FROM goodhive.users
      `;

    return new Response(
      JSON.stringify({
        message: "Successfully Retrived All Users.",
        users,
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(JSON.stringify({ message: "Error Fetching Users" }), {
      status: 500,
    });
  }
}
