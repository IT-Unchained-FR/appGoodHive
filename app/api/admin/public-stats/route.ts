import sql from "@/lib/db";

export const dynamic = "force-dynamic";

// Public endpoint — no auth required. Returns only aggregate counts for the login page.
export async function GET() {
  try {
    const [talents] = await sql`SELECT COUNT(*) as count FROM goodhive.talents`;
    const [companies] = await sql`SELECT COUNT(*) as count FROM goodhive.companies`;
    const [jobs] = await sql`SELECT COUNT(*) as count FROM goodhive.job_offers`;

    return Response.json({
      talents: Number(talents?.count || 0),
      companies: Number(companies?.count || 0),
      jobs: Number(jobs?.count || 0),
    });
  } catch {
    return Response.json({ talents: null, companies: null, jobs: null }, { status: 500 });
  }
}
