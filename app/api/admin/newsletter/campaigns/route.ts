export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import sql from "@/lib/db";
import { getAdminJWTSecret, isAdminAuthError } from "@/app/lib/admin-auth";
import { newsletterCampaignSchema, validateInput } from "@/app/lib/admin-validations";
import {
  resolveRecipientsByFilter,
  resolveRecipientsByIds,
  type RecipientRow,
} from "@/lib/newsletter/recipients";
import { sendNewsletterBatch } from "@/lib/email/newsletter";

const verifyAdminToken = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) throw new Error("No token provided");
  const decoded = verify(token, getAdminJWTSecret()) as { role: string; email: string };
  if (decoded.role !== "admin") throw new Error("Not authorized");
  return decoded;
};

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken();
    const { searchParams } = new URL(req.url);
    const requestedPage = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (requestedPage < 1 || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ message: "Invalid pagination parameters" }),
        { status: 400 },
      );
    }

    const offset = (requestedPage - 1) * limit;

    const countResult = await sql<{ total: string }[]>`
      SELECT COUNT(*) AS total FROM goodhive.newsletter_campaigns
    `;
    const total = parseInt(countResult[0]?.total ?? "0", 10);

    const campaigns = await sql`
      SELECT id, subject, recipient_count, sent_count, failed_count, status, created_by, created_at, completed_at
      FROM goodhive.newsletter_campaigns
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return new Response(
      JSON.stringify({
        data: campaigns,
        pagination: {
          page: requestedPage,
          limit,
          total,
          totalPages: total === 0 ? 1 : Math.ceil(total / limit),
        },
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching newsletter campaigns:", error);
    if (isAdminAuthError(error)) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    }
    return new Response(JSON.stringify({ message: "Failed to fetch campaigns" }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyAdminToken();
    const body = await req.json();

    const validation = validateInput(newsletterCampaignSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ message: "Validation failed", errors: validation.errors }),
        { status: 400 },
      );
    }

    const { subject, bodyHtml, audience } = validation.data;

    let resolved: RecipientRow[];
    if (audience.mode === "ids") {
      resolved = await resolveRecipientsByIds(audience.userIds ?? []);
    } else {
      resolved = await resolveRecipientsByFilter({
        segment: audience.segment,
        approvedOnly: audience.approvedOnly,
        search: audience.search,
      });
      if (audience.excludedIds?.length) {
        const excluded = new Set(audience.excludedIds);
        resolved = resolved.filter((row) => !excluded.has(row.user_id));
      }
    }

    const recipients = resolved.filter(
      (row): row is RecipientRow & { email: string } => Boolean(row.email),
    );

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ message: "No recipients match this audience" }),
        { status: 400 },
      );
    }

    const [campaign] = await sql<{ id: string }[]>`
      INSERT INTO goodhive.newsletter_campaigns (subject, body_html, audience_filter, recipient_count, created_by)
      VALUES (${subject}, ${bodyHtml}, ${sql.json(audience)}, ${recipients.length}, ${decoded.email})
      RETURNING id
    `;

    const results = await sendNewsletterBatch(
      subject,
      bodyHtml,
      recipients.map((row) => ({ user_id: row.user_id, email: row.email })),
    );

    const sentCount = results.filter((result) => result.status === "sent").length;
    const failedCount = results.length - sentCount;

    const recipientRecords = results.map((result) => ({
      campaign_id: campaign.id,
      user_id: result.user_id,
      email: result.email,
      status: result.status,
      error: result.error ?? null,
      sent_at: result.status === "sent" ? new Date() : null,
    }));

    await sql`
      INSERT INTO goodhive.newsletter_recipients ${sql(
        recipientRecords,
        "campaign_id",
        "user_id",
        "email",
        "status",
        "error",
        "sent_at",
      )}
    `;

    const finalStatus = failedCount === results.length ? "failed" : "sent";

    await sql`
      UPDATE goodhive.newsletter_campaigns
      SET sent_count = ${sentCount}, failed_count = ${failedCount}, status = ${finalStatus}, completed_at = now()
      WHERE id = ${campaign.id}
    `;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          campaignId: campaign.id,
          recipientCount: recipients.length,
          sentCount,
          failedCount,
        },
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending newsletter campaign:", error);
    if (isAdminAuthError(error)) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    }
    return new Response(JSON.stringify({ message: "Failed to send newsletter" }), { status: 500 });
  }
}
