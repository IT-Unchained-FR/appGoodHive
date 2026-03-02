import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession } from "@/lib/auth/sessionUtils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireSession();
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter");
    const query = searchParams.get("q")?.trim().toLowerCase() || "";

    const threads = await sql`
      SELECT
        ct.id,
        ct.job_id,
        ct.job_application_id,
        ct.status,
        ct.last_message_at,
        ct.last_message_preview,
        ct.created_at,
        ct.updated_at,
        jo.title AS job_title,
        ja.status AS application_status,
        ja.created_at AS applied_at,
        ct.talent_user_id,
        ja.applicant_name AS talent_name,
        ja.applicant_email AS talent_email,
        t.image_url AS talent_image_url,
        COALESCE(t.title, t.about_work, t.description) AS talent_headline,
        ct.company_user_id,
        COALESCE(c.designation, 'Company') AS company_name,
        c.image_url AS company_image_url,
        c.headline AS company_headline,
        COALESCE((
          SELECT COUNT(*)::int
          FROM goodhive.conversation_messages cm
          WHERE cm.thread_id = ct.id
            AND cm.deleted_at IS NULL
            AND cm.sender_user_id <> ${sessionUser.user_id}::uuid
            AND (
              cp.last_read_at IS NULL
              OR cm.created_at > cp.last_read_at
            )
        ), 0) AS unread_count
      FROM goodhive.conversation_threads ct
      INNER JOIN goodhive.job_applications ja
        ON ja.id = ct.job_application_id
      INNER JOIN goodhive.job_offers jo
        ON jo.id = ct.job_id
      LEFT JOIN goodhive.talents t
        ON t.user_id = ct.talent_user_id
      LEFT JOIN goodhive.companies c
        ON c.user_id = ct.company_user_id
      LEFT JOIN goodhive.conversation_participants cp
        ON cp.thread_id = ct.id
       AND cp.user_id = ${sessionUser.user_id}::uuid
      WHERE ct.talent_user_id = ${sessionUser.user_id}::uuid
      ORDER BY ct.last_message_at DESC
    `;

    let filteredThreads = threads;

    if (filter === "unread") {
      filteredThreads = filteredThreads.filter((thread) => thread.unread_count > 0);
    }

    if (filter === "awaiting_talent") {
      filteredThreads = filteredThreads.filter(
        (thread) => thread.status === "awaiting_talent",
      );
    }

    if (query) {
      filteredThreads = filteredThreads.filter((thread) => {
        const haystack = [
          thread.company_name || "",
          thread.job_title,
          thread.last_message_preview || "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      });
    }

    return NextResponse.json({ threads: filteredThreads }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    console.error("Error fetching talent conversations:", error);
    return NextResponse.json(
      { message: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}
