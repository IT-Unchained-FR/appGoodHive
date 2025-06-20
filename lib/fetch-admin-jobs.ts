import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function getAdminJobs() {
  try {
    const jobs = await sql`
      SELECT *
      FROM goodhive.job_offers
      ORDER BY created_at DESC
      `;
    return jobs;
  } catch (error) {
    console.log("Error retrieving data:", error);
    throw new Error("Failed to fetch data from the server");
  }
}
