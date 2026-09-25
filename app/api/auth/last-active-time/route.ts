import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";

export async function POST(req: Request) {
  try {
    // Always the signed-in user; the body's user_id is ignored.
    const user_id = (await getSessionUser())?.user_id;

    if (!user_id) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const currentTime = new Date().toISOString(); // Get current time in ISO format (UTC)
    console.log(currentTime, "currentTime...");

    await sql`
      UPDATE goodhive.talents
      SET last_active = ${currentTime}
      WHERE user_id = ${user_id}
    `;

    return new Response(
      JSON.stringify({
        message: `Last active time set successfully.`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.log(error, "Error From The API...");
    return new Response(
      JSON.stringify({ message: "There was an error setting active time." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
