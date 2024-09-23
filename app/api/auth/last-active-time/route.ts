import postgres from "postgres";
import moment from "moment";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(req: Request) {
  if (req.method === "POST") {
    const { walletAddress, email } = await req.json();

    if (!walletAddress && !email) {
      return new Response(
        JSON.stringify({ message: "Wallet Address or Email is required" }),
        {
          status: 400,
        }
      );
    }

    try {
      const currentTime = new Date().toISOString(); // Get current time in ISO format (UTC)
      console.log(currentTime, "currentTime...");

      if (walletAddress && email) {
        await sql`
          UPDATE goodhive.users
          SET last_active = ${currentTime}
          WHERE users.wallet_address = ${walletAddress}
          AND users.email = ${email}
        `;
      } else if (walletAddress) {
        await sql`
          UPDATE goodhive.users
          SET last_active = ${currentTime}
          WHERE users.wallet_address = ${walletAddress}
        `;
      } else if (email) {
        await sql`
          UPDATE goodhive.users
          SET last_active = ${currentTime}
          WHERE users.email = ${email}
        `;
      }

      return new Response(
        JSON.stringify({
          message: `Last active time set successfully.`,
        }),
        {
          status: 200,
        }
      );
    } catch (error) {
      console.log(error, "Error From The API...");
      return new Response(
        JSON.stringify({ message: "There was an error setting active time." }),
        {
          status: 500,
        }
      );
    }
  } else {
    return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
      status: 405,
    });
  }
}
