import FundManager from "@/app/components/FundManager";
import { JobDescriptionAIBuilder } from "@/app/components/JobDescriptionAIBuilder";
import { BlockchainActivateModal } from "@/app/components/BlockchainActivateModal";
import JobSectionsManager from "@/app/components/job-sections-manager/job-sections-manager";
import ProfileImageUpload from "@/app/components/profile-image-upload";
import { useProtectedNavigation } from "@/app/hooks/useProtectedNavigation";
import "@/app/styles/rich-text.css";
import { ACTIVE_CHAIN_ID } from "@/config/chains";
import { useJobManager } from "@/hooks/contracts/useJobManager";
import { getSupportedTokensForChain } from "@/lib/contracts/jobManager";
import { chains } from "@constants/chains";
import {
  createJobServices,
  ethereumTokens,
  gnosisChainTokens,
  jobTypes,
  polygonMainnetTokens,
  polygonAmoyTokens,
  projectDuration,
  projectTypes,
  typeEngagements,
} from "@constants/common";
import { IJobSection } from "@interfaces/job-offer";
import LabelOption from "@interfaces/label-option";
import Link from "next/link";
import { ChevronDown, Compass, Eye, Lock, Sparkles, Wallet, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import "react-quill/dist/quill.snow.css";
import { useActiveAccount } from "thirdweb/react";
import { canCompanyDeleteJob, REVIEW_TURNAROUND } from "@/lib/jobs/review";
import { useConfirm } from "@/app/components/ConfirmDialog/ConfirmDialog";
import { AiDraftCard } from "./editor/AiDraftCard";
import { EditorNav } from "./editor/EditorNav";
import { EditorRail } from "./editor/EditorRail";
import { manrope } from "./editor/font";
import { SkillsField } from "./editor/SkillsField";
import {
  EditorCard,
  hexClip,
  jobEditorUi as ui,
  LockedValue,
  SelectField,
  StatusPill,
} from "./editor/ui";

// A job needs this many skills before it can be submitted; fewer matches poorly.
const MIN_SKILLS = 3;

const SERVICE_COPY: Record<"talent" | "recruiter" | "mentor", { name: string; description: string }> = {
  talent: {
    name: "Talent",
    description: "Talent applies directly and you choose who to hire.",
  },
  recruiter: {
    name: "Recruiters",
    description: "A GoodHive recruiter introduces you to a shortlist of candidates.",
  },
  mentor: {
    name: "Mentors",
    description: "A tech mentor vets candidates and guides the person you hire.",
  },
};

function formatMoney(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const mapToChainId = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const normalized = value.toString().toLowerCase();

  if (
    [
      "polygon",
      "polygon-mainnet",
      "matic",
      "matic-mainnet",
      "polygon_mainnet",
    ].includes(normalized)
  ) {
    return 137;
  }

  if (
    [
      "polygon-amoy",
      "amoy",
      "polygon_testnet",
      "polygon-amoy-testnet",
      "polygon-mumbai",
    ].includes(normalized)
  ) {
    return 80002;
  }

  if (
    ["gnosis", "gnosis-chain", "chiado", "gnosis chain"].includes(normalized)
  ) {
    return 100;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

// Note: ReactQuill is now used within individual JobSectionEditor components

interface JobFormProps {
  isLoading: boolean;
  companyData: any;
  jobData: any;
  title: string;
  setTitle: (title: string) => void;
  selectedSkills: string[];
  setSelectedSkills: (skills: string[]) => void;
  description: string;
  setDescription: (description: string) => void;
  jobSections: IJobSection[];
  setJobSections: (sections: IJobSection[]) => void;
  jobServices: {
    talent: boolean;
    recruiter: boolean;
    mentor: boolean;
  };
  setJobServices: (services: any) => void;
  budget: string;
  setBudget: (budget: string) => void;
  jobImage: string | null;
  setJobImage: (image: string) => void;
  selectedChain: LabelOption | null;
  setSelectedChain: (chain: LabelOption | null) => void;
  selectedCurrency: LabelOption | null;
  setSelectedCurrency: (currency: LabelOption | null) => void;
  typeEngagement: LabelOption | null;
  setTypeEngagement: (engagement: LabelOption | null) => void;
  jobType: LabelOption | null;
  setJobType: (type: LabelOption | null) => void;
  duration: LabelOption | null;
  setDuration: (duration: LabelOption | null) => void;
  projectType: LabelOption | null;
  setProjectType: (type: LabelOption | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsPopupModalOpen: (open: boolean) => void;
  setPopupModalType: (type: string) => void;
  handleCreateJob: (jobId: string, amount: string) => Promise<boolean>;
  onRefreshJobData?: () => Promise<void>;
  /** Replays the create-job tour (new jobs only). */
  onReplayTour?: () => void;
  /** Fills the form from an AI draft (new jobs only). */
  onAiGenerated?: (data: unknown) => void;
}

export const JobForm = ({
  isLoading,
  companyData,
  jobData,
  title,
  setTitle,
  selectedSkills,
  setSelectedSkills,
  description,
  setDescription,
  jobSections,
  setJobSections,
  jobServices,
  setJobServices,
  budget,
  setBudget,
  jobImage,
  setJobImage,
  selectedChain,
  setSelectedChain,
  selectedCurrency,
  setSelectedCurrency,
  typeEngagement,
  setTypeEngagement,
  jobType,
  setJobType,
  duration,
  setDuration,
  projectType,
  setProjectType,
  setIsLoading,
  setIsPopupModalOpen,
  setPopupModalType,
  handleCreateJob,
  onRefreshJobData,
  onReplayTour,
  onAiGenerated,
}: JobFormProps) => {
  const [isCommissionExpanded, setIsCommissionExpanded] = useState(false);
  const [showFundManager, setShowFundManager] = useState(false);
  const [confirm, confirmDialog] = useConfirm();
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);
  const [fundManagerTab, setFundManagerTab] = useState<"add" | "withdraw">("add");
  const [showAiDraft, setShowAiDraft] = useState(true);
  const [showAiBuilder, setShowAiBuilder] = useState(false);
  const jobImageRef = useRef<HTMLDivElement>(null);

  // New jobs start on the only supported chain and its first token (the
  // shared select used to do this through its defaultValue).
  useEffect(() => {
    if (!selectedChain) setSelectedChain(chains[0] ?? null);
  }, [selectedChain, setSelectedChain]);
  useEffect(() => {
    if (!selectedCurrency) setSelectedCurrency(polygonAmoyTokens[0] ?? null);
  }, [selectedCurrency, setSelectedCurrency]);

  // "Unsaved changes" for saved jobs: compare against the values loaded
  // with the job. Saving reloads the page, which resets the baseline.
  const formSnapshot = JSON.stringify({
    title,
    jobSections,
    selectedSkills,
    budget,
    jobServices,
    jobImage,
    engagement: typeEngagement?.value,
    jobType: jobType?.value,
    duration: duration?.value,
    projectType: projectType?.value,
    currency: selectedCurrency?.value,
  });
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  useEffect(() => {
    if (jobData?.id) setSavedSnapshot(formSnapshot);
    // Only when a different job is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobData?.id]);
  const isDirty = savedSnapshot !== null && savedSnapshot !== formSnapshot;
  const { navigate: protectedNavigate } = useProtectedNavigation();

  const jobChainLabel = useMemo(
    () => jobData?.chain ?? selectedChain?.value ?? null,
    [jobData?.chain, selectedChain?.value],
  );

  const jobChainId = useMemo(
    () => mapToChainId(jobChainLabel),
    [jobChainLabel],
  );

  const currentBlockchainJobId = useMemo(() => {
    if (!jobData) {
      return null;
    }

    const rawId =
      jobData.block_id ??
      jobData.blockchainJobId ??
      jobData.blockchain_job_id ??
      jobData.job_id ??
      null;

    if (rawId === null || rawId === undefined || rawId === "") {
      return null;
    }

    if (typeof rawId === "bigint") {
      return rawId.toString();
    }

    if (typeof rawId === "number") {
      return rawId.toString();
    }

    return rawId.toString();
  }, [jobData]);
  const currentReviewStatus = jobData?.review_status || "draft";
  const isReadOnlyReviewState =
    currentReviewStatus === "pending_review" ||
    currentReviewStatus === "approved";
  // Live jobs stay editable, but chain, currency and services are fixed on-chain.
  const isLiveJob = currentReviewStatus === "active";

  const onChainCurrency = useMemo(() => {
    const currency = selectedCurrency?.value || jobData?.currency;
    return currency ? currency.toUpperCase() : "";
  }, [selectedCurrency?.value, jobData?.currency]);

  const fundManagerTokenAddress = useMemo(() => {
    if (jobData?.payment_token_address) {
      return jobData.payment_token_address;
    }

    if (!jobChainId) {
      return "";
    }

    const supportedTokens = getSupportedTokensForChain(jobChainId);

    if (onChainCurrency === "USDC" && supportedTokens.USDC) {
      return supportedTokens.USDC;
    }

    if (onChainCurrency === "DAI" && supportedTokens.DAI) {
      return supportedTokens.DAI;
    }

    return supportedTokens.USDC || supportedTokens.DAI || "";
  }, [jobData?.payment_token_address, jobChainId, onChainCurrency]);

  // Web3 integration
  const account = useActiveAccount();
  const {
    isLoading: isBlockchainLoading,
    error: blockchainError,
    createJob,
  } = useJobManager();

  // Calculate total percentage of selected services
  const getTotalPercentage = () => {
    let total = 0;
    if (jobServices.talent) total += 10;
    if (jobServices.recruiter) total += 8;
    if (jobServices.mentor) total += 12;
    return total;
  };

  const onJobServicesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedServices = {
      ...jobServices,
      [event.target.name]: event.target.checked,
    };
    setJobServices(updatedServices);
  };

  const onBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(event.target.value);
  };

  // Handle saving/creating a job
  const handleSaveJob = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!companyData?.user_id) {
      toast.error("Please complete your company profile first");
      return;
    }

    // Validation
    if (!title.trim()) {
      toast.error("Please provide a job title");
      return;
    }

    if (!selectedSkills.length) {
      toast.error("Please select at least one skill");
      return;
    }

    // Validate job sections
    if (!jobSections || jobSections.length === 0) {
      toast.error("Please add at least one job section");
      return;
    }

    // Validate each section
    for (const section of jobSections) {
      if (!section.heading.trim()) {
        toast.error("All sections must have a heading");
        return;
      }
      if (!section.content.trim()) {
        toast.error("All sections must have content");
        return;
      }
    }

    if (!budget.trim()) {
      toast.error("Please provide a budget");
      return;
    }

    setIsLoading(true);

    try {
      const jobPayload = {
        userId: companyData.user_id,
        title: title,
        typeEngagement: typeEngagement?.value || "freelance",
        description: description,
        duration: duration?.value || "moreThanSevenDays",
        budget: budget,
        skills: selectedSkills.join(", "),
        chain: selectedChain?.value || "polygon-amoy",
        currency: selectedCurrency?.value || "USD",
        walletAddress: companyData.wallet_address || "",
        city: companyData.city || "",
        country: companyData.country || "",
        imageUrl: jobImage || "",
        jobType: jobType?.value || "remote",
        companyName: companyData.company_name || "",
        projectType: projectType?.value || "fixed",
        talent: jobServices.talent,
        recruiter: jobServices.recruiter,
        mentor: jobServices.mentor,
        in_saving_stage: true, // Save as draft
        sections: jobSections,
      };

      const endpoint = jobData?.id
        ? `/api/jobs/${jobData.id}`
        : "/api/companies/create-job";

      const response = await fetch(endpoint, {
        method: jobData?.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobPayload),
      });

      const data = await response.json();

      if (response.ok) {
        if (jobData?.id) {
          // If editing existing job, just reload
          toast.success("Job updated successfully");
          window.location.reload();
        } else {
          // If creating new job, redirect to edit page with new job ID
          toast.success("Job saved as draft");
          const newJobId = data.jobId;
          if (newJobId) {
            window.location.href = `/companies/create-job?id=${newJobId}`;
          } else {
            window.location.reload();
          }
        }
      } else {
        throw new Error(data.error || data.message || "Failed to save job");
      }
    } catch (error: any) {
      console.error("Error saving job:", error);
      toast.error(error.message || "Failed to save job");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle managing funds
  const onManageFundsClick = () => {
    if (!account) {
      toast.error("Please connect your wallet to manage funds");
      return;
    }
    if (!currentBlockchainJobId) {
      toast.error("Job not published on blockchain yet");
      return;
    }
    const readableChainName = jobChainLabel
      ? jobChainLabel
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (char: string) => char.toUpperCase())
      : "the correct network";
    if (jobChainId && jobChainId !== ACTIVE_CHAIN_ID) {
      toast.error(
        `This job is published on the ${readableChainName} network. Please switch your wallet to that network to manage funds.`,
      );
      return;
    }

    if (!onChainCurrency || !["USDC", "DAI"].includes(onChainCurrency)) {
      toast.error(
        "Funds can only be managed for jobs published with USDC or DAI. Please update the job currency before managing funds.",
      );
      return;
    }

    if (!fundManagerTokenAddress) {
      toast.error(
        "Unable to determine the token address for this job. Please republish the job or contact support.",
      );
      return;
    }
    setShowFundManager(true);
  };

  // Handle canceling/deleting a job
  const handleCancelJob = async () => {
    if (!jobData?.id) return;

    const confirmed = await confirm({
      title: "Delete this job?",
      description:
        "The job and everything you've written for it are permanently deleted. This can't be undone.",
      confirmLabel: "Delete job",
      cancelLabel: "Keep job",
      tone: "danger",
    });
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/companies/delete-job`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: jobData.id }),
      });

      if (response.ok) {
        toast.success("Job deleted");
        protectedNavigate("/companies/dashboard/jobs", {
          authDescription: "access your jobs",
        });
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete job");
      }
    } catch (error: any) {
      console.error("Error deleting job:", error);
      toast.error(error.message || "Failed to delete job");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitForReview = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();

    if (!companyData?.user_id) {
      toast.error("Please complete your company profile first");
      return;
    }

    // Validation
    if (!title.trim()) {
      toast.error("Please provide a job title");
      return;
    }

    if (!selectedSkills.length) {
      toast.error("Please select at least one skill");
      return;
    }

    // Validate job sections
    if (!jobSections || jobSections.length === 0) {
      toast.error("Please add at least one job section");
      return;
    }

    // Validate each section
    for (const section of jobSections) {
      if (!section.heading.trim()) {
        toast.error("All sections must have a heading");
        return;
      }
      if (!section.content.trim()) {
        toast.error("All sections must have content");
        return;
      }
    }

    if (!budget.trim()) {
      toast.error("Please provide a budget");
      return;
    }

    setIsLoading(true);

    try {
      let databaseJobId = jobData?.id as string | undefined;
      const jobPayload = {
        userId: companyData.user_id,
        title: title,
        typeEngagement: typeEngagement?.value || "freelance",
        description: description,
        duration: duration?.value || "moreThanSevenDays",
        budget: budget,
        skills: selectedSkills.join(", "),
        chain: selectedChain?.value || "polygon-amoy",
        currency: selectedCurrency?.value || "USD",
        walletAddress: companyData.wallet_address || "",
        city: companyData.city || "",
        country: companyData.country || "",
        imageUrl: jobImage || "",
        jobType: jobType?.value || "remote",
        companyName: companyData.company_name || "",
        projectType: projectType?.value || "fixed",
        talent: jobServices.talent,
        recruiter: jobServices.recruiter,
        mentor: jobServices.mentor,
        in_saving_stage: true,
        sections: jobSections,
      };

      if (databaseJobId) {
        const saveResponse = await fetch(`/api/jobs/${databaseJobId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jobPayload),
        });

        const saveData = await saveResponse.json();
        if (!saveResponse.ok) {
          throw new Error(
            saveData.error || "Failed to update job before review",
          );
        }
      } else {
        const response = await fetch("/api/companies/create-job", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jobPayload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to create job in database");
        }

        databaseJobId = data.jobId;
      }

      if (!databaseJobId) {
        throw new Error("Failed to determine database job ID");
      }

      const submitResponse = await fetch(
        `/api/jobs/${databaseJobId}/submit-review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const submitData = await submitResponse.json();
      if (!submitResponse.ok) {
        throw new Error(
          submitData.error || "Failed to submit job for review",
        );
      }

      toast.success(
        `Job submitted. We usually review within ${REVIEW_TURNAROUND} and will email you.`,
      );
      window.location.href = `/companies/create-job?id=${databaseJobId}`;
    } catch (error: any) {
      console.error("Error submitting job for review:", error);
      toast.error(error.message || "Failed to submit job for review");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishJob = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!account) {
      toast.error("Please connect your wallet to publish the job on blockchain");
      return;
    }

    if (!fundManagerTokenAddress) {
      toast.error("Unable to determine token address. Please set the job currency first.");
      return;
    }

    setIsLoading(true);
    const toastId = "publish-job";

    try {
      // Step 1: Create job on blockchain
      toast.loading("Creating job on blockchain…", { id: toastId });

      const result = await createJob({
        databaseId: jobData?.id,
        tokenAddress: fundManagerTokenAddress,
        chain: selectedChain?.value || jobData?.chain || "polygon-amoy",
        talentService: jobServices.talent || false,
        recruiterService: jobServices.recruiter || false,
        mentorService: jobServices.mentor || false,
      });

      if (!result) {
        toast.dismiss(toastId);
        // createJob already toasted the error
        return;
      }

      const {
        jobId: blockchainJobId,
        transactionHash,
        tokenAddress: onChainTokenAddress,
      } = result;

      // Step 2: Sync real blockchain ID to DB. Skipped when the job was
      // already on-chain and recovered — there's no new creation tx to record.
      if (transactionHash) {
        toast.loading("Syncing with database…", { id: toastId });

        await fetch("/api/blockchain/sync-job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: jobData?.id,
            blockchainJobId,
            transactionHash,
            tokenAddress: onChainTokenAddress,
            contractAddress: "",
            status: "confirmed",
          }),
        });
      }

      // Step 3: Mark as published in DB with real blockchain ID
      toast.loading("Publishing…", { id: toastId });

      const updateResponse = await fetch("/api/companies/manage-job", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: jobData?.id,
          publish: true,
          in_saving_stage: false,
          blockchainJobId,
          paymentTokenAddress: onChainTokenAddress,
        }),
      });

      if (!updateResponse.ok) {
        const data = await updateResponse.json();
        throw new Error(data.message || "Failed to publish job");
      }

      toast.success("Job published on blockchain!", { id: toastId });
      window.location.reload();
    } catch (error: any) {
      console.error("Error publishing job:", error);
      toast.error(error.message || "Failed to publish job", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived state for the editor layout ─────────────────────────────────
  const isNewJob = !jobData?.id;
  const isOnChain = Boolean(jobData?.payment_token_address);
  const isDraftState = currentReviewStatus === "draft" || currentReviewStatus === "rejected";
  const lockedOnChain = isLiveJob || isOnChain;
  const currencyLabel = selectedCurrency?.label || jobData?.currency || "USDC";
  const isHourly = projectType?.value === "hourly";
  const budgetNumber = Number(budget) || 0;
  const feePercent = getTotalPercentage();
  const feeAmount = (budgetNumber * feePercent) / 100;
  const totalToFund = budgetNumber + feeAmount;
  const currencyOptions =
    selectedChain?.value === "ethereum"
      ? ethereumTokens
      : selectedChain?.value === "polygon"
        ? polygonMainnetTokens
        : selectedChain?.value === "gnosis-chain"
          ? gnosisChainTokens
          : polygonAmoyTokens;
  const isBusy = isLoading || isBlockchainLoading;

  const sectionsComplete =
    jobSections.length > 0 &&
    jobSections.every((s) => s.heading.trim() && s.content.replace(/<[^>]*>/g, "").trim());
  const basicsComplete = Boolean(title.trim() && typeEngagement && jobType && duration);
  const skillsComplete = selectedSkills.length >= MIN_SKILLS;
  const budgetComplete = Boolean(projectType && budgetNumber > 0);
  const checklist = [
    { label: "Add a title and basics", done: basicsComplete },
    { label: "Describe the role", done: sectionsComplete },
    { label: `Add at least ${MIN_SKILLS} skills`, done: skillsComplete },
    { label: "Set a budget", done: budgetComplete },
  ];
  const stepsLeft = checklist.filter((item) => !item.done).length;
  const navSteps = [
    { id: "basics", label: "Basics", done: basicsComplete },
    { id: "description", label: "Description", done: sectionsComplete },
    { id: "skills", label: "Skills", done: skillsComplete },
    { id: "applicants", label: "Who can respond", done: true },
    { id: "budget", label: "Budget & payment", done: budgetComplete && Boolean(selectedCurrency) },
  ];

  const handleUnpublish = async () => {
    if (!jobData?.id) return;
    const confirmed = await confirm({
      title: `Unpublish “${title.trim() || "this job"}”?`,
      description: (
        <div className="space-y-3">
          <p>
            Talent won&apos;t be able to find or apply to this job. Applications
            you&apos;ve already received stay in your pipeline.
          </p>
          {isOnChain && (
            <p className="rounded-[10px] bg-[#F3F1EA] px-3.5 py-3 text-[13.5px] text-[#3A372F]">
              Any funds in escrow stay in the contract. Withdraw them anytime from
              this page.
            </p>
          )}
        </div>
      ),
      confirmLabel: "Unpublish job",
      cancelLabel: "Keep it live",
      tone: "danger",
    });
    if (!confirmed) return;

    setIsLoading(true);
    try {
      // Closing is what takes a job off the platform everywhere (search, My
      // Jobs, the job page); it's the same action as "Close job" on My Jobs.
      const response = await fetch(`/api/jobs/${jobData.id}/close`, { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; success?: boolean };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to unpublish job");
      }
      toast.success("Job unpublished");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unpublish job");
    } finally {
      setIsLoading(false);
    }
  };

  const canDelete =
    !!jobData?.id &&
    canCompanyDeleteJob({
      payment_token_address: jobData.payment_token_address ?? null,
      review_status: currentReviewStatus,
    });

  const logoClick = () =>
    jobImageRef.current?.querySelector<HTMLElement>(".cursor-pointer")?.click();

  return (
    <div className={`${manrope.className} ${ui.page} min-h-screen`}>
      {/* Page header */}
      <div className="border-b border-[#E8E5DC] bg-white px-4 pb-[22px] pt-5 sm:px-10">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {!isNewJob && (
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-[#111] text-[11px] font-extrabold text-white"
                style={{ clipPath: hexClip }}
              >
                {companyData?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={jobImage || companyData.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  (companyData?.designation ?? "").slice(0, 8)
                )}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[#6B665A]">
                <Link href="/companies/dashboard/jobs" className="text-[#6B665A] no-underline hover:text-[#1C1B17]">
                  Jobs
                </Link>{" "}
                / {isNewJob ? "New job" : "Edit job"}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="m-0 truncate text-[26px] font-extrabold tracking-[-0.4px]">
                  {isNewJob ? "Post a job" : title.trim() || "Untitled job"}
                </h1>
                <StatusPill status={currentReviewStatus} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onReplayTour && (
              <button type="button" onClick={onReplayTour} className={`${ui.btnGhost} h-11 px-2 text-[#8A5A00]`}>
                <Compass className="h-4 w-4" />
                How it works
              </button>
            )}
            {!isNewJob && !isReadOnlyReviewState && (
              isDirty ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8A5A00]">
                    <span className="h-[7px] w-[7px] rounded-full bg-[#E0A800]" />
                    Unsaved changes
                  </span>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className={`${ui.btnGhost} h-11 px-3.5 text-[#4A463C]`}
                  >
                    Discard
                  </button>
                </>
              ) : (
                <span className="text-[13px] font-medium text-[#6B665A]">All changes saved</span>
              )
            )}
            {isDraftState && stepsLeft > 0 && (
              <span className="text-[13px] font-semibold text-[#6B665A]">
                {stepsLeft} required {stepsLeft === 1 ? "step" : "steps"} left
              </span>
            )}
            {currentReviewStatus === "pending_review" && (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B665A]">
                <Lock className="h-3.5 w-3.5" />
                Locked while in review
              </span>
            )}
            {isLiveJob && jobData?.id && (
              <Link href={`/jobs/${jobData.id}`} className={`${ui.btnOutline} no-underline`}>
                <Eye className="h-4 w-4" />
                View live job
              </Link>
            )}

            {isDraftState && (
              <>
                <button
                  type="button"
                  data-tour="job-save-draft"
                  onClick={handleSaveJob}
                  disabled={isBusy || !companyData?.user_id}
                  className={ui.btnOutline}
                >
                  {isLoading ? "Saving…" : "Save draft"}
                </button>
                <button
                  type="button"
                  data-tour="job-submit-review"
                  onClick={handleSubmitForReview}
                  disabled={isBusy || !companyData?.user_id || stepsLeft > 0}
                  title={stepsLeft > 0 ? "Complete the checklist to submit" : undefined}
                  className={ui.btnPrimary}
                >
                  {currentReviewStatus === "rejected" ? "Resubmit for review" : "Submit for review"}
                </button>
              </>
            )}
            {currentReviewStatus === "approved" && (
              <button type="button" onClick={() => setShowBlockchainModal(true)} disabled={isBusy} className={ui.btnPrimary}>
                <Zap className="h-4 w-4" />
                {isOnChain ? "Add provision fund" : "Publish to blockchain"}
              </button>
            )}
            {(isLiveJob || currentReviewStatus === "closed") && (
              <button
                type="button"
                data-tour="job-save-draft"
                onClick={handleSaveJob}
                disabled={isBusy || !companyData?.user_id}
                className={
                  isDirty
                    ? ui.btnPrimary
                    : "inline-flex h-11 items-center justify-center rounded-[10px] bg-[#EFEDE6] px-5 text-sm font-bold text-[#8A8474] transition hover:bg-[#E5E2D8] disabled:cursor-not-allowed"
                }
              >
                {isLoading ? "Saving…" : "Save changes"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 px-4 py-6 sm:px-10 sm:py-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[200px_minmax(0,1fr)_340px]">
        <div className="hidden self-stretch lg:block">
          <EditorNav steps={navSteps} mode={isDraftState ? "steps" : "index"} />
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="min-w-0">
          <fieldset disabled={isReadOnlyReviewState} className="flex min-w-0 flex-col gap-6">
            {isNewJob && showAiDraft && onAiGenerated && (
              <AiDraftCard onGenerated={onAiGenerated} onDismiss={() => setShowAiDraft(false)} />
            )}

            {/* Basics */}
            <EditorCard
              id="basics"
              title="Basics"
              description="The essentials talent sees first in search results."
            >
              <div className="mb-5 flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex flex-col items-center gap-2" data-tour="job-image" ref={jobImageRef}>
                  <ProfileImageUpload
                    currentImage={jobImage || companyData?.image_url || ""}
                    displayName="Job Image"
                    onImageUpdate={(imageUrl) => setJobImage(imageUrl)}
                    variant="job"
                    size={84}
                  />
                  <button type="button" onClick={logoClick} className={`${ui.btnGhost} text-[13px] text-[#8A5A00]`}>
                    {jobImage ? "Change image" : "Add image"}
                  </button>
                </div>
                <div className="min-w-0 flex-1" data-tour="job-title">
                  <label htmlFor="title" className={ui.label}>
                    Job title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    maxLength={100}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Solidity Engineer"
                    className={ui.field}
                  />
                  <p className={ui.hint}>
                    Keep it short and searchable. Your company logo is used if you don&apos;t add an image.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3" data-tour="job-engagement">
                <SelectField id="engagement" label="Engagement" options={typeEngagements} value={typeEngagement} onChange={setTypeEngagement} />
                <SelectField id="work-location" label="Work location" options={jobTypes} value={jobType} onChange={setJobType} />
                <SelectField id="duration" label="Duration" options={projectDuration} value={duration} onChange={setDuration} />
              </div>
            </EditorCard>

            {/* Description */}
            <EditorCard
              id="description"
              title="Job description"
              description={
                <>
                  {jobSections.length} {jobSections.length === 1 ? "section" : "sections"} · Drag to reorder.
                  Rough notes are fine: we tidy the formatting when you save.
                </>
              }
              action={
                <button
                  type="button"
                  data-tour="job-description-ai"
                  onClick={() => setShowAiBuilder((open) => !open)}
                  aria-expanded={showAiBuilder}
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#F0D98A] bg-[#FFF8E1] px-3.5 text-[13px] font-bold text-[#6B4700] hover:bg-[#FFF1C2]"
                >
                  <Sparkles className="h-4 w-4" />
                  {jobSections.length ? "Improve with AI" : "Write with AI"}
                </button>
              }
            >
              {showAiBuilder && (
                <JobDescriptionAIBuilder
                  jobTitle={title}
                  selectedSkills={selectedSkills}
                  companyName={companyData?.designation ?? ""}
                  companyBio={companyData?.headline ?? ""}
                  onGenerated={(generatedTitle, generatedSections) => {
                    if (generatedTitle) setTitle(generatedTitle);
                    setJobSections(generatedSections);
                  }}
                  onClose={() => setShowAiBuilder(false)}
                />
              )}
              <div data-tour="job-sections">
                <JobSectionsManager sections={jobSections} onSectionsChange={setJobSections} />
              </div>
            </EditorCard>

            {/* Skills */}
            <section id="skills" className={`${ui.card} scroll-mt-24`} data-tour="job-skills">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className={ui.cardTitle}>Required skills</h2>
                <span className="text-[13px] font-semibold text-[#6B665A]">
                  {selectedSkills.length} {selectedSkills.length === 1 ? "skill" : "skills"}
                </span>
              </div>
              <p className={`${ui.cardDescription} mb-[18px]`}>
                We match talent to your job on these. Specific tools and languages match better than
                soft skills (highlighted).
              </p>
              <SkillsField value={selectedSkills} onChange={setSelectedSkills} disabled={isReadOnlyReviewState} />
            </section>

            {/* Who can respond */}
            <EditorCard
              id="applicants"
              title="Who can respond"
              description={
                lockedOnChain ? (
                  <span className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5" />
                    Set when the job was published and fixed on-chain.
                  </span>
                ) : (
                  "Choose how you want to hire. Each service adds a GoodHive fee."
                )
              }
            >
              <div className="grid gap-3 md:grid-cols-3" data-tour="job-services">
                {createJobServices.map((service) => {
                  const on = jobServices[service.value];
                  const locked = service.value === "talent" || lockedOnChain;
                  return (
                    <label
                      key={service.value}
                      className={`flex flex-col gap-1.5 rounded-xl p-4 transition ${
                        on ? "border-2 border-[#E0A800] bg-[#FFFBEB]" : "border border-[#E8E5DC] bg-white"
                      } ${locked ? "cursor-default" : "cursor-pointer hover:border-[#BDB7A6]"} ${
                        !on && lockedOnChain ? "opacity-60" : ""
                      }`}
                    >
                      <span className="flex w-full items-center justify-between">
                        <span className="text-[15px] font-extrabold text-[#1C1B17]">
                          {SERVICE_COPY[service.value].name}
                        </span>
                        <input
                          type="checkbox"
                          name={service.value}
                          checked={on}
                          disabled={locked}
                          onChange={onJobServicesChange}
                          className="sr-only"
                        />
                        <span
                          aria-hidden
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-xs font-extrabold ${
                            on ? "border-2 border-[#E0A800] bg-[#F5B800] text-[#1C1B17]" : "border-2 border-[#C9C3B2] bg-white"
                          }`}
                        >
                          {on ? "✓" : ""}
                        </span>
                      </span>
                      <span className="text-[13px] leading-[1.45] text-[#5F5A4E]">
                        {SERVICE_COPY[service.value].description}
                      </span>
                      <span className="text-[12px] font-bold text-[#8A5A00]">+{service.feePercentage}% fee</span>
                    </label>
                  );
                })}
              </div>
            </EditorCard>

            {/* Budget & payment */}
            <EditorCard
              id="budget"
              title="Budget & payment"
              description="Payments are held in a smart contract and released to the talent you hire."
            >
              <div className="grid gap-4 sm:grid-cols-2" data-tour="job-budget">
                <SelectField id="payment-model" label="Payment model" options={projectTypes} value={projectType} onChange={setProjectType} />
                <div>
                  <label htmlFor="budget-amount" className={ui.label}>
                    {isHourly ? "Hourly rate" : "Budget"}
                  </label>
                  <div className="relative">
                    <input
                      id="budget-amount"
                      name="budget"
                      type="number"
                      min="0"
                      required
                      value={budget}
                      onChange={onBudgetChange}
                      placeholder="0"
                      className={`${ui.field} pr-20 font-bold tabular-nums`}
                    />
                    <span className="pointer-events-none absolute right-3.5 top-[13px] text-[13px] font-bold text-[#6B665A]">
                      {currencyLabel}
                      {isHourly ? "/hr" : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-[#E8E5DC]" data-tour="job-commission">
                <button
                  type="button"
                  onClick={() => setIsCommissionExpanded(!isCommissionExpanded)}
                  aria-expanded={isCommissionExpanded}
                  className="flex w-full items-center justify-between bg-white px-4 py-3.5 hover:bg-[#FBFAF6]"
                >
                  <span className="text-sm font-bold">{isHourly ? "Total hourly cost" : "Total to fund"}</span>
                  <span className="flex items-center gap-2.5">
                    <span className="text-lg font-extrabold tabular-nums">
                      {budgetNumber > 0
                        ? `${formatMoney(totalToFund)} ${currencyLabel}${isHourly ? "/hr" : ""}`
                        : "–"}
                    </span>
                    <ChevronDown
                      className={`h-[18px] w-[18px] text-[#6B665A] transition-transform ${
                        isCommissionExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                </button>
                {isCommissionExpanded && (
                  <div className="flex flex-col gap-2 border-t border-[#EFEDE6] bg-[#FCFBF8] px-4 pb-3.5 pt-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#5F5A4E]">{isHourly ? "Talent rate" : "Talent budget"}</span>
                      <span className="font-bold tabular-nums">
                        {formatMoney(budgetNumber)} {currencyLabel}
                      </span>
                    </div>
                    {createJobServices
                      .filter((service) => jobServices[service.value])
                      .map((service) => (
                        <div key={service.value} className="flex justify-between">
                          <span className="text-[#5F5A4E]">
                            GoodHive {SERVICE_COPY[service.value].name.toLowerCase()} fee ({service.feePercentage}%)
                          </span>
                          <span className="font-bold tabular-nums">
                            {formatMoney((budgetNumber * service.feePercentage) / 100)} {currencyLabel}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2" data-tour="job-chain">
                <div>
                  <span className={ui.label}>Network</span>
                  <LockedValue>
                    {chains.find((c) => c.value === (selectedChain?.value ?? jobData?.chain))?.label ??
                      chains[0]?.label}
                  </LockedValue>
                </div>
                {lockedOnChain ? (
                  <div>
                    <span className={ui.label}>Currency</span>
                    <LockedValue>{currencyLabel}</LockedValue>
                  </div>
                ) : (
                  <SelectField
                    id="currency"
                    label="Currency"
                    options={currencyOptions}
                    value={selectedCurrency}
                    onChange={setSelectedCurrency}
                  />
                )}
              </div>
              <p className={ui.hint}>
                {lockedOnChain
                  ? "Network and currency are locked once a job is published on-chain."
                  : "Choose carefully: network and currency can't be changed after you publish."}
              </p>
              {!account && isDraftState && (
                <p className={`${ui.hint} flex items-start gap-2`}>
                  <Wallet className="mt-px h-3.5 w-3.5 shrink-0 text-[#8A5A00]" />
                  No wallet needed to save or submit. You&apos;ll connect one after approval.
                </p>
              )}
              {blockchainError && (
                <p className="mt-4 rounded-[10px] bg-[#FEF3F2] px-3.5 py-3 text-[13px] text-[#B42318]">
                  {blockchainError}
                </p>
              )}
            </EditorCard>
          </fieldset>
        </form>

        <div className="lg:col-span-2 xl:col-span-1">
          <EditorRail
            status={currentReviewStatus}
            checklist={checklist}
            totalFeePercent={feePercent}
            adminFeedback={jobData?.admin_feedback ?? null}
            isOnChain={isOnChain}
            blockchainJobId={isOnChain ? currentBlockchainJobId : null}
            currency={currencyLabel}
            fundingGoal={!isHourly && budgetNumber > 0 ? totalToFund : null}
            busy={isBusy}
            onPublish={() => setShowBlockchainModal(true)}
            onManageFunds={(tab) => {
              setFundManagerTab(tab);
              onManageFundsClick();
            }}
            onUnpublish={() => void handleUnpublish()}
            onDelete={canDelete ? () => void handleCancelJob() : undefined}
          />
        </div>
      </div>

      {/* Publish + fund modal for approved jobs */}
      {showBlockchainModal && jobData?.id && (
        <BlockchainActivateModal
          isOpen={showBlockchainModal}
          job={{
            id: jobData.id,
            title: jobData.title ?? title,
            blockchainJobId: jobData.block_id ? Number(jobData.block_id) : null,
            chain: jobData.chain ?? null,
            paymentTokenAddress: jobData.payment_token_address ?? null,
            talentService: jobServices.talent,
            recruiterService: jobServices.recruiter,
            mentorService: jobServices.mentor,
          }}
          onClose={() => setShowBlockchainModal(false)}
          onActivated={() => {
            setShowBlockchainModal(false);
            if (onRefreshJobData) onRefreshJobData();
          }}
        />
      )}

      {showFundManager && currentBlockchainJobId && (
        <FundManager
          jobId={currentBlockchainJobId}
          databaseJobId={jobData.id}
          tokenAddress={fundManagerTokenAddress}
          jobChainId={jobChainId}
          jobChainLabel={jobChainLabel ?? undefined}
          initialTab={fundManagerTab}
          onClose={() => {
            setShowFundManager(false);
            if (onRefreshJobData) onRefreshJobData();
          }}
        />
      )}
      {confirmDialog}
    </div>
  );
};

