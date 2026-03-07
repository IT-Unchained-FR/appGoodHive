"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import Cookies from "js-cookie";
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as yup from "yup";
import styles from "./job-application-popup.module.scss";

interface JobApplicationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  companyEmail: string;
  jobId: string;
  companyUserId: string;
  walletAddress: string;
  openToTalent?: boolean;
  openToMentor?: boolean;
  openToRecruiter?: boolean;
}

interface FormData {
  name: string;
  email: string;
  coverLetter: string;
  portfolioLink?: string;
}

type EligibilityReason =
  | "not_authenticated"
  | "no_profile"
  | "profile_incomplete"
  | "profile_in_review"
  | "profile_unapproved"
  | "job_role_mismatch"
  | "unknown";

interface TalentProfileData {
  first_name?: string;
  last_name?: string;
  title?: string;
  description?: string;
  country?: string;
  city?: string;
  phone_country_code?: string;
  phone_number?: string;
  email?: string;
  about_work?: string;
  telegram?: string;
  min_rate?: number | null;
  max_rate?: number | null;
  rate?: number | null;
  skills?: string;
  cv_url?: string;
  portfolio?: string;
  linkedin?: string;
  talent?: boolean;
  mentor?: boolean;
  recruiter?: boolean;
  approved?: boolean;
  inreview?: boolean;
}

interface EligibilityState {
  isEligible: boolean;
  reason: EligibilityReason | null;
  missingItems: string[];
  completionPercent: number;
  profileStatusLabel: string;
  allowedRoles: string[];
  profileRoles: string[];
}

const schema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email"),
  coverLetter: yup
    .string()
    .required("Cover letter is required")
    .min(200, "Cover letter must be at least 200 characters"),
  portfolioLink: yup.string().optional().url("Please enter a valid URL"),
});

const stripHtml = (value?: string | null) =>
  (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const normalizeRoleFlag = (value: unknown) =>
  value === true || value === "true" || value === 1;

const toRoleList = ({
  talent,
  mentor,
  recruiter,
}: {
  talent?: unknown;
  mentor?: unknown;
  recruiter?: unknown;
}) => {
  const roles: string[] = [];
  if (normalizeRoleFlag(talent)) roles.push("Talent");
  if (normalizeRoleFlag(mentor)) roles.push("Mentor");
  if (normalizeRoleFlag(recruiter)) roles.push("Recruiter");
  return roles;
};

const evaluateEligibility = (
  profile: TalentProfileData,
  allowedRoles: string[],
): EligibilityState => {
  const requiredChecks = [
    { label: "First name", passed: Boolean(stripHtml(profile.first_name)) },
    { label: "Last name", passed: Boolean(stripHtml(profile.last_name)) },
    { label: "Profile headline", passed: Boolean(stripHtml(profile.title)) },
    {
      label: "Profile description",
      passed: Boolean(stripHtml(profile.description)),
    },
    { label: "Country", passed: Boolean(stripHtml(profile.country)) },
    { label: "City", passed: Boolean(stripHtml(profile.city)) },
    {
      label: "Phone country code",
      passed: Boolean(stripHtml(profile.phone_country_code)),
    },
    { label: "Phone number", passed: Boolean(stripHtml(profile.phone_number)) },
    { label: "Email", passed: Boolean(stripHtml(profile.email)) },
    { label: "About work", passed: Boolean(stripHtml(profile.about_work)) },
    { label: "Telegram", passed: Boolean(stripHtml(profile.telegram)) },
  ];

  const skillsCount = (profile.skills || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;

  const hasSkills = skillsCount > 0;
  const hasResume = Boolean(stripHtml(profile.cv_url));
  const profileRoles = toRoleList(profile);
  const hasRole = profileRoles.length > 0;

  const minRate = profile.min_rate ?? profile.rate;
  const maxRate = profile.max_rate ?? profile.rate;
  const hasValidRatePair =
    (minRate === undefined && maxRate === undefined) ||
    (minRate !== null &&
      minRate !== undefined &&
      maxRate !== null &&
      maxRate !== undefined &&
      Number(minRate) <= Number(maxRate));

  const missingItems = requiredChecks
    .filter((item) => !item.passed)
    .map((item) => item.label);

  if (!hasResume) missingItems.push("Resume upload");
  if (!hasSkills) missingItems.push("At least one skill");
  if (!hasRole) missingItems.push("At least one role (Talent/Mentor/Recruiter)");
  if (!hasValidRatePair) missingItems.push("Valid min/max rate");

  const totalChecks = requiredChecks.length + 4;
  const completedChecks =
    requiredChecks.filter((item) => item.passed).length +
    Number(hasResume) +
    Number(hasSkills) +
    Number(hasRole) +
    Number(hasValidRatePair);

  const completionPercent = Math.round((completedChecks / totalChecks) * 100);

  const isRoleMatched =
    allowedRoles.length === 0 ||
    profileRoles.some((role) => allowedRoles.includes(role));

  const profileStatusLabel = profile.approved
    ? "Approved"
    : profile.inreview
      ? "In Review"
      : "Not Approved";

  if (missingItems.length > 0) {
    return {
      isEligible: false,
      reason: "profile_incomplete",
      missingItems,
      completionPercent,
      profileStatusLabel,
      allowedRoles,
      profileRoles,
    };
  }

  if (profile.inreview && !profile.approved) {
    return {
      isEligible: false,
      reason: "profile_in_review",
      missingItems,
      completionPercent,
      profileStatusLabel,
      allowedRoles,
      profileRoles,
    };
  }

  if (!profile.approved) {
    return {
      isEligible: false,
      reason: "profile_unapproved",
      missingItems,
      completionPercent,
      profileStatusLabel,
      allowedRoles,
      profileRoles,
    };
  }

  if (!isRoleMatched) {
    return {
      isEligible: false,
      reason: "job_role_mismatch",
      missingItems,
      completionPercent,
      profileStatusLabel,
      allowedRoles,
      profileRoles,
    };
  }

  return {
    isEligible: true,
    reason: null,
    missingItems,
    completionPercent,
    profileStatusLabel,
    allowedRoles,
    profileRoles,
  };
};

const getWarningCopy = (reason: EligibilityReason | null) => {
  switch (reason) {
    case "not_authenticated":
      return {
        title: "Sign in required",
        message:
          "Please sign in first so we can verify your profile eligibility for this application.",
        ctaLabel: "Go to Login",
        ctaHref: "/auth/login",
      };
    case "no_profile":
      return {
        title: "Create your talent profile first",
        message:
          "You need a talent profile before you can apply to this job. Build your profile and upload your resume to continue.",
        ctaLabel: "Create Profile",
        ctaHref: "/talents/my-profile",
      };
    case "profile_incomplete":
      return {
        title: "Profile is not complete yet",
        message:
          "Your talent profile is missing required details. Complete it to unlock job applications.",
        ctaLabel: "Complete Profile",
        ctaHref: "/talents/my-profile",
      };
    case "profile_in_review":
      return {
        title: "Profile under review",
        message:
          "Your profile has been submitted and is currently being reviewed. You will be able to apply once it is approved.",
        ctaLabel: "View My Profile",
        ctaHref: "/talents/my-profile",
      };
    case "profile_unapproved":
      return {
        title: "Profile approval required",
        message:
          "Your profile is saved but not approved yet. Submit it for review from your profile page to apply for jobs.",
        ctaLabel: "Open My Profile",
        ctaHref: "/talents/my-profile",
      };
    case "job_role_mismatch":
      return {
        title: "Role mismatch for this job",
        message:
          "This job is currently open for a different role. Update your profile role settings to match this posting.",
        ctaLabel: "Update Role Settings",
        ctaHref: "/talents/my-profile",
      };
    default:
      return {
        title: "Unable to continue",
        message:
          "We could not confirm your application eligibility right now. Please review your profile and try again.",
        ctaLabel: "Open My Profile",
        ctaHref: "/talents/my-profile",
      };
  }
};

export const JobApplicationPopup: React.FC<JobApplicationPopupProps> = ({
  isOpen,
  onClose,
  jobTitle,
  companyName,
  companyEmail,
  jobId,
  companyUserId,
  walletAddress,
  openToTalent,
  openToMentor,
  openToRecruiter,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isEligibilityChecking, setIsEligibilityChecking] = useState(false);
  const [eligibility, setEligibility] = useState<EligibilityState | null>(null);
  const router = useRouter();
  const loggedInUserId = Cookies.get("user_id");

  const getOverlayClasses = () => {
    return `${styles.jobApplicationOverlay} ${
      isOpen ? styles.entered : styles.exiting
    }`;
  };

  const getModalClasses = () => {
    return styles.jobApplicationModal;
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const allowedRoles = useMemo(
    () =>
      toRoleList({
        talent: openToTalent,
        mentor: openToMentor,
        recruiter: openToRecruiter,
      }),
    [openToMentor, openToRecruiter, openToTalent],
  );

  const coverLetterValue = watch("coverLetter", "");

  useEffect(() => {
    if (!isOpen) return;

    const checkEligibility = async () => {
      if (!loggedInUserId) {
        setEligibility({
          isEligible: false,
          reason: "not_authenticated",
          missingItems: [],
          completionPercent: 0,
          profileStatusLabel: "Unavailable",
          allowedRoles,
          profileRoles: [],
        });
        return;
      }

      setIsEligibilityChecking(true);
      try {
        const response = await fetch(
          `/api/talents/my-profile?user_id=${loggedInUserId}`,
        );

        if (response.status === 404) {
          setEligibility({
            isEligible: false,
            reason: "no_profile",
            missingItems: ["Create your profile"],
            completionPercent: 0,
            profileStatusLabel: "No Profile",
            allowedRoles,
            profileRoles: [],
          });
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch talent profile");
        }

        const userData = (await response.json()) as TalentProfileData;

        setValue(
          "name",
          `${userData.first_name || ""} ${userData.last_name || ""}`.trim(),
        );
        setValue("email", userData.email || "");
        if (userData.portfolio) {
          setValue("portfolioLink", userData.portfolio);
        } else if (userData.linkedin) {
          setValue("portfolioLink", userData.linkedin);
        }

        setEligibility(evaluateEligibility(userData, allowedRoles));
      } catch (error) {
        console.error("Error checking profile eligibility:", error);
        setEligibility({
          isEligible: false,
          reason: "unknown",
          missingItems: [],
          completionPercent: 0,
          profileStatusLabel: "Unavailable",
          allowedRoles,
          profileRoles: [],
        });
      } finally {
        setIsEligibilityChecking(false);
      }
    };

    void checkEligibility();
  }, [isOpen, loggedInUserId, setValue, allowedRoles]);

  const onSubmit = async (data: FormData) => {
    if (!loggedInUserId) {
      toast.error("Please sign in to apply.");
      return;
    }

    if (!eligibility?.isEligible) {
      toast.error("Please complete and approve your talent profile first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const applicationData = {
        jobId,
        applicantUserId: loggedInUserId,
        companyUserId,
        applicantName: data.name,
        applicantEmail: data.email,
        coverLetter: data.coverLetter,
        portfolioLink: data.portfolioLink || null,
      };

      const submitResponse = await fetch("/api/applications/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(applicationData),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        if (errorData.code === "DUPLICATE_APPLICATION") {
          toast.error("You have already applied to this job.");
          return;
        }
        throw new Error(errorData.message || "Failed to save application");
      }

      const submitPayload = await submitResponse.json();
      const applicationId = Number(submitPayload?.applicationId);
      let createdThreadId: string | null = null;

      if (Number.isFinite(applicationId) && applicationId > 0) {
        try {
          const threadResponse = await fetch("/api/messenger/threads", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": loggedInUserId,
            },
            body: JSON.stringify({
              companyUserId,
              talentUserId: loggedInUserId,
              threadType: "application",
              jobId,
              jobApplicationId: applicationId,
              actorUserId: loggedInUserId,
            }),
          });

          if (threadResponse.ok) {
            const threadPayload = await threadResponse.json();
            createdThreadId = threadPayload?.thread?.id || null;

            if (createdThreadId) {
              const initialMessage = [
                `Application submitted for "${jobTitle}".`,
                "",
                data.coverLetter,
                data.portfolioLink ? `Portfolio/LinkedIn: ${data.portfolioLink}` : "",
              ]
                .filter(Boolean)
                .join("\n");

              await fetch(`/api/messenger/threads/${createdThreadId}/messages`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-id": loggedInUserId,
                },
                body: JSON.stringify({
                  senderUserId: loggedInUserId,
                  messageText: initialMessage,
                }),
              });
            }
          }
        } catch (messengerError) {
          console.error("Failed to initialize application thread:", messengerError);
        }
      }

      const emailData = {
        name: data.name,
        toUserName: companyName,
        email: companyEmail,
        type: "job-applied",
        subject: `GoodHive - ${data.name} applied for "${jobTitle}"`,
        userEmail: data.email,
        message: `${data.coverLetter}${data.portfolioLink ? `\n\nPortfolio/LinkedIn: ${data.portfolioLink}` : ""}`,
        userProfile: `${window.location.origin}/talents/${loggedInUserId}`,
        jobLink: `${window.location.origin}/companies/${walletAddress}?id=${jobId}`,
      };

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      if (response.ok) {
        toast.success(
          "Application sent successfully. The company will review your submission soon.",
        );
      } else {
        toast.success(
          "Application submitted. Email notification may be delayed.",
        );
      }

      reset();
      onClose();

      if (createdThreadId) {
        router.push(`/messages?thread=${createdThreadId}` as Route);
      }
    } catch (error) {
      console.error("Error sending application:", error);
      toast.error("Failed to send application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const warningCopy = getWarningCopy(eligibility?.reason || null);
  const showWarning = Boolean(eligibility && !eligibility.isEligible);

  const navigateTo = (href: string) => {
    onClose();
    window.location.href = href;
  };

  const modalContent = (
    <div
      className={getOverlayClasses()}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={getModalClasses()}>
        {isEligibilityChecking ? (
          <div className="p-8 sm:p-10">
            <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              </div>
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-900">
                Checking eligibility
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                We are validating your profile status for this application.
              </p>
            </div>
          </div>
        ) : showWarning ? (
          <>
            <div className="relative overflow-hidden rounded-t-3xl border-b border-amber-100 bg-[linear-gradient(140deg,_#fff7ed_0%,_#fef3c7_48%,_#fffef8_100%)] px-6 py-6 sm:px-8 sm:py-7">
              <div className="pointer-events-none absolute -right-16 -top-12 h-40 w-40 rounded-full bg-amber-200/40 blur-2xl" />
              <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-orange-200/50 blur-xl" />
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-white/80 text-amber-700 transition hover:bg-white"
                type="button"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Application Locked
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-[2rem]">
                  {warningCopy.title}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-700 sm:text-base">
                  {warningCopy.message}
                </p>
                <div className="mt-4 inline-flex max-w-full items-center rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700">
                  {jobTitle}
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Profile Status
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {eligibility?.profileStatusLabel || "Unavailable"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Completion
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {eligibility?.completionPercent || 0}%
                  </p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,_#f59e0b,_#f97316)] transition-all duration-500"
                      style={{ width: `${eligibility?.completionPercent || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {eligibility?.allowedRoles && eligibility.allowedRoles.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">Job role eligibility</p>
                  <p className="mt-1 text-sm text-slate-600">
                    This job is open to: {eligibility.allowedRoles.join(", ")}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Your active roles: {eligibility.profileRoles.length > 0 ? eligibility.profileRoles.join(", ") : "None selected"}
                  </p>
                </div>
              )}

              {eligibility?.missingItems && eligibility.missingItems.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <AlertTriangle className="h-4 w-4" />
                    Missing profile requirements
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {eligibility.missingItems.slice(0, 8).map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo(warningCopy.ctaHref)}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,_#f59e0b,_#f97316)] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(249,115,22,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(249,115,22,0.28)]"
                >
                  {warningCopy.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="relative bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 p-8 rounded-t-3xl overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 h-full w-full">
                  <div className="grid grid-cols-6 gap-2 transform rotate-12 scale-150 -translate-x-4 -translate-y-4">
                    {Array.from({ length: 24 }, (_, i) => (
                      <div
                        key={i}
                        className="h-8 w-8 border-2 border-amber-300 transform rotate-45"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30"
                disabled={isSubmitting}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="relative z-10 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-white">Apply for Position</h2>
                <p className="text-sm text-amber-100">Join the hive at {companyName}</p>
                <div className="mt-3 inline-block rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                  <p className="text-sm font-medium text-white">{jobTitle}</p>
                </div>
              </div>
            </div>

            <div className="p-10">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div>
                  <label className="mb-2 flex items-center text-sm font-semibold text-gray-800">
                    <span className="mr-2 h-2 w-2 rounded-full bg-amber-500" />
                    Your Name
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    placeholder="Enter your full name..."
                    className="w-full rounded-xl border-2 border-amber-100 bg-amber-50/30 px-4 py-3 font-medium text-gray-800 placeholder-gray-500 transition-all duration-200 hover:bg-amber-50/50 focus:border-amber-400 focus:ring-0"
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="mt-1 flex items-center text-sm text-red-500">
                      <span className="mr-1">!</span>
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 flex items-center text-sm font-semibold text-gray-800">
                    <span className="mr-2 h-2 w-2 rounded-full bg-blue-500" />
                    Email Address
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="your.email@example.com"
                    className="w-full rounded-xl border-2 border-amber-100 bg-amber-50/30 px-4 py-3 font-medium text-gray-800 placeholder-gray-500 transition-all duration-200 hover:bg-amber-50/50 focus:border-amber-400 focus:ring-0"
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="mt-1 flex items-center text-sm text-red-500">
                      <span className="mr-1">!</span>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 flex items-center text-sm font-semibold text-gray-800">
                    <span className="mr-2 h-2 w-2 rounded-full bg-amber-600" />
                    Portfolio/LinkedIn (Optional)
                  </label>
                  <input
                    {...register("portfolioLink")}
                    type="url"
                    placeholder="https://your-portfolio.com or LinkedIn profile..."
                    className="w-full rounded-xl border-2 border-amber-100 bg-amber-50/30 px-4 py-3 font-medium text-gray-800 placeholder-gray-500 transition-all duration-200 hover:bg-amber-50/50 focus:border-amber-400 focus:ring-0"
                    disabled={isSubmitting}
                  />
                  {errors.portfolioLink && (
                    <p className="mt-1 flex items-center text-sm text-red-500">
                      <span className="mr-1">!</span>
                      {errors.portfolioLink.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 flex items-center text-sm font-semibold text-gray-800">
                    <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
                    Cover Letter
                  </label>
                  <textarea
                    {...register("coverLetter")}
                    rows={8}
                    placeholder="Tell us about yourself and why you are a great fit for this role..."
                    className="w-full resize-none rounded-xl border-2 border-amber-100 bg-amber-50/30 px-4 py-3 font-medium text-gray-800 placeholder-gray-500 transition-all duration-200 hover:bg-amber-50/50 focus:border-amber-400 focus:ring-0"
                    disabled={isSubmitting}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Minimum 200 characters required</span>
                    <span
                      className={`text-xs font-medium ${coverLetterValue.length >= 200 ? "text-green-600" : "text-red-500"}`}
                    >
                      {coverLetterValue.length}/200
                    </span>
                  </div>
                  {errors.coverLetter && (
                    <p className="mt-1 flex items-center text-sm text-red-500">
                      <span className="mr-1">!</span>
                      {errors.coverLetter.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-full border-2 border-gray-200 px-6 py-3 font-semibold text-gray-600 transition-all duration-200 hover:bg-gray-50 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:from-amber-600 hover:to-yellow-600 hover:shadow-xl disabled:opacity-50 disabled:transform-none disabled:shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending Application...
                      </>
                    ) : (
                      "Apply Now"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-10 border-t border-amber-100 pt-8 text-center">
                <p className="flex items-center justify-center text-sm text-gray-500">
                  Your application will be sent directly to the company.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};
