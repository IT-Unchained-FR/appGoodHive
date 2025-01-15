import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(req: Request) {
  if (req.method === "POST") {
    const { wallet_address, referralCode } = await req.json();

    if (!wallet_address) {
      return new Response(
        JSON.stringify({ message: "Wallet Address Is Required" }),
        {
          status: 400,
        },
      );
    }

    try {
      // Fetch the user from the database
      const users = await sql`
        SELECT * FROM goodhive.users
        WHERE wallet_address = ${wallet_address}
      `;

      const user = users[0];

      if (!user) {
        // Create a new user if not found
        let insertQuery;
        if (referralCode) {
          insertQuery = sql`
            INSERT INTO goodhive.users (wallet_address, referred_by)
            VALUES (${wallet_address}, ${referralCode})
            RETURNING *`;
        } else {
          insertQuery = sql`
            INSERT INTO goodhive.users (wallet_address)
            VALUES (${wallet_address})
            RETURNING *`;
        }
        const newUser = await insertQuery;

        return new Response(
          JSON.stringify({
            message: "New User Created",
            email: newUser[0].email,
            user_id: newUser[0].userid,
          }),
          {
            status: 201,
          },
        );
      }

      return new Response(
        JSON.stringify({
          message: "Login Successful",
          email: user.email,
          user_id: user.userid,
        }),
        {
          status: 200,
        },
      );
    } catch (error) {
      console.log(error, "Error From The API...");
      return new Response(
        JSON.stringify({ message: "There was an error logging in" }),
        {
          status: 500,
        },
      );
    }
  } else {
    return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
      status: 405,
    });
  }
}
