import sql from "@/lib/db";

export type CompanyOnboardingStepId =
  | "profile"
  | "approved"
  | "create_job"
  | "job_approved"
  | "publish"
  | "fund"
  | "live";

export interface CompanyOnboardingProgress {
  steps: Record<CompanyOnboardingStepId, boolean>;
  /** Most advanced job, so each step can link straight to it. */
  focusJobId: string | null;
  /** On-chain id of the focus job, used to read its escrow balance. */
  focusBlockchainJobId: number | null;
  /** True while a job is waiting for the GoodHive team. */
  jobPendingReview: boolean;
  /** True while the company profile is waiting for the GoodHive team. */
  profilePendingReview: boolean;
}

// Where a job sits in the journey. Higher = further along.
function jobStage(job: {
  block_id: number | null;
  payment_token_address: string | null;
  review_status: string | null;
}): number {
  // block_id is assigned when a job is created, so it says nothing about the
  // chain. payment_token_address is written only by the blockchain publish.
  const onChain = Boolean(job.payment_token_address);
  if (job.review_status === "active") return 4;
  // Closing unpublishes a job that was live; it still counts as done.
  if (job.review_status === "closed" && onChain) return 4;
  if (onChain) return 3;
  if (job.review_status === "approved" || job.review_status === "closed") return 2;
  if (job.review_status === "pending_review") return 1;
  return 0;
}

export async function getCompanyOnboardingProgress(
  userId: string,
): Promise<CompanyOnboardingProgress> {
  const [companyRows, jobRows] = await Promise.all([
    sql<{ approved: boolean | null; inreview: boolean | null }[]>`
      SELECT approved, inreview
      FROM goodhive.companies
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `,
    sql<{
      block_id: number | null;
      id: string;
      payment_token_address: string | null;
      review_status: string | null;
    }[]>`
      SELECT id, review_status, block_id, payment_token_address
      FROM goodhive.job_offers
      WHERE user_id = ${userId}::uuid
      ORDER BY COALESCE(created_at, posted_at, NOW()) DESC
    `,
  ]);

  const company = companyRows[0];
  const approved = company?.approved === true;
  const profileSubmitted = approved || company?.inreview === true;

  let focusJob: (typeof jobRows)[number] | null = null;
  for (const job of jobRows) {
    if (!focusJob || jobStage(job) > jobStage(focusJob)) focusJob = job;
  }
  const bestStage = focusJob ? jobStage(focusJob) : -1;

  return {
    steps: {
      profile: profileSubmitted,
      approved,
      create_job: jobRows.length > 0,
      job_approved: bestStage >= 2,
      publish: bestStage >= 3,
      // Funding and activation happen in one step of the publish modal and
      // escrow isn't mirrored in the DB, so a live job is the only signal
      // here. The client also reads the on-chain balance for the gap case
      // (funded, activation failed).
      fund: bestStage >= 4,
      live: bestStage >= 4,
    },
    focusJobId: focusJob?.id ?? null,
    // block_id only holds the on-chain id once the job has been published.
    focusBlockchainJobId:
      focusJob?.payment_token_address && focusJob.block_id !== null
        ? Number(focusJob.block_id)
        : null,
    jobPendingReview: bestStage === 1,
    profilePendingReview: !approved && company?.inreview === true,
  };
}
