import sql from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getAdminJWTSecret, isAdminAuthError } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

const verifyAdminToken = async (req: NextRequest) => {
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

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken(req);

    const url = new URL(req.url);
    const targetType = url.searchParams.get("targetType");
    const targetId = url.searchParams.get("targetId");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    if (!targetType || !targetId) {
      return new Response(
        JSON.stringify({ message: "targetType and targetId are required" }),
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, admin_email, action, target_type, target_id, details, created_at
      FROM goodhive.admin_audit_log
      WHERE target_type = ${targetType}
        AND target_id = ${targetId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return new Response(
      JSON.stringify({
        history: rows,
        message: "Action history retrieved successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching action history:", error);
    if (isAdminAuthError(error)) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(
      JSON.stringify({ message: "Error fetching action history" }),
      { status: 500 }
    );
  }
}
