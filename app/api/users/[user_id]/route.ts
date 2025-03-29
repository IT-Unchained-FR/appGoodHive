import { NextRequest } from "next/server";
import postgres from "postgres";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(
  request: NextRequest,
  context: { params: { user_id: string } },
) {
  const session = await getServerSession(authOptions);

  console.log(session, "session");
  console.log(session?.user, "session user");

  if (!session?.user?.email) {
    return NextResponse.json({ error: "No email provided" }, { status: 400 });
  }
  const { user_id } = context.params;

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  if (!user_id) {
    return new Response(
      JSON.stringify({ message: "Missing user_id parameter" }),
      {
        status: 404,
      },
    );
  }

  try {
    const user = await sql`
        SELECT *
        FROM goodhive.users
        WHERE userid = ${user_id}
      `;

    if (user.length === 0) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(user[0]));
  } catch (error) {
    console.error("Error retrieving data:", error);

    return new Response(JSON.stringify({ message: "Error retrieving data" }), {
      status: 500,
    });
  }
}
