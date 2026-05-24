/**
 * Shared auth helper — checks whether a user_id belongs to an approved recruiter
 * OR an approved (published) company. Used by the recruiting-hub API routes so
 * companies can access the same search/stats/watchlist endpoints as recruiters.
 */
import sql from "@/lib/db";

export async function isApprovedRecruiterOrCompany(userId: string): Promise<boolean> {
  // Approved recruiter check
  const recruiterRows = await sql`
    SELECT userid FROM goodhive.users
    WHERE userid = ${userId}::uuid AND recruiter_status = 'approved'
    LIMIT 1
  `;
  if (recruiterRows.length > 0) return true;

  // Approved (published) company check
  const companyRows = await sql`
    SELECT user_id FROM goodhive.companies
    WHERE user_id = ${userId}::uuid AND published = true
    LIMIT 1
  `;
  return companyRows.length > 0;
}
