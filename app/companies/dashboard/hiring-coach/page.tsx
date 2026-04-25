"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bot,
  CheckCircle2,
  Clipboard,
  FileText,
  HelpCircle,
  Loader2,
  Send,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import toast from "react-hot-toast";

type CoachTab = "job-post" | "interview" | "summary";

interface HiringCoachJob {
  id: string;
  title: string;
  applicationCount: number;
  reviewStatus: string | null;
  published: boolean;
}

interface HiringCoachApplication {
  id: number;
  jobId: string;
  applicantName: string;
  applicantHeadline: string;
  status: string;
}

interface HiringCoachContext {
  company: {
    name: string;
    headline: string;
    location: string;
  };
  jobs: HiringCoachJob[];
  applications: HiringCoachApplication[];
}

interface JobPostResult {
  title: string;
  overview: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  qualityNotes: string[];
}

interface InterviewResult {
  technical: string[];
  behavioral: string[];
  roleFit: string[];
  evaluationCriteria: string[];
}

interface SummaryResult {
  strengths: string[];
  gaps: string[];
  fitSummary: string;
  suggestedNextStep: string;
  interviewFocusAreas: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const TABS: Array<{
  id: CoachTab;
  label: string;
  description: string;
  icon: typeof FileText;
}> = [
  {
    id: "job-post",
    label: "Improve Job Post",
    description: "Rewrite roles into clearer, stronger candidate-facing posts.",
    icon: FileText,
  },
  {
    id: "interview",
    label: "Interview Questions",
    description: "Generate practical questions and scorecard criteria.",
    icon: HelpCircle,
  },
  {
    id: "summary",
    label: "Candidate Summary",
    description: "Summarize applicant strengths, gaps, and next steps.",
    icon: UserRoundCheck,
  },
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatList(title: string, items: string[]) {
  if (items.length === 0) return "";
  return `${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
}

function outputToText(result: JobPostResult | InterviewResult | SummaryResult | null) {
  if (!result) return "";
  if ("overview" in result) {
    return [
      result.title,
      result.overview,
      formatList("Responsibilities", result.responsibilities),
      formatList("Requirements", result.requirements),
      formatList("Nice to Have", result.niceToHave),
      formatList("Benefits", result.benefits),
      formatList("Quality Notes", result.qualityNotes),
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if ("technical" in result) {
    return [
      formatList("Technical", result.technical),
      formatList("Behavioral", result.behavioral),
      formatList("Role Fit", result.roleFit),
      formatList("Evaluation Criteria", result.evaluationCriteria),
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return [
    result.fitSummary,
    `Suggested next step: ${result.suggestedNextStep}`,
    formatList("Strengths", result.strengths),
    formatList("Gaps", result.gaps),
    formatList("Interview Focus Areas", result.interviewFocusAreas),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function SectionList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function CompanyHiringCoachPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<CoachTab>("job-post");
  const [context, setContext] = useState<HiringCoachContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [draftText, setDraftText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobPostResult, setJobPostResult] = useState<JobPostResult | null>(null);
  const [interviewResult, setInterviewResult] = useState<InterviewResult | null>(null);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);

  useEffect(() => {
    const jobId = searchParams.get("jobId") ?? "";
    const applicationId = searchParams.get("applicationId") ?? "";
    setSelectedJobId(jobId);
    setSelectedApplicationId(applicationId);
    if (applicationId) {
      setActiveTab("summary");
    }
  }, [searchParams]);

  useEffect(() => {
    const loadContext = async () => {
      setIsLoadingContext(true);
      try {
        const response = await fetch("/api/companies/hiring-coach/context", {
          cache: "no-store",
        });
        const payload = (await response.json()) as ApiResponse<HiringCoachContext>;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to load Hiring Coach");
        }
        setContext(payload.data);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load Hiring Coach"));
      } finally {
        setIsLoadingContext(false);
      }
    };

    void loadContext();
  }, []);

  const jobs = context?.jobs ?? [];
  const applicationsForSelectedJob = useMemo(() => {
    if (!context || !selectedJobId) return [];
    return context.applications.filter((application) => application.jobId === selectedJobId);
  }, [context, selectedJobId]);

  useEffect(() => {
    if (isLoadingContext || !context || !selectedApplicationId || !selectedJobId) return;

    if (
      !applicationsForSelectedJob.some((application) => String(application.id) === selectedApplicationId)
    ) {
      setSelectedApplicationId("");
    }
  }, [applicationsForSelectedJob, context, isLoadingContext, selectedApplicationId, selectedJobId]);

  const currentResult =
    activeTab === "job-post"
      ? jobPostResult
      : activeTab === "interview"
        ? interviewResult
        : summaryResult;

  const canGenerate =
    activeTab === "job-post"
      ? Boolean(selectedJobId || draftText.trim().length >= 20)
      : activeTab === "interview"
        ? Boolean(selectedJobId)
        : Boolean(selectedJobId && selectedApplicationId);

  const handleGenerate = async () => {
    if (!canGenerate || isGenerating) return;
    setIsGenerating(true);

    try {
      if (activeTab === "job-post") {
        const response = await fetch("/api/companies/hiring-coach/job-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: selectedJobId || undefined,
            draftText,
          }),
        });
        const payload = (await response.json()) as ApiResponse<JobPostResult>;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to improve job post");
        }
        setJobPostResult(payload.data);
      } else if (activeTab === "interview") {
        const response = await fetch("/api/companies/hiring-coach/interview-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: selectedJobId,
            applicationId: selectedApplicationId || undefined,
          }),
        });
        const payload = (await response.json()) as ApiResponse<InterviewResult>;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to generate interview questions");
        }
        setInterviewResult(payload.data);
      } else {
        const response = await fetch("/api/companies/hiring-coach/candidate-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: selectedJobId,
            applicationId: selectedApplicationId,
          }),
        });
        const payload = (await response.json()) as ApiResponse<SummaryResult>;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to summarize candidate");
        }
        setSummaryResult(payload.data);
      }

      toast.success("Hiring Coach generated a draft");
    } catch (error) {
      toast.error(getErrorMessage(error, "Hiring Coach failed"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    const text = outputToText(currentResult);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Unable to copy");
    }
  };

  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-[#fff7df] via-white to-[#fff1c7] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
              <Sparkles className="h-4 w-4" />
              Company Hiring Coach
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              AI hiring support for every role
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Improve job posts, prepare structured interviews, and review applicants with context from your GoodHive company workspace.
            </p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">
              {context?.company.name ?? "Company workspace"}
            </p>
            <p>{jobs.length} job{jobs.length === 1 ? "" : "s"} available</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0 ${
                    isActive ? "bg-amber-50" : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                      isActive ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{tab.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{tab.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-semibold text-slate-900">{activeTabMeta.label}</h2>
            </div>

            {isLoadingContext ? (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading company context...
              </div>
            ) : jobs.length === 0 && activeTab !== "job-post" ? (
              <div className="rounded-2xl bg-amber-50 px-4 py-5 text-sm leading-6 text-amber-800">
                Create a job first to generate interview questions or candidate summaries.
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Job {activeTab === "job-post" ? "(optional)" : ""}
                  </span>
                  <select
                    value={selectedJobId}
                    onChange={(event) => setSelectedJobId(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="">
                      {activeTab === "job-post" ? "Use pasted draft only" : "Select a job"}
                    </option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} ({job.applicationCount} applicant{job.applicationCount === 1 ? "" : "s"})
                      </option>
                    ))}
                  </select>
                </label>

                {(activeTab === "interview" || activeTab === "summary") && (
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Candidate {activeTab === "interview" ? "(optional)" : ""}
                    </span>
                    <select
                      value={selectedApplicationId}
                      onChange={(event) => setSelectedApplicationId(event.target.value)}
                      disabled={!selectedJobId || applicationsForSelectedJob.length === 0}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {applicationsForSelectedJob.length === 0
                          ? "No applicants for this job"
                          : activeTab === "interview"
                            ? "Role-only questions"
                            : "Select a candidate"}
                      </option>
                      {applicationsForSelectedJob.map((application) => (
                        <option key={application.id} value={application.id}>
                          {application.applicantName} ({application.status})
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {activeTab === "job-post" && (
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Draft text</span>
                    <textarea
                      value={draftText}
                      onChange={(event) => setDraftText(event.target.value)}
                      rows={8}
                      placeholder="Paste a rough role description, hiring notes, or requirements..."
                      className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                    <span className="mt-1 block text-xs text-slate-400">
                      Use this alone, or combine it with the selected job.
                    </span>
                  </label>
                )}

                <button
                  type="button"
                  onClick={() => void handleGenerate()}
                  disabled={!canGenerate || isGenerating || isLoadingContext}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isGenerating ? "Generating..." : "Generate"}
                </button>
              </div>
            )}
          </div>
        </aside>

        <section className="min-h-[560px] rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Generated Output</h2>
              <p className="mt-1 text-sm text-slate-500">
                Structured drafts stay here until you generate again or leave the page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!currentResult}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Clipboard className="h-4 w-4" />
              Copy
            </button>
          </div>

          <div className="p-6">
            {!currentResult ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  Ready when your hiring context is selected.
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Choose the tool on the left, select the relevant job or applicant, and Hiring Coach will return a structured draft.
                </p>
              </div>
            ) : "overview" in currentResult ? (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                    Improved Title
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">{currentResult.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{currentResult.overview}</p>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <SectionList title="Responsibilities" items={currentResult.responsibilities} />
                  <SectionList title="Requirements" items={currentResult.requirements} />
                  <SectionList title="Nice to Have" items={currentResult.niceToHave} />
                  <SectionList title="Benefits" items={currentResult.benefits} />
                </div>
                <SectionList title="Quality Notes" items={currentResult.qualityNotes} />
              </div>
            ) : "technical" in currentResult ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <SectionList title="Technical Questions" items={currentResult.technical} />
                <SectionList title="Behavioral Questions" items={currentResult.behavioral} />
                <SectionList title="Role-Fit Questions" items={currentResult.roleFit} />
                <SectionList title="Evaluation Criteria" items={currentResult.evaluationCriteria} />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                    Fit Summary
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{currentResult.fitSummary}</p>
                  <p className="mt-4 text-sm font-semibold text-slate-900">
                    Suggested next step: {currentResult.suggestedNextStep}
                  </p>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <SectionList title="Strengths" items={currentResult.strengths} />
                  <SectionList title="Gaps" items={currentResult.gaps} />
                </div>
                <SectionList title="Interview Focus Areas" items={currentResult.interviewFocusAreas} />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
