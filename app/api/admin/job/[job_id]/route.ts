import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAdminAuth } from "@/app/lib/admin-auth";

export async function GET(
  request: Request,
  { params }: { params: { job_id: string } },
) {
  try {
    const { job_id } = params;
    const jobs = await sql`
      SELECT * FROM goodhive.job_offers WHERE id = ${job_id}
    `;

    if (jobs.length === 0) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(jobs[0], { status: 200 });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { message: "Error fetching job" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { job_id: string } },
) {
  try {
    const { job_id } = params;
    const body = await request.json();
    const {
      title,
      description,
      type_engagement,
      job_type,
      project_type,
      duration,
      skills,
      budget,
      chain,
      currency,
      published,
      image_url,
    } = body;

    const updatedJob = await sql`
      UPDATE goodhive.job_offers
      SET
        title = ${title},
        description = ${description},
        type_engagement = ${type_engagement},
        job_type = ${job_type},
        project_type = ${project_type},
        duration = ${duration},
        skills = ${skills},
        budget = ${budget},
        chain = ${chain},
        currency = ${currency},
        published = ${published},
        image_url = ${image_url}
      WHERE id = ${job_id}
      RETURNING *
    `;

    if (updatedJob.length === 0) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(updatedJob[0], { status: 200 });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { message: "Error updating job" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { job_id: string } }
) {
  try {
    // Verify admin token
    const authError = requireAdminAuth(request);
    if (authError) return authError;

    const { job_id } = params;

    if (!job_id) {
      return NextResponse.json(
        { message: "Job ID is required" },
        { status: 400 }
      );
    }

    // Delete job sections if they exist
    await sql`DELETE FROM goodhive.job_sections WHERE job_id = ${job_id}`;

    // Delete job
    const result = await sql`
      DELETE FROM goodhive.job_offers WHERE id = ${job_id} RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { message: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Job deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting job:", error);

    return NextResponse.json(
      {
        message: "Failed to delete job",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
