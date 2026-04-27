import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import sql from "@/lib/db";
import {
  getAdminJWTSecret,
  isAdminAuthError,
} from "@/app/lib/admin-auth";
import {
  updateTalentSchema,
  validateInput,
} from "@/app/lib/admin-validations";

export const dynamic = "force-dynamic";

const verifyAdminToken = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    throw new Error("No token provided");
  }

  try {
    const decoded = verify(token, getAdminJWTSecret()) as {
      role: string;
      email?: string;
    };

    if (decoded.role !== "admin") {
      throw new Error("Not authorized");
    }

    return decoded;
  } catch {
    throw new Error("Invalid token");
  }
};

const nullIfBlank = (value: string | null | undefined) => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeRateValue = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const decoded = await verifyAdminToken();
    const { userId } = params;

    if (!userId) {
      return new Response(JSON.stringify({ message: "User ID is required" }), {
        status: 400,
      });
    }

    const body = await request.json();
    const validation = validateInput(updateTalentSchema, body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          message: "Validation failed",
          errors: validation.errors,
        }),
        { status: 400 },
      );
    }

    const validatedBody = validation.data;
    const minRate = normalizeRateValue(validatedBody.min_rate);
    const maxRate = normalizeRateValue(validatedBody.max_rate);
    const fallbackRate =
      minRate !== null ? minRate : maxRate !== null ? maxRate : null;

    const result = await sql`
      UPDATE goodhive.talents
      SET
        first_name = ${nullIfBlank(validatedBody.first_name)},
        last_name = ${nullIfBlank(validatedBody.last_name)},
        email = ${nullIfBlank(validatedBody.email)},
        title = ${nullIfBlank(validatedBody.title)},
        description = ${nullIfBlank(validatedBody.description)},
        country = ${nullIfBlank(validatedBody.country)},
        city = ${nullIfBlank(validatedBody.city)},
        phone_country_code = ${nullIfBlank(validatedBody.phone_country_code)},
        phone_number = ${nullIfBlank(validatedBody.phone_number)},
        about_work = ${nullIfBlank(validatedBody.about_work)},
        min_rate = ${minRate},
        max_rate = ${maxRate},
        rate = ${fallbackRate},
        freelance_only = ${validatedBody.freelance_only ?? false},
        remote_only = ${validatedBody.remote_only ?? false},
        skills = ${nullIfBlank(validatedBody.skills)},
        linkedin = ${nullIfBlank(validatedBody.linkedin)},
        github = ${nullIfBlank(validatedBody.github)},
        twitter = ${nullIfBlank(validatedBody.twitter)},
        stackoverflow = ${nullIfBlank(validatedBody.stackoverflow)},
        portfolio = ${nullIfBlank(validatedBody.portfolio)},
        telegram = ${nullIfBlank(validatedBody.telegram)},
        approved = ${validatedBody.approved ?? false},
        talent = ${validatedBody.talent ?? false},
        mentor = ${validatedBody.mentor ?? false},
        recruiter = ${validatedBody.recruiter ?? false}
      WHERE user_id = ${userId}
    `;

    if (result.count === 0) {
      return new Response(JSON.stringify({ message: "Talent not found" }), {
        status: 404,
      });
    }

    try {
      const adminEmail = decoded.email ?? "unknown";
      sql`
        INSERT INTO goodhive.admin_audit_log (admin_email, action, target_type, target_id, details)
        VALUES (
          ${adminEmail},
          'talent.updated',
          'talent',
          ${userId},
          ${JSON.stringify({ fields: Object.keys(body ?? {}) })}
        )
      `.catch(() => {});
    } catch {}

    return new Response(
      JSON.stringify({ message: "Talent updated successfully" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Update talent error:", error);
    if (isAdminAuthError(error)) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ message: "Error updating talent" }), {
      status: 500,
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authError = requireAdminAuthCompat(req);
    if (authError) return authError;
    const body = await req.text();
    if (!body) {
      return new Response(
        JSON.stringify({ message: "Request body is empty" }),
        {
          status: 400,
        },
      );
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      return new Response(JSON.stringify({ message: "Invalid JSON format" }), {
        status: 400,
      });
    }

    const { userId } = parsedBody;

    if (!userId) {
      return new Response(JSON.stringify({ message: "User ID is required" }), {
        status: 400,
      });
    }

    const result = await sql`
      DELETE FROM goodhive.talents
      WHERE user_id = ${userId}
    `;

    if (result.count === 0) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "User deleted successfully" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting talent:", error);
    if (isAdminAuthError(error)) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ message: "Error deleting user" }), {
      status: 500,
    });
  }
}

async function requireAdminAuthCompat(req: NextRequest) {
  try {
    await verifyAdminToken();
    return undefined;
  } catch (error) {
    if (isAdminAuthError(error)) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    throw error;
  }
}
