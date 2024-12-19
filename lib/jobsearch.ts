import postgres from "postgres";

type FetchJobsProps = {
  search?: string;
  location?: string;
  name?: string;
  items: number;
  page: number;
  recruiter?: string;
  mentor?: string;
};

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

function contains(str: string) {
  return "%" + str.toLowerCase() + "%";
}

// Force the browser to always fetch the latest data from the server
/* export const revalidate = 0; */
export async function fetchJobs({
  search = "",
  location = "",
  name = "",
  items = 9,
  page = 1,
  recruiter = "",
  mentor = "",
}: FetchJobsProps) {
  try {
    const countJobs = await sql`
        SELECT COUNT(*)
        FROM goodhive.job_offers
        WHERE
          (LOWER(title) LIKE ${contains(
            search,
          )} OR LOWER(skills) LIKE ${contains(search)})
            AND 
            (LOWER(city) LIKE ${contains(
              location,
            )} OR LOWER(country) LIKE ${contains(location)})
            AND
            (LOWER(company_name) LIKE ${contains(name)})
            ${recruiter === "true" ? sql`AND recruiter = 'true'` : sql``}
            ${mentor === "true" ? sql`AND mentor = 'true'` : sql``}
        `;

    const count = countJobs[0].count as number;

    const limit = Number(items);
    const offset = limit * (Number(page) - 1);

    const jobsQuery = await sql`
      SELECT *
      FROM goodhive.job_offers
      WHERE
      (LOWER(title) LIKE ${contains(search)} OR LOWER(skills) LIKE ${contains(
        search,
      )})
      AND
      (LOWER(city) LIKE ${contains(location)} OR LOWER(country) LIKE ${contains(
        location,
      )})
      AND
      (LOWER(company_name) LIKE ${contains(name)})
      ${recruiter === "true" ? sql`AND recruiter = 'true'` : sql``}
      ${mentor === "true" ? sql`AND mentor = 'true'` : sql``}
      ORDER BY id DESC
      `;

    const jobs = jobsQuery.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      title: item.title,
      companyName: item.company_name,
      typeEngagement: item.type_engagement,
      jobDescription: item.description,
      duration: item.duration,
      budget: item.budget,
      projectType: item.project_type,
      skills: item.skills.split(","),
      country: item.country,
      city: item.city,
      walletAddress: item.wallet_address,
      image_url: item.image_url,
      mentor: item.mentor === "true",
      recruiter: item.recruiter === "true",
      escrowAmount: item.escrow_amount,
      posted_at: item.posted_at,
    }));

    const sortedJobs = jobs.sort(
      (a, b) => Number(b.escrowAmount) - Number(a.escrowAmount),
    );
    const paginatedJobs = sortedJobs.slice(offset, offset + limit);

    return { jobs: paginatedJobs, count };
  } catch (error) {
    console.log("💥", error);
    throw new Error("Failed to fetch data from the server");
  }
}
