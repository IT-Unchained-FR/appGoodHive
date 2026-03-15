import sql from "@/lib/db";

export interface TalentContext {
  profile: {
    name: string;
    skills: string[];
    bio: string;
    title: string;
    yearsExperience: number | null;
    location: string;
    completeness: number;
    walletAddress: string | null;
  };
  applications: Array<{
    jobTitle: string;
    company: string;
    status: string;
    appliedAt: string;
  }>;
  assignments: Array<{
    jobTitle: string;
    company: string;
    status: string;
  }>;
  suggestedJobs: Array<{
    id: string;
    title: string;
    company: string;
    budget: number | null;
    currency: string | null;
    skills: string;
  }>;
}

export async function buildTalentContext(userId: string): Promise<TalentContext> {
  const [talentRows, appRows, assignmentRows, jobRows] = await Promise.all([
    // Profile
    sql<{
      first_name: string | null;
      last_name: string | null;
      skills: string | null;
      about_work: string | null;
      title: string | null;
      description: string | null;
      city: string | null;
      country: string | null;
      wallet_address: string | null;
    }[]>`
      SELECT t.first_name, t.last_name, t.skills, t.about_work, t.title, t.description, t.city, t.country,
        COALESCE(NULLIF(u.thirdweb_wallet_address, ''), NULLIF(u.wallet_address, '')) AS wallet_address
      FROM goodhive.talents t
      LEFT JOIN goodhive.users u ON u.userid = t.user_id
      WHERE t.user_id = ${userId}::uuid
      LIMIT 1
    `,
    // Recent applications
    sql<{ job_title: string | null; company_name: string | null; status: string | null; created_at: string }[]>`
      SELECT
        jo.title AS job_title,
        c.designation AS company_name,
        ja.status,
        ja.created_at
      FROM goodhive.job_applications ja
      LEFT JOIN goodhive.job_offers jo ON jo.id = ja.job_id
      LEFT JOIN goodhive.companies c ON c.user_id = jo.user_id
      WHERE ja.applicant_user_id = ${userId}::uuid
      ORDER BY ja.created_at DESC
      LIMIT 5
    `,
    // Active assignments
    sql<{ job_title: string | null; company_name: string | null; status: string | null }[]>`
      SELECT
        jo.title AS job_title,
        c.designation AS company_name,
        ja.status
      FROM goodhive.job_assignments ja
      LEFT JOIN goodhive.job_offers jo ON jo.id = ja.job_id
      LEFT JOIN goodhive.companies c ON c.user_id = ja.company_user_id
      WHERE ja.talent_user_id = ${userId}::uuid
        AND ja.status IN ('active', 'completion_requested')
      ORDER BY ja.assigned_at DESC
      LIMIT 5
    `,
    // Open approved jobs (random sample for suggestions)
    sql<{ id: string; title: string | null; designation: string | null; budget: number | null; currency: string | null; skills: string | null }[]>`
      SELECT jo.id, jo.title, c.designation, jo.budget, jo.currency, jo.skills
      FROM goodhive.job_offers jo
      LEFT JOIN goodhive.companies c ON c.user_id = jo.user_id
      WHERE jo.review_status = 'approved' AND jo.published = true
      ORDER BY jo.posted_at DESC
      LIMIT 10
    `,
  ]);

  const t = talentRows[0];

  // Compute profile completeness
  const fullName = [t?.first_name, t?.last_name].filter(Boolean).join(" ").trim();
  const fields = [fullName, t?.skills, t?.about_work, t?.title, t?.city];
  const filled = fields.filter(Boolean).length;
  const completeness = Math.round((filled / fields.length) * 100);

  const talentSkills = t?.skills
    ? t.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  return {
    profile: {
      name: fullName || "GoodHive Member",
      skills: talentSkills,
      bio: t?.about_work?.trim() || t?.description?.trim() || "",
      title: t?.title?.trim() || "",
      yearsExperience: null,
      location: [t?.city, t?.country].filter(Boolean).join(", "),
      completeness,
      walletAddress: t?.wallet_address ?? null,
    },
    applications: appRows.map((a) => ({
      jobTitle: a.job_title ?? "Unknown job",
      company: a.company_name ?? "Unknown company",
      status: a.status ?? "pending",
      appliedAt: a.created_at,
    })),
    assignments: assignmentRows.map((a) => ({
      jobTitle: a.job_title ?? "Unknown job",
      company: a.company_name ?? "Unknown company",
      status: a.status ?? "active",
    })),
    suggestedJobs: jobRows.map((j) => ({
      id: j.id,
      title: j.title ?? "Untitled",
      company: j.designation ?? "GoodHive Company",
      budget: j.budget,
      currency: j.currency,
      skills: j.skills ?? "",
    })),
  };
}
