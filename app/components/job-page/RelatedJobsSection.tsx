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

function normalizeCurrencyCode(currency: string) {
  const normalized = currency?.trim().toUpperCase() || "USD";
  return normalized.startsWith("0X") ? "USDC" : normalized;
}

function formatRelatedJobBudget(amount: number, currency: string) {
  const normalizedCurrency = normalizeCurrencyCode(currency);

  if (normalizedCurrency === "USDC") {
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(amount)} USDC`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(amount)} ${normalizedCurrency}`;
  }
}

export const RelatedJobsSection = ({ companyName, relatedJobs }: RelatedJobsSectionProps) => {
  const { isAuthenticated } = useAuth();

  if (!relatedJobs || relatedJobs.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        More Jobs from
        {isAuthenticated ? (
          <span className="ml-2">{companyName}</span>
        ) : (
          <span className="ml-2">
            <CompanyInfoGuard
              value={undefined}
              seed={`${companyName}-related`}
              isVisible={false}
              textClassName={styles.relatedHeadingGuard}
              sizeClassName={styles.relatedHeadingGuard}
              blurAmount="blur-[10px]"
              placement="bottom"
            />
          </span>
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
              {relatedJob.city}, {relatedJob.country} • {formatRelatedJobBudget(relatedJob.budget, relatedJob.currency)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};
