import sql from "@/lib/db";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";

export async function POST(req: Request) {
  if (req.method === "POST") {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: "Email and password are required" }),
        {
          status: 400,
        },
      );
    }

    try {
      // Fetch the admin from the database
      const admins = await sql`
        SELECT * FROM goodhive.admin
        WHERE email = ${email}
      `;

      if (admins.length === 0) {
        return new Response(
          JSON.stringify({ message: "Invalid email or password" }),
          {
            status: 401,
          },
        );
      }

      const admin = admins[0];

      // Compare the provided password with the stored password
      const isPasswordValid = await bcrypt.compare(password, admin.password);

      if (!isPasswordValid) {
        return new Response(
          JSON.stringify({ message: "Invalid email or password" }),
          {
            status: 401,
          },
        );
      }

      // Generate JWT token
      const token = sign(
        {
          email: admin.email,
          role: "admin",
          adminRole: admin.role,
        },
        getAdminJWTSecret(),
        { expiresIn: "8h" },
      );

      const forwardedProto = req.headers.get("x-forwarded-proto");
      const requestProtocol = (() => {
        try {
          return new URL(req.url).protocol;
        } catch {
          return null;
        }
      })();
      const isHttpsRequest =
        forwardedProto === "https" || requestProtocol === "https:";
      const cookieValue = [
        `admin_token=${token}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=28800",
        isHttpsRequest ? "Secure" : "",
      ]
        .filter(Boolean)
        .join("; ");

      return new Response(
        JSON.stringify({
          message: "Login Successful",
          user: {
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": cookieValue,
          },
        },
      );
    } catch (error) {
      console.error("Error during admin login:", error);
      return new Response(
        JSON.stringify({ message: "There was an error logging in" }),
        {
          status: 500,
        },
      );
    }
  }

  return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
    status: 405,
  });
}
