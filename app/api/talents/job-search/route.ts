import sql from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

// Force the browser to always fetch the latest data from the server
export const revalidate = 0;
export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`job-search:${ip}`, { windowMs: 60_000, max: 60 });
  if (!allowed) {
    return new Response(JSON.stringify({ message: "Too many requests" }), { status: 429 });
  }

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

    return new Response(JSON.stringify(formattedJobs));
  } catch (error) {
    console.error("Error fetching job offers:", error);

    return new Response(
      JSON.stringify({ message: "Error fetching job offers" }),
      {
        status: 500,
      }
    );
  }
}
