import postgres from "postgres";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(req: Request) {
  if (req.method === "POST") {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and Password are required" },
        { status: 400 },
      );
    }

    try {
      // Fetch the user from the database
      const users = await sql`
        SELECT * FROM goodhive.users
        WHERE email = ${email}
      `;

      if (users.length === 0) {
        return NextResponse.json(
          { message: "Invalid email or password" },
          { status: 401 },
        );
      }

      const user = users[0];

      // Compare the provided password with the stored hashed password
      const isPasswordValid = await bcrypt.compare(password, user.passwordhash);

      if (!isPasswordValid) {
        return NextResponse.json(
          { message: "Invalid email or password" },
          { status: 401 },
        );
      }

      // Return data in a format compatible with NextAuth
      return NextResponse.json({
        user: {
          userid: user.userid,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          // Add any other user fields you want to include
        },
        message: "Login Successful",
      });
    } catch (error) {
      console.log(error, "Error From The API...");
      return NextResponse.json(
        { message: "There was an error logging in" },
        { status: 500 },
      );
    }
  } else {
    return NextResponse.json(
      { message: "Method Not Allowed" },
      { status: 405 },
    );
  }
}
