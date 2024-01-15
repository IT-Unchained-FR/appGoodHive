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
      jobType: item.job_type,
      image_url: item.image_url,
      projectType: item.project_type,
      talent: item.talent,
      recruiter: item.recruiter,
      mentor: item.mentor,
      escrowAmount: item.escrow_amount,
      walletAddress: item.wallet_address,
    }));

    return new Response(JSON.stringify(singleJob[0]));
  } catch (error) {
    console.error("Error retrieving data:", error);

    return new Response(JSON.stringify({ message: "Error retrieving data" }), {
      status: 500,
    });
  }
}
