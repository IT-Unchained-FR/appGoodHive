import postgres from "postgres";
import bcrypt from "bcrypt";
const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(req: Request) {
  if (req.method === "POST") {
    const { wallet_address, email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          message: "Email and Password are required",
          success: false,
        }),
        {
          status: 400,
        },
      );
    }

    try {
      // Check if the email already exists
      const existingUser = await sql`
        SELECT 1 FROM goodhive.users WHERE email = ${email};
      `;

      if (existingUser.count > 0) {
        return new Response(
          JSON.stringify({
            message: "An Account With This Email Already Exists!",
            success: false,
          }),
          {
            status: 409,
          },
        );
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      const updatedUser = await sql`
        UPDATE goodhive.users
        SET email = ${email},
        passwordhash = ${hashedPassword}
        WHERE wallet_address = ${wallet_address}
        RETURNING id, userid, email, talent_status, mentor_status, recruiter_status, wallet_address;
      `;

      return new Response(
        JSON.stringify({
          message: "🔌 Email Connected Successfully",
          user: updatedUser[0],
          success: true,
        }),
        {
          status: 200,
        },
      );
    } catch (error) {
      console.error("Error creating user", error);
      return new Response(
        JSON.stringify({
          message: "There was an error creating your account",
          success: false,
        }),
        {
          status: 500,
        },
      );
    }
  } else {
    return new Response(
      JSON.stringify({ message: "Method Not Allowed", success: false }),
      {
        status: 405,
      },
    );
  }
}
