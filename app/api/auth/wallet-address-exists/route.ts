import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
      status: 405,
    });
  }

  try {
    const { wallet_address } = await req.json();
    if (!wallet_address) {
      return new Response(
        JSON.stringify({ message: "Wallet address is required" }),
        { status: 400 },
      );
    }
    const users = await sql`
      SELECT userid FROM goodhive.users WHERE wallet_address = ${wallet_address}
    `;
    if (users.length > 0) {
      return new Response(
        JSON.stringify({ exists: true, user_id: users[0].userid }),
        { status: 200 },
      );
    } else {
      return new Response(JSON.stringify({ exists: false }), { status: 200 });
    }
  } catch (error) {
    console.error("Error checking wallet existence:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
}
