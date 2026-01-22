import type { NextRequest } from "next/server";
import sql from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";

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

type TalentStatus = "approved" | "in_review" | "rejected" | "deferred" | "pending";

export async function POST(req: NextRequest) {
  try {
    await verifyAdminToken();
    const body = await req.json();

    const userId = body?.userId as string | undefined;
    const status = body?.status as TalentStatus | undefined;

    if (!userId || !status) {
      return new Response(
        JSON.stringify({ message: "User ID and status are required" }),
        { status: 400 },
      );
    }

    if (!["approved", "in_review", "rejected", "deferred", "pending"].includes(status)) {
      return new Response(
        JSON.stringify({ message: "Invalid status" }),
        { status: 400 },
      );
    }

    if (status === "approved") {
      await sql`
        UPDATE goodhive.talents
        SET approved = true, talent = true, inreview = false
        WHERE user_id = ${userId}
      `;
      await sql`
        UPDATE goodhive.users
        SET talent_status = 'approved'
        WHERE userid = ${userId}
      `;
    } else if (status === "in_review" || status === "pending") {
      await sql`
        UPDATE goodhive.talents
        SET approved = false, inreview = true
        WHERE user_id = ${userId}
      `;
      await sql`
        UPDATE goodhive.users
        SET talent_status = 'pending'
        WHERE userid = ${userId}
      `;
    } else if (status === "deferred") {
      await sql`
        UPDATE goodhive.talents
        SET approved = false, inreview = false
        WHERE user_id = ${userId}
      `;
      await sql`
        UPDATE goodhive.users
        SET talent_status = 'deferred'
        WHERE userid = ${userId}
      `;
    } else {
      await sql`
        UPDATE goodhive.talents
        SET approved = false, inreview = false
        WHERE user_id = ${userId}
      `;
      await sql`
        UPDATE goodhive.users
        SET talent_status = 'rejected'
        WHERE userid = ${userId}
      `;
    }

    return new Response(
      JSON.stringify({ message: "Talent status updated" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Update talent status error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(
      JSON.stringify({ message: "Error updating talent status" }),
      { status: 500 },
    );
  }
}
