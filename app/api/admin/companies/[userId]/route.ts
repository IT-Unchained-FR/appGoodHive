import { NextRequest } from "next/server";
import sql from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";
import { updateCompanySchema, validateInput } from "@/app/lib/admin-validations";

export const dynamic = "force-dynamic";

const verifyAdminToken = async () => {
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

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    await verifyAdminToken();
    const { userId } = params;

    if (!userId) {
      return new Response(JSON.stringify({ message: "User ID is required" }), {
        status: 400,
      });
    }

    const company = await sql`
      SELECT * FROM goodhive.companies WHERE user_id = ${userId}
    `;

    if (company.length === 0) {
      return new Response(JSON.stringify({ message: "Company not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(company[0]), { status: 200 });
  } catch (error) {
    console.error("Get company error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ message: "Error fetching company" }), {
      status: 500,
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    await verifyAdminToken();
    const { userId } = params;

    if (!userId) {
      return new Response(JSON.stringify({ message: "User ID is required" }), {
        status: 400,
      });
    }

    const body = await request.json();

    // Validate input
    const validation = validateInput(updateCompanySchema, body);
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

    const validatedBody = validation.data;

    await sql`
      UPDATE goodhive.companies
      SET
        designation = ${validatedBody.designation || null},
        headline = ${validatedBody.headline || null},
        email = ${validatedBody.email || null},
        phone_country_code = ${validatedBody.phone_country_code || null},
        phone_number = ${validatedBody.phone_number || null},
        address = ${validatedBody.address || null},
        city = ${validatedBody.city || null},
        country = ${validatedBody.country || null},
        linkedin = ${validatedBody.linkedin || null},
        twitter = ${validatedBody.twitter || null},
        github = ${validatedBody.github || null},
        telegram = ${validatedBody.telegram || null},
        approved = ${validatedBody.approved || false},
        published = ${validatedBody.published !== undefined ? validatedBody.published : (validatedBody.approved || false)}
      WHERE user_id = ${userId}
    `;

    return new Response(
      JSON.stringify({ message: "Company updated successfully" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Update company error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ message: "Error updating company" }), {
      status: 500,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    await verifyAdminToken();
    const { userId } = params;

    if (!userId) {
      return new Response(JSON.stringify({ message: "User ID is required" }), {
        status: 400,
      });
    }

    const result = await sql`
      DELETE FROM goodhive.companies
      WHERE user_id = ${userId}
    `;

    if (result.count === 0) {
      return new Response(JSON.stringify({ message: "Company not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "Company deleted successfully" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete company error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ message: "Error deleting company" }), {
      status: 500,
    });
  }
}
