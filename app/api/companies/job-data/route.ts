import postgres from "postgres";

import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParamsEntries = request.nextUrl.searchParams.entries();
  const searchParams = Object.fromEntries(searchParamsEntries);

  const { id } = searchParams;

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  if (!id) {
    return new Response(JSON.stringify({ message: "Missing job id" }), {
      status: 404,
    });
  }

  try {
    const jobsQuery = await sql`
      SELECT *
      FROM goodhive.job_offers
      WHERE id = ${id}
      `;

    if (jobsQuery.length === 0) {
      return new Response(JSON.stringify({ message: "Job not found" }), {
        status: 404,
      });
    }
    const singleJob = jobsQuery.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      title: item.title,
      companyName: item.company_name,
      typeEngagement: item.type_engagement,
      description: item.description,
      duration: item.duration,
      rate: item.rate_per_hour,
      budget: item.budget,
      skills: item.skills.split(","),
      country: item.country,
      city: item.city,
      chain: item.chain,
      currency: item.currency,
      jobType: item.job_type,
      image_url: item.image_url,
      projectType: item.project_type,
      talent: item.talent === "true" || item.talent === true,
      recruiter: item.recruiter === "true" || item.recruiter === true,
      mentor: item.mentor === "true" || item.mentor === true,
      escrowAmount: item.escrow_amount,
      walletAddress: item.wallet_address,
      createdAt: item.posted_at,
      job_id: item.job_id,
      block_id: item.block_id,
      published: item.published,
    }));

    return new Response(JSON.stringify(singleJob[0]));
  } catch (error) {
    console.error("Error retrieving data:", error);

    return new Response(JSON.stringify({ message: "Error retrieving data" }), {
      status: 500,
    });
  }
}
