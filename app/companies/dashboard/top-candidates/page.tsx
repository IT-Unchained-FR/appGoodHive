"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  Star,
  UserRoundCheck,
  X,
} from "lucide-react";

import { AvailabilityBadge } from "@/app/components/AvailabilityBadge";
import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";
import { formatRateRange } from "@/app/utils/format-rate-range";

interface CompanyJob {
  id: string;
  title: string | null;
}

interface TopCandidate {
  userId: string;
  firstName: string;
  lastName: string;
  title: string;
  description: string;
  skills: string[];
  city: string | null;
  country: string | null;
  imageUrl: string | null;
  minRate: number | null;
  maxRate: number | null;
  currency: string;
  availabilityStatus: string;
  lastActive: string | null;
  score: number | null;
  reasons: string[];
  gaps: string[];
  unavailable: boolean;
  message?: string;
  cached: boolean;
}

interface ContextResponse {
  success: boolean;
  data?: { jobs: CompanyJob[] };
  error?: string;
}

interface CandidatesResponse {
  success: boolean;
  data?: {
    candidates: TopCandidate[];
    scoredCount: number;
    job: { id: string; title: string | null };
  };
  error?: string;
}

function getDisplayName(candidate: TopCandidate) {
  return [candidate.firstName, candidate.lastName].filter(Boolean).join(" ").trim() || "GoodHive Talent";
}

function getScoreClasses(score: number | null) {
  if (score === null) return "bg-slate-100 text-slate-600 ring-slate-200";
  if (score >= 80) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (score >= 60) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-orange-50 text-orange-700 ring-orange-200";
}

function truncateText(value: string, maxLength: number) {
  const text = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

export default function TopCandidatesPage() {
  const router = useRouter();
  const currentUserId = useCurrentUserId();
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [candidates, setCandidates] = useState<TopCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<TopCandidate | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isContacting, setIsContacting] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [lastScoredCount, setLastScoredCount] = useState<number | null>(null);

  useEffect(() => {
    const loadContext = async () => {
      setIsLoadingContext(true);
      try {
        const response = await fetch("/api/companies/top-candidates", { cache: "no-store" });
        const payload = (await response.json()) as ContextResponse;

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to load top candidates");
        }

        setJobs(payload.data.jobs);
        setSelectedJobId(payload.data.jobs[0]?.id ?? "");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load top candidates");
      } finally {
        setIsLoadingContext(false);
      }
    };

    void loadContext();
  }, []);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  useEffect(() => {
    if (!selectedCandidate) return;
    const defaultMessage =
      `Hi ${getDisplayName(selectedCandidate)}, I found your profile through GoodHive's AI top candidates for ${selectedJob?.title ?? "our role"} and would like to connect.`;
    setContactMessage(defaultMessage);
  }, [selectedCandidate, selectedJob?.title]);

  const generateCandidates = async (refresh = false) => {
    if (!selectedJobId || isGenerating) return;

    setIsGenerating(true);
    setCandidates([]);
    setLastScoredCount(null);
    try {
      const response = await fetch("/api/companies/top-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: selectedJobId, refresh }),
      });
      const payload = (await response.json()) as CandidatesResponse;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Failed to generate top candidates");
      }

      setCandidates(payload.data.candidates);
      setLastScoredCount(payload.data.scoredCount);
      toast.success("Top candidates generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate top candidates");
    } finally {
      setIsGenerating(false);
    }
  };

  const contactCandidate = async () => {
    if (!selectedCandidate || !currentUserId || isContacting) return;
    const message = contactMessage.trim();

    if (message.length < 30) {
      toast.error("Please write at least 30 characters.");
      return;
    }

    setIsContacting(true);
    try {
      const threadResponse = await fetch("/api/messenger/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyUserId: currentUserId,
          talentUserId: selectedCandidate.userId,
          threadType: "direct",
          actorUserId: currentUserId,
        }),
      });

      if (!threadResponse.ok) {
        throw new Error("Failed to initialize conversation");
      }

      const threadPayload = (await threadResponse.json()) as { thread?: { id?: string } };
      const threadId = threadPayload.thread?.id;
      if (!threadId) {
        throw new Error("Conversation thread not found");
      }

      const messageResponse = await fetch(`/api/messenger/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUserId: currentUserId,
          messageText: message,
        }),
      });

      if (!messageResponse.ok) {
        throw new Error("Failed to send message");
      }

      await fetch("/api/contact-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyUserId: currentUserId,
          talentUserId: selectedCandidate.userId,
          jobId: selectedJobId,
          threadId,
          actorType: "company",
          contactType: "direct",
          messagePreview: message,
        }),
      });

      toast.success("Message sent");
      router.push(`/messages?thread=${threadId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to contact candidate");
    } finally {
      setIsContacting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
              <Sparkles className="h-4 w-4" />
              AI Top Candidates
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Find the strongest fits for your role
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Select a published job and GoodHive will rank approved available talents using the existing AI match score.
            </p>
          </div>

          <button
            type="button"
            onClick={() => generateCandidates(candidates.length > 0)}
            disabled={!selectedJobId || isGenerating || isLoadingContext}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-amber-500 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : candidates.length > 0 ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <UserRoundCheck className="h-4 w-4" />
            )}
            {candidates.length > 0 ? "Refresh Picks" : "Generate Top 5"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <BriefcaseBusiness className="h-4 w-4 text-amber-600" />
              Published job
            </span>
            <select
              value={selectedJobId}
              onChange={(event) => {
                setSelectedJobId(event.target.value);
                setCandidates([]);
                setLastScoredCount(null);
              }}
              disabled={jobs.length === 0 || isLoadingContext}
              className="w-full rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">
                {isLoadingContext ? "Loading jobs..." : jobs.length > 0 ? "Select a job" : "No published jobs available"}
              </option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title ?? "Untitled job"}
                </option>
              ))}
            </select>
          </label>

          {lastScoredCount !== null && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Scored {lastScoredCount} available {lastScoredCount === 1 ? "talent" : "talents"}
            </div>
          )}
        </div>
      </div>

      {isLoadingContext ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState title="No published jobs yet" message="Publish a job before generating AI candidate picks." />
      ) : isGenerating ? (
        <div className="rounded-2xl border border-amber-200 bg-white p-10 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-500" />
          <h3 className="mt-4 text-lg font-semibold text-slate-950">Ranking available talent</h3>
          <p className="mt-2 text-sm text-slate-600">
            This can take a moment when fresh AI scores are needed.
          </p>
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState
          title="Ready to generate"
          message="Choose a published job and generate the top 5 candidates when you are ready."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-5 lg:grid-cols-3 sm:grid-cols-2">
          {candidates.map((candidate, index) => {
            const rateLabel = formatRateRange({
              minRate: candidate.minRate ?? undefined,
              maxRate: candidate.maxRate ?? undefined,
            });

            return (
              <button
                key={candidate.userId}
                type="button"
                onClick={() => setSelectedCandidate(candidate)}
                className="flex h-full flex-col rounded-2xl border border-amber-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-amber-100">
                      <Image
                        src={candidate.imageUrl || "/img/client-bee.png"}
                        alt={getDisplayName(candidate)}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {getDisplayName(candidate)}
                      </p>
                      <p className="truncate text-xs text-slate-500">{candidate.title}</p>
                    </div>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-sm font-bold text-amber-700">
                    {index + 1}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ring-1 ${getScoreClasses(candidate.score)}`}>
                    <Star className="h-3.5 w-3.5" />
                    {candidate.score === null ? "N/A" : `${candidate.score}%`}
                  </span>
                  <AvailabilityBadge status={candidate.availabilityStatus} />
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                  {truncateText(candidate.description, 180) || "No profile summary available."}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {candidate.skills.slice(0, 3).map((skill) => (
                    <span key={skill} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-4 text-xs text-slate-500">
                  {rateLabel ? `${candidate.currency} ${rateLabel}/hr` : candidate.country || "Remote-ready"}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                  Candidate Details
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-950">
                  {getDisplayName(selectedCandidate)}
                </h3>
                <p className="text-sm text-slate-500">{selectedCandidate.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close candidate details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="flex flex-wrap gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ring-1 ${getScoreClasses(selectedCandidate.score)}`}>
                  <Star className="h-4 w-4" />
                  {selectedCandidate.score === null ? "No AI score" : `${selectedCandidate.score}% AI match`}
                </span>
                <AvailabilityBadge status={selectedCandidate.availabilityStatus} />
              </div>

              <section>
                <h4 className="text-sm font-semibold text-slate-950">Why this candidate matches</h4>
                {selectedCandidate.reasons.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {selectedCandidate.reasons.map((reason) => (
                      <li key={reason} className="flex gap-2 text-sm leading-6 text-slate-600">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedCandidate.message ?? "AI did not return match reasons for this candidate."}
                  </p>
                )}
              </section>

              <section>
                <h4 className="text-sm font-semibold text-slate-950">Potential gaps</h4>
                {selectedCandidate.gaps.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {selectedCandidate.gaps.map((gap) => (
                      <li key={gap} className="flex gap-2 text-sm leading-6 text-slate-600">
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-amber-500" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No major gaps were returned by AI.</p>
                )}
              </section>

              <section>
                <label htmlFor="candidate-contact-message" className="text-sm font-semibold text-slate-950">
                  Contact message
                </label>
                <textarea
                  id="candidate-contact-message"
                  value={contactMessage}
                  onChange={(event) => setContactMessage(event.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                />
              </section>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={contactCandidate}
                  disabled={isContacting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-amber-500 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isContacting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Contact Candidate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <UserRoundCheck className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}
