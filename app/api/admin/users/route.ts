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
      SELECT u.*, 
        t.first_name, 
        t.last_name,
        EXISTS (
          SELECT 1 
          FROM goodhive.talents t 
          WHERE t.user_id = u.userid
        ) as has_talent_profile
      FROM goodhive.users u
      LEFT JOIN goodhive.talents t ON t.user_id = u.userid
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
