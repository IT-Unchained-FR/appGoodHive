import postgres from "postgres";

export async function POST(request: Request) {
  const {
    userId,
    title,
    typeEngagement,
    description,
    duration,
    ratePerHour,
    budget,
    skills,
    chain,
    currency,
    walletAddress,
    city,
    country,
    imageUrl,
    jobType,
    companyName,
    projectType,
    talent,
    recruiter,
    mentor,
  } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  try {
    const postedAt = new Date().toISOString();

    await sql`
      INSERT INTO goodhive.job_offers (
        user_id,
        title,
        type_engagement,
        description,
        duration,
        budget,
        chain,
        currency,
        skills,
        city,
        country,
        company_name,
        image_url,
        job_type,
        project_type,
        talent,
        recruiter,
        mentor,
        wallet_address,
        posted_at
      ) VALUES (
        ${userId},
        ${title},
        ${typeEngagement},
        ${description},
        ${duration},
        ${budget},
        ${chain},
        ${currency},
        ${skills},
        ${city},
        ${country},
        ${companyName},
        ${imageUrl},
        ${jobType},
        ${projectType},
        ${talent},
        ${recruiter},
        ${mentor},
        ${walletAddress},
        ${postedAt}
      );
    `;

    // now get the saved job id and return that
    const latestJob = await sql`
      SELECT id
      FROM goodhive.job_offers
      WHERE user_id = ${userId}
      ORDER BY posted_at DESC
      LIMIT 1
    `;

    const jobId = latestJob[0]?.id;

    return new Response(JSON.stringify({ jobId }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error inserting data:", error);

    return new Response(JSON.stringify({ message: "Error inserting data" }), {
      status: 500,
    });
  }
}
