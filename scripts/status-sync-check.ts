import sql from "@/lib/db";

async function run() {
  const talentStatusMismatch = await sql`
    SELECT COUNT(*)::int AS count
    FROM goodhive.talents t
    JOIN goodhive.users u ON u.userid = t.user_id
    WHERE (t.approved = true AND u.talent_status IS DISTINCT FROM 'approved')
       OR (t.inreview = true AND u.talent_status NOT IN ('pending', 'in_review'))
       OR (t.approved = false AND t.inreview = false AND u.talent_status = 'approved')
  `;

  const recruiterStatusMismatch = await sql`
    SELECT COUNT(*)::int AS count
    FROM goodhive.companies c
    JOIN goodhive.users u ON u.userid = c.user_id
    WHERE (c.approved = true AND u.recruiter_status IS DISTINCT FROM 'approved')
       OR (c.inreview = true AND u.recruiter_status NOT IN ('pending', 'in_review'))
       OR (c.approved = false AND c.inreview = false AND u.recruiter_status = 'approved')
  `;

  console.log("Talent status mismatches:", talentStatusMismatch[0]?.count ?? 0);
  console.log("Company status mismatches:", recruiterStatusMismatch[0]?.count ?? 0);
}

run().catch((error) => {
  console.error("Status sync check failed:", error);
  process.exit(1);
});
