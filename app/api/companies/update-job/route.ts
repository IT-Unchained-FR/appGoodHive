import sql from "@/lib/db";

export async function POST(request: Request) {
  const {
    id,
    title,
    typeEngagement,
    description,
    duration,
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
    in_saving_stage,
  } = await request.json();

  console.log(in_saving_stage, "in_saving_stage....");

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
            wallet_address = ${walletAddress},
            in_saving_stage = ${in_saving_stage}
        WHERE id = ${id}
        `;

    return new Response(
      JSON.stringify({ message: "Job updated successfully" }),
    );
  } catch (error) {
    console.error("Error inserting data::", error);

    return new Response(JSON.stringify({ message: "Error inserting data" }), {
      status: 500,
    });
  }
}
