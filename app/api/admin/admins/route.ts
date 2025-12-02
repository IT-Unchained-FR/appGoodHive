import sql from "@/lib/db";
import bcrypt from "bcryptjs";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";
import { createAdminSchema, validateInput } from "@/app/lib/admin-validations";

export const dynamic = "force-dynamic";

// Verify admin token middleware
const verifyAdminToken = async (req: NextRequest | Request) => {
  // Check Authorization header first
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = verify(token, getAdminJWTSecret()) as { role: string };
      if (decoded.role === "admin") return decoded;
    } catch (error) {
      // Fall through to cookie check
    }
  }

  // Fallback to cookie check
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    throw new Error("No token provided");
  }

  try {
    const decoded = verify(token, getAdminJWTSecret()) as { role: string };
    if (decoded.role !== "admin") {
      throw new Error("Not authorized");
    }
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

export async function GET(req: Request) {
  try {
    await verifyAdminToken(req);

    const admins = await sql`
      SELECT id, name, email, created_at
      FROM goodhive.admin
      ORDER BY created_at DESC;
    `;

    return new Response(JSON.stringify({ admins }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }
}

export async function POST(req: Request) {
  try {
    await verifyAdminToken(req);

    const body = await req.json();

    // Validate input
    const validation = validateInput(createAdminSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          message: "Validation failed",
          errors: validation.errors,
        }),
        {
          status: 400,
        },
      );
    }

    const { name, email, password } = validation.data;

    // Check if email already exists
    const existingAdmin = await sql`
      SELECT 1 FROM goodhive.admin WHERE email = ${email};
    `;

    if (existingAdmin.length > 0) {
      return new Response(JSON.stringify({ message: "Email already exists" }), {
        status: 409,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin
    await sql`
      INSERT INTO goodhive.admin (
        name,
        email,
        password,
        role
      ) VALUES (
        ${name},
        ${email},
        ${hashedPassword},
        'admin'
      );
    `;

    return new Response(
      JSON.stringify({ message: "Admin created successfully" }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ message: "Error creating admin" }), {
      status: 500,
    });
  }
}
