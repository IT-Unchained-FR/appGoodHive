export const revalidate = 0;

import type { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getAdminJWTSecret, isAdminAuthError } from "@/app/lib/admin-auth";
import { queryRecipients, type NewsletterSegment } from "@/lib/newsletter/recipients";

const verifyAdminToken = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) throw new Error("No token provided");
  const decoded = verify(token, getAdminJWTSecret()) as { role: string };
  if (decoded.role !== "admin") throw new Error("Not authorized");
  return decoded;
};

const VALID_SEGMENTS: NewsletterSegment[] = ["all", "talent", "company", "both", "code_of_hive"];

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken();
    const { searchParams } = new URL(req.url);

    const segmentParam = searchParams.get("segment") || "all";
    const segment = (VALID_SEGMENTS as string[]).includes(segmentParam)
      ? (segmentParam as NewsletterSegment)
      : "all";
    const approvedOnly = searchParams.get("approvedOnly") === "true";
    const search = searchParams.get("search")?.trim() || "";

    const requestedPage = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    if (requestedPage < 1 || limit < 1 || limit > 200) {
      return new Response(
        JSON.stringify({ message: "Invalid pagination parameters" }),
        { status: 400 },
      );
    }

    const offset = (requestedPage - 1) * limit;
    const { rows, total } = await queryRecipients(
      { segment, approvedOnly, search },
      limit,
      offset,
    );
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

    return new Response(
      JSON.stringify({
        data: rows,
        pagination: {
          page: requestedPage,
          limit,
          total,
          totalPages,
        },
      }),
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Content-Type": "application/json",
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error fetching newsletter recipients:", error);
    if (isAdminAuthError(error)) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    }
    return new Response(
      JSON.stringify({ message: "Failed to fetch recipients" }),
      { status: 500 },
    );
  }
}
