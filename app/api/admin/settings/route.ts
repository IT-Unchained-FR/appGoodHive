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

    const rows = await sql<{ key: string; value: unknown }[]>`
      SELECT key, value FROM goodhive.admin_settings
    `;
    const settings = rows.reduce(
      (acc: Record<string, unknown>, row: { key: string; value: unknown }) => ({
        ...acc,
        [row.key]: row.value,
      }),
      {},
    );

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    if (isAdminAuthError(error)) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(
      JSON.stringify({ message: "Error fetching settings" }),
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const decoded = await verifyAdminToken(req);
    const settings = await req.json();
    const adminEmail = (decoded as { email?: string }).email ?? "unknown";

    if (!settings.notifications || !settings.system || !settings.security) {
      return new Response(
        JSON.stringify({ message: "Invalid settings structure" }),
        { status: 400 },
      );
    }

    for (const [key, value] of Object.entries(settings)) {
      await sql`
        INSERT INTO goodhive.admin_settings (key, value, updated_at, updated_by)
        VALUES (${key}, ${JSON.stringify(value)}, NOW(), ${adminEmail})
        ON CONFLICT (key) DO UPDATE
          SET value = ${JSON.stringify(value)},
              updated_at = NOW(),
              updated_by = ${adminEmail}
      `;
    }

    return new Response(
      JSON.stringify({ message: "Settings saved successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error saving settings:", error);
    if (isAdminAuthError(error)) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ message: "Error saving settings" }), {
      status: 500,
    });
  }
}
