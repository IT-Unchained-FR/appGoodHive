import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(req: Request) {
  if (req.method === "POST") {
    const { walletAddress, userId } = await req.json();

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ success: false, message: "Wallet address required." }),
        {
          status: 400,
        },
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "User ID is required." }),
        {
          status: 400,
        },
      );
    }

    try {
      // Fetch the user from the database
      const users = await sql`
        SELECT * FROM goodhive.users
        WHERE userid = ${userId}
      `;

      if (users.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "No User Found With The Id.",
          }),
          {
            status: 400,
          },
        );
      }

      // Check if user already has a wallet address and it's different from the new one
      if (
        users[0].wallet_address &&
        users[0].wallet_address !== walletAddress
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "User already has a wallet address.",
          }),
          {
            status: 400,
          },
        );
      }

      // If the wallet address is the same as current one, return success without updating
      if (users[0].wallet_address === walletAddress) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Wallet address already connected with account.",
            user: users[0],
          }),
          {
            status: 200,
          },
        );
      }

      // Check if wallet address is already connected to another account
      const existingWalletUser = await sql`
        SELECT * FROM goodhive.users
        WHERE wallet_address = ${walletAddress}
      `;

      if (existingWalletUser.length > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Wallet address is already connected to another account.",
          }),
          {
            status: 400,
          },
        );
      }

      // Update the wallet address for the user
      const updatedUser = await sql`
        UPDATE goodhive.users
        SET wallet_address = ${walletAddress}
        WHERE userid = ${userId}
        RETURNING *
      `;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Wallet address connected with account successfully.",
          user: updatedUser[0],
        }),
        {
          status: 200,
        },
      );
    } catch (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "There was an error updating the wallet address.",
        }),
        {
          status: 500,
        },
      );
    }
  } else {
    return new Response(
      JSON.stringify({ success: false, message: "Method Not Allowed" }),
      {
        status: 405,
      },
    );
  }
}
