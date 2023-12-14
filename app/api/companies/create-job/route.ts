import postgres from "postgres";

export async function POST(request: Request) {
  const {
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
  } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  try {
    await sql`
      INSERT INTO goodhive.job_offers (
        title,
        type_engagement,
        description,
        duration,
        rate_per_hour,
        budget,
        chain,
        currency,
        skills,
        city,
        country,
        company_name,
        image_url,
        job_type,
        wallet_address
      ) VALUES (
        ${title},
        ${typeEngagement},
        ${description},
        ${duration},
        ${ratePerHour},
        ${budget},
        ${chain},
        ${currency},
        ${skills},
        ${city},
        ${country},
        ${companyName},
        ${imageUrl},
        ${jobType},
        ${walletAddress}
      );
    `;

    return new Response(
      JSON.stringify({ message: "Data inserted successfully" })
    );
  } catch (error) {
    console.error("Error inserting data:", error);

    return new Response(JSON.stringify({ message: "Error inserting data" }), {
      status: 500,
    });
  }
}
