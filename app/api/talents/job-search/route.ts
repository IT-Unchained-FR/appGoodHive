import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function GET(request: Request) {
  {
    try {
      const jobs = await sql`SELECT * FROM goodhive.job_offers`;
      const formattedJobs = jobs.map((item) => ({
        title: item.title,
        typeEngagement: item.type_engagement,
        jobDescription: item.description,
        duration: item.duration,
        rate: item.rate_per_hour,
        budget: item.budget,
        skills: item.skills.split(","),
      }));
      return new Response(JSON.stringify(formattedJobs)); //
    } catch (error) {
      console.error("Error fetching data:", error);
      return new Response(JSON.stringify({ message: "Error fetching data" }), {
        status: 500,
      });
    }
  }
}
