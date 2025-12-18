import { notFound } from "next/navigation";
import { Metadata } from "next";
import { JobPageHeader } from "@/app/components/job-page/JobPageHeader";
import { JobPageSidebar } from "@/app/components/job-page/JobPageSidebar";
import { JobSectionsDisplay } from "@/app/components/job-sections-display/job-sections-display";
import styles from "./page.module.scss";
import { JobPageAnalytics } from "@/app/components/job-page/JobPageAnalytics";
import sql from "@/lib/db";
import { RelatedJobsSection } from "@/app/components/job-page/RelatedJobsSection";

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  currency: string;
  projectType: string;
  jobType: string;
  typeEngagement?: string;
  duration?: string;
  skills: string[];
  city: string;
  country: string;
  postedAt: string;
  createdAt: string;
  published: boolean;
  blockId?: number;
  blockchainJobId?: number;
  escrowAmount?: number;
  paymentTokenAddress?: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    headline?: string;
    city?: string;
    country?: string;
    email?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
    walletAddress?: string;
  };
  sections: Array<{
    id: string;
    jobId: string;
    heading: string;
    content: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }>;
  relatedJobs: Array<{
    id: string;
    title: string;
    budget: number;
    currency: string;
    projectType: string;
    city: string;
    country: string;
    postedAt: string;
  }>;
  applicationCount: number;
}

async function getJob(jobId: string): Promise<Job | null> {
  try {
    // Fetch job data directly from database
    const jobQuery = await sql`
      SELECT jo.*, c.designation as company_name, c.image_url as company_logo,
             c.headline, c.city as company_city, c.country as company_country,
             c.email as company_email, c.linkedin, c.twitter, c.portfolio,
             c.wallet_address as company_wallet_address
      FROM goodhive.job_offers jo
      LEFT JOIN goodhive.companies c ON jo.user_id = c.user_id
      WHERE jo.id = ${jobId}
    `;

    if (jobQuery.length === 0) {
      return null;
    }

    const jobData = jobQuery[0];

    // Fetch job sections
    const sectionsQuery = await sql`
      SELECT id, heading, content, sort_order, created_at, updated_at
      FROM goodhive.job_sections
      WHERE job_id = ${jobId}
      ORDER BY sort_order ASC
    `;

    // Fetch related jobs from same company (limit 3)
    const relatedJobsQuery = await sql`
      SELECT id, title, budget, currency, project_type, city, country, posted_at
      FROM goodhive.job_offers
      WHERE user_id = ${jobData.user_id} AND id != ${jobId} AND published = true
      ORDER BY posted_at DESC
      LIMIT 3
    `;

    // Fetch application count
    const applicationCountQuery = await sql`
      SELECT COUNT(*) as application_count
      FROM goodhive.job_applications
      WHERE job_id = ${jobId}
    `.catch(() => [{ application_count: 0 }]);

    // Format the response
    const job: Job = {
      // Job details
      id: jobData.id,
      title: jobData.title,
      description: jobData.description,
      budget: jobData.budget,
      currency: jobData.currency,
      projectType: jobData.project_type,
      jobType: jobData.job_type,
      typeEngagement: jobData.type_engagement,
      duration: jobData.duration,
      skills: jobData.skills
        ? jobData.skills.split(",").map((s: string) => s.trim())
        : [],
      city: jobData.city,
      country: jobData.country,
      postedAt: jobData.posted_at,
      createdAt: jobData.posted_at,
      published: jobData.published,

      // Blockchain data
      blockId: jobData.block_id,
      blockchainJobId: jobData.blockchain_job_id,
      escrowAmount: jobData.escrow_amount,
      paymentTokenAddress: jobData.payment_token_address,

      // Company information
      company: {
        id: jobData.user_id,
        name: jobData.company_name || jobData.designation,
        logo: jobData.company_logo,
        headline: jobData.headline,
        city: jobData.company_city,
        country: jobData.company_country,
        email: jobData.company_email,
        linkedin: jobData.linkedin,
        twitter: jobData.twitter,
        website: jobData.portfolio || null,
        walletAddress: jobData.company_wallet_address || null,
      },

      // Job sections
      sections: sectionsQuery.map((section) => ({
        id: section.id.toString(),
        jobId: jobId,
        heading: section.heading,
        content: section.content,
        sortOrder: section.sort_order,
        createdAt: section.created_at,
        updatedAt: section.updated_at,
      })),

      // Related jobs
      relatedJobs: relatedJobsQuery.map((job) => ({
        id: job.id,
        title: job.title,
        budget: job.budget,
        currency: job.currency,
        projectType: job.project_type,
        city: job.city,
        country: job.country,
        postedAt: job.posted_at,
      })),

      // Application stats
      applicationCount: applicationCountQuery[0]?.application_count || 0,
    };

    return job;
  } catch (error) {
    console.error('Error fetching job:', error);
    return null;
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ jobId: string }>
}): Promise<Metadata> {
  const { jobId } = await params;
  const job = await getJob(jobId);

  if (!job) {
    return {
      title: 'Job Not Found | GoodHive',
      description: 'The requested job could not be found.',
    };
  }

  const jobLocation = job.city && job.country ? `${job.city}, ${job.country}` : job.city || job.country || 'Remote';

  // Handle crypto token addresses and map to standard currency codes
  const getCurrencyCode = (currency: string) => {
    if (!currency) return 'USD';
    if (currency === 'USDC' || currency.startsWith('0x')) return 'USD';
    // List of valid currency codes for Intl.NumberFormat
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
    return validCurrencies.includes(currency.toUpperCase()) ? currency.toUpperCase() : 'USD';
  };

  const budgetText = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: getCurrencyCode(job.currency),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(job.budget);

  return {
    title: `${job.title} at ${job.company.name} | GoodHive`,
    description: `${job.title} position at ${job.company.name} in ${jobLocation}. Budget: ${budgetText}. Apply now on GoodHive for Web3 and blockchain opportunities.`,
    keywords: `${job.title}, ${job.company.name}, Web3 jobs, blockchain jobs, ${jobLocation}, ${job.skills.join(', ')}`,
    openGraph: {
      title: `${job.title} at ${job.company.name}`,
      description: `${job.title} position at ${job.company.name} in ${jobLocation}. Budget: ${budgetText}.`,
      type: 'website',
      images: job.company.logo ? [{ url: job.company.logo }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${job.title} at ${job.company.name}`,
      description: `${job.title} position at ${job.company.name} in ${jobLocation}. Budget: ${budgetText}.`,
      images: job.company.logo ? [job.company.logo] : [],
    },
  };
}

export default async function JobPage({
  params
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params;
  const job = await getJob(jobId);

  // In development, allow viewing unpublished jobs for testing
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!job || (!job.published && !isDevelopment)) {
    notFound();
  }

  return (
    <div className={styles.pageContainer}>
      {/* Analytics tracking */}
      <JobPageAnalytics jobId={job.id} jobTitle={job.title} />

      {/* Job Header */}
      <JobPageHeader job={job} />

      {/* Main Content */}
      <div className={styles.contentContainer}>
        <div className={styles.contentGrid}>
          {/* Job Content */}
          <main className={styles.mainContent}>
            {/* Job Sections - Modular Description */}
            {job.sections && job.sections.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Job Description</h2>
                <JobSectionsDisplay
                  sections={job.sections.map(s => ({
                    id: s.id,
                    heading: s.heading,
                    content: s.content,
                    sort_order: s.sortOrder || 0
                  }))}
                  defaultExpanded={false}
                />
              </section>
            )}

            {/* Fallback Job Description - Only show if no sections exist */}
            {job.description && (!job.sections || job.sections.length === 0) && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Job Description</h2>
                <div
                  className={styles.description}
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              </section>
            )}


            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Required Skills</h2>
                <div className={styles.skillsContainer}>
                  {job.skills.map((skill, index) => (
                    <span key={index} className={styles.skillTag}>
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Related Jobs */}
            <RelatedJobsSection
              companyName={job.company.name}
              relatedJobs={job.relatedJobs}
            />
          </main>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <JobPageSidebar job={job} />
          </aside>
        </div>
      </div>
    </div>
  );
}
