import { NextRequest } from "next/server";
import sql from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getAdminJWTSecret, isAdminAuthError } from "@/app/lib/admin-auth";
import { updateCompanySchema, validateInput } from "@/app/lib/admin-validations";
import { resolveJobReviewStatus, type JobReviewStatus } from "@/lib/jobs/review";

export const dynamic = "force-dynamic";

type CompanyRow = {
  address: string | null;
  approved: boolean | null;
  city: string | null;
  country: string | null;
  created_at: string | null;
  designation: string | null;
  email: string | null;
  github: string | null;
  headline: string | null;
  image_url: string | null;
  inreview: boolean | null;
  linkedin: string | null;
  phone_country_code: string | null;
  phone_number: string | null;
  portfolio: string | null;
  published: boolean | null;
  stackoverflow: string | null;
  status: string | null;
  telegram: string | null;
  twitter: string | null;
  user_id: string;
  wallet_address: string | null;
};

type RecentJobRow = {
  id: string;
  title: string | null;
  review_status: string | null;
  published: boolean | null;
  created_at: string | null;
};

const COMPLETENESS_FIELDS = [
  "image_url",
  "designation",
  "headline",
  "email",
  "phone_number",
  "address",
  "city",
  "country",
  "wallet_address",
] as const;

const getProfileCompleteness = (company: CompanyRow) => {
  const presentCount = COMPLETENESS_FIELDS.filter((field) => {
    const value = company[field];
    return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
  }).length;

  return Math.round((presentCount / COMPLETENESS_FIELDS.length) * 100);
};

const getLinkCount = (company: CompanyRow) =>
  [
    company.linkedin,
    company.github,
    company.twitter,
    company.stackoverflow,
    company.portfolio,
    company.telegram,
  ].filter((value) => Boolean(value && value.trim().length > 0)).length;

const createEmptyJobSummary = () => ({
  total: 0,
  published: 0,
  pendingReview: 0,
  approved: 0,
  active: 0,
  rejected: 0,
  closed: 0,
  draft: 0,
});

const buildJobSummary = (jobs: RecentJobRow[]) => {
  const summary = createEmptyJobSummary();

  for (const job of jobs) {
    const resolvedStatus = resolveJobReviewStatus(
      job.review_status,
      job.published,
    ) as JobReviewStatus;

    summary.total += 1;
    if (job.published) {
      summary.published += 1;
    }

    switch (resolvedStatus) {
      case "pending_review":
        summary.pendingReview += 1;
        break;
      case "approved":
        summary.approved += 1;
        break;
      case "active":
        summary.active += 1;
        break;
      case "rejected":
        summary.rejected += 1;
        break;
      case "closed":
        summary.closed += 1;
        break;
      case "draft":
      default:
        summary.draft += 1;
        break;
    }
  }

  return summary;
};

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

    const company = await sql<CompanyRow[]>`
      SELECT * FROM goodhive.companies WHERE user_id = ${userId}
    `;

    if (company.length === 0) {
      return new Response(JSON.stringify({ message: "Company not found" }), {
        status: 404,
      });
    }

    const companyRow = company[0];

    const jobRows = await sql<RecentJobRow[]>`
      SELECT
        jo.id,
        jo.title,
        jo.review_status,
        COALESCE(jo.published, false) AS published,
        jo.created_at
      FROM goodhive.job_offers jo
      WHERE jo.user_id = ${userId}::uuid
      ORDER BY COALESCE(jo.created_at, NOW()) DESC
    `;

    const adminMeta = {
      profileCompleteness: getProfileCompleteness(companyRow),
      linkCounts: getLinkCount(companyRow),
      jobSummary: buildJobSummary(jobRows),
      recentJobs: jobRows.slice(0, 5).map((job) => ({
        id: job.id,
        title: job.title?.trim() || "Untitled job",
        review_status: resolveJobReviewStatus(job.review_status, job.published),
        published: Boolean(job.published),
        created_at: job.created_at,
      })),
    };

    return new Response(
      JSON.stringify({
        company: companyRow,
        adminMeta,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Get company error:", error);
    if (isAdminAuthError(error)) {
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
    const decoded = await verifyAdminToken();
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

    try {
      const adminEmail = (decoded as { email?: string }).email ?? "unknown";
      sql`
        INSERT INTO goodhive.admin_audit_log (admin_email, action, target_type, target_id, details)
        VALUES (
          ${adminEmail},
          'company.updated',
          'company',
          ${userId},
          ${JSON.stringify({ fields: Object.keys(body ?? {}) })}
        )
      `.catch(() => {});
    } catch {}

    return new Response(
      JSON.stringify({ message: "Company updated successfully" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Update company error:", error);
    if (isAdminAuthError(error)) {
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
    if (isAdminAuthError(error)) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ message: "Error deleting company" }), {
      status: 500,
    });
  }
}
