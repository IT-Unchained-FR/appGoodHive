"use client";

import { useState } from "react";
import { CheckCircle2, Copy, ExternalLink, MessageSquare, Share2 } from "lucide-react";

import { useAuthCheck } from "@/app/hooks/useAuthCheck";
import { JobApplicationPopup } from "@/app/components/job-application-popup/job-application-popup";

interface JobActionPanelProps {
  canEditJob: boolean;
  canMessageCompany: boolean;
  companyEmail: string;
  companyName: string;
  companyUserId: string;
  hasApplied: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isCompanyOwner: boolean;
  isEditableState: boolean;
  isApprovedTalent: boolean;
  jobId: string;
  jobTitle: string;
  manageApplicantsHref: string;
  openToMentor?: boolean;
  openToRecruiter?: boolean;
  openToTalent?: boolean;
  reviewHref: string;
  walletAddress: string;
}

export default function JobActionPanel({
  canEditJob,
  canMessageCompany,
  companyEmail,
  companyName,
  companyUserId,
  hasApplied,
  isAdmin,
  isAuthenticated,
  isCompanyOwner,
  isEditableState,
  isApprovedTalent,
  jobId,
  jobTitle,
  manageApplicantsHref,
  openToMentor = false,
  openToRecruiter = false,
  openToTalent = false,
  reviewHref,
  walletAddress,
}: JobActionPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const { checkAuthAndShowConnectPrompt } = useAuthCheck();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: jobTitle,
          text: `Check out this job from ${companyName} on GoodHive`,
          url: window.location.href,
        });
        return;
      } catch (error) {
        console.error("Failed to share job:", error);
      }
    }

    await handleCopyLink();
  };

  return (
    <>
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {isAdmin ? (
            <a
              href={reviewHref}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <ExternalLink className="h-4 w-4" />
              Admin Review
            </a>
          ) : null}

          {isCompanyOwner ? (
            <>
              {canEditJob ? (
                <a
                  href={`/companies/create-job?id=${jobId}`}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Edit Job
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400"
                >
                  Edit Locked
                </button>
              )}

              <a
                href={manageApplicantsHref}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                <MessageSquare className="h-4 w-4" />
                Manage Applicants
              </a>

              {!isEditableState ? (
                <p className="w-full text-xs text-slate-500">
                  Editing is available only while the job is in draft or rejected status.
                </p>
              ) : null}
            </>
          ) : null}

          {!isAdmin && !isCompanyOwner && isApprovedTalent && !hasApplied ? (
            <button
              type="button"
              onClick={() => setIsApplicationOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              Apply Now
            </button>
          ) : null}

          {!isAdmin && !isCompanyOwner && isApprovedTalent && hasApplied ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Applied
            </button>
          ) : null}

          {!isAdmin && !isCompanyOwner && !isAuthenticated ? (
            <button
              type="button"
              onClick={() =>
                checkAuthAndShowConnectPrompt("apply to this job", "access-protected")
              }
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              Connect Wallet to Apply
            </button>
          ) : null}

          {!isAdmin && !isCompanyOwner && canMessageCompany ? (
            <a
              href="/messages"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              <MessageSquare className="h-4 w-4" />
              Message Company
            </a>
          ) : null}

          <button
            type="button"
            onClick={() => void handleShare()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>

          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy Link"}
          </button>
        </div>
      </div>

      {isApprovedTalent ? (
        <JobApplicationPopup
          companyEmail={companyEmail}
          companyName={companyName}
          companyUserId={companyUserId}
          isOpen={isApplicationOpen}
          jobId={jobId}
          jobTitle={jobTitle}
          onClose={() => setIsApplicationOpen(false)}
          openToMentor={openToMentor}
          openToRecruiter={openToRecruiter}
          openToTalent={openToTalent}
          walletAddress={walletAddress}
        />
      ) : null}
    </>
  );
}
