import type { NextRequest } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function GET(request: NextRequest) {
  const searchParamsEntries = request.nextUrl.searchParams.entries();
  const searchParams = Object.fromEntries(searchParamsEntries);

  const { userId } = searchParams;

  if (!userId) {
    return new Response(
      JSON.stringify({ message: "Missing userId parameter" }),
      {
        status: 400,
      },
    );
  }

  try {
    const jobsQuery = await sql`
      SELECT *
      FROM goodhive.job_offers
      WHERE user_id = ${userId}
    `;

    const jobs = jobsQuery.map((item) => ({
      id: item.id,
      title: item.title,
      companyName: item.company_name,
      typeEngagement: item.type_engagement,
      description: item.description,
      duration: item.duration,
      budget: item.budget,
      projectType: item.project_type,
      skills: item.skills.split(","),
      country: item.country,
      city: item.city,
      chain: item.chain,
      jobType: item.job_type,
      image_url: item.image_url,
      walletAddress: item.wallet_address,
      escrowAmount: item.escrow_amount,
      mentor: item.mentor,
      recruiter: item.recruiter,
      postedAt: item.posted_at,
      block_id: item.block_id,
    }));

    return new Response(JSON.stringify(jobs), { status: 200 });
  } catch (error) {
    console.error("Error retrieving jobs:", error);
    return new Response(
      JSON.stringify({ message: "Error retrieving jobs" }),
      {
        status: 500,
      },
    );
  }
} 