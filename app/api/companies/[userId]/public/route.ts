import { NextRequest } from "next/server";
import sql from "@/lib/db";
import { readViewerAccess } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/** Non-identifying fields any visitor may see about a published company. */
const PUBLIC_COMPANY_FIELDS = [
  "user_id",
  "approved",
  "published",
  "country",
  "city",
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return new Response(JSON.stringify({ message: "User ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Fetch company only if published
    const company = await sql`
      SELECT *
      FROM goodhive.companies
      WHERE user_id = ${userId} AND published = true
    `;

    if (company.length === 0) {
      return new Response(
        JSON.stringify({ message: "Company not found" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // `SELECT *` here previously handed out the company's email, phone number,
    // street address, and wallet address to anonymous callers. Redact unless
    // the viewer is entitled or is the company itself.
    const access = await readViewerAccess();
    const record = company[0] as Record<string, unknown>;
    const canViewIdentity =
      access.canViewConfidentialInfo || access.userId === record.user_id;

    const payload = canViewIdentity
      ? record
      : {
          ...Object.fromEntries(
            PUBLIC_COMPANY_FIELDS.map((field) => [field, record[field] ?? null]),
          ),
          locked: true,
        };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Varies by viewer entitlement — must never land in a shared cache.
        "Cache-Control": "private, no-store",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    console.error("Get public company error:", error);
    return new Response(
      JSON.stringify({ message: "Error fetching company" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
