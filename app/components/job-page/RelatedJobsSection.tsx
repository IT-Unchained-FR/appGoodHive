"use client";

import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { CompanyInfoGuard } from "@/app/components/CompanyInfoGuard";
import styles from "@/app/jobs/[jobId]/page.module.scss";

interface RelatedJob {
  id: string;
  title: string;
  budget: number;
  currency: string;
  projectType: string;
  city: string;
  country: string;
  postedAt: string;
}

interface RelatedJobsSectionProps {
  companyName: string;
  relatedJobs: RelatedJob[];
}

export const RelatedJobsSection = ({ companyName, relatedJobs }: RelatedJobsSectionProps) => {
  const { isAuthenticated } = useAuth();

  if (!relatedJobs || relatedJobs.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        More Jobs from{" "}
        {isAuthenticated ? (
          companyName
        ) : (
          <CompanyInfoGuard
            value={undefined}
            seed={`${companyName}-related`}
            isVisible={false}
            textClassName={styles.relatedHeadingGuard}
            sizeClassName={styles.relatedHeadingGuard}
            placement="bottom"
          />
        )}
      </h2>
      <div className={styles.relatedJobs}>
        {relatedJobs.map((relatedJob) => (
          <Link
            key={relatedJob.id}
            href={`/jobs/${relatedJob.id}`}
            className={styles.relatedJobCard}
          >
            <h3 className={styles.relatedJobTitle}>{relatedJob.title}</h3>
            <p className={styles.relatedJobMeta}>
              {relatedJob.city}, {relatedJob.country} • {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: relatedJob.currency === 'USDC' ? 'USD' : relatedJob.currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(relatedJob.budget)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};
