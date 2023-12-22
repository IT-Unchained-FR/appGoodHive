import postgres from "postgres";

export async function POST(request: Request) {
  const {
    id,
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

  if (!id) {
    return new Response(JSON.stringify({ message: "Job id not found" }), {
      status: 400,
    });
  }

  try {
    await sql`
        UPDATE goodhive.job_offers
        SET
            title = ${title},
            type_engagement = ${typeEngagement},
            description = ${description},
            duration = ${duration},
            rate_per_hour = ${ratePerHour},
            budget = ${budget},
            chain = ${chain},
            currency = ${currency},
            skills = ${skills},
            city = ${city},
            country = ${country},
            company_name = ${companyName},
            image_url = ${imageUrl},
            job_type = ${jobType},
            project_type = ${projectType},
            talent = ${talent},
            recruiter = ${recruiter},
            mentor = ${mentor},
            wallet_address = ${walletAddress}
        WHERE id = ${id}
        `;

    return new Response(
      JSON.stringify({ message: "Job updated successfully" })
    );
  } catch (error) {
    console.error("Error inserting data:", error);

    return new Response(JSON.stringify({ message: "Error inserting data" }), {
      status: 500,
    });
  }
}
