"use client";
import "@/app/styles/rich-text.css";
import moment from "moment";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { Card } from "../../components/card";
import { MatchScoreBadge } from "@/app/components/MatchScoreBadge";

// TypeScript interface for the talent data
export interface TalentData {
  title: string;
  description: string;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  phoneCountryCode: string;
  skills: string[];
  email?: string;
  aboutWork: string;
  telegram?: string;
  minRate?: number;
  maxRate?: number;
  currency: string;
  imageUrl: string;
  walletAddress: string;
  freelancer: boolean;
  remote: boolean;
  availability: string | boolean;
  availability_status?: string;
  userId: string;
  last_active: string;
}

interface MatchScoreState {
  loading: boolean;
  score: number | null;
  reasons: string[];
  gaps: string[];
  unavailable: boolean;
  message?: string;
}

type MatchScoreMap = Record<string, MatchScoreState>;
type MatchScoreFetchResult =
  | { talentId: string; error: true }
  | {
      talentId: string;
      score: number | null;
      reasons: string[];
      gaps: string[];
      unavailable: boolean;
      message?: string;
      error: false;
    };

export default function TalentResult({
  talents,
  matchJobId,
}: {
  talents: TalentData[];
  matchJobId?: string | null;
}) {
  const [matchScores, setMatchScores] = useState<MatchScoreMap>({});

  useEffect(() => {
    // Check for potential data issues and notify user
    if (!Array.isArray(talents)) {
      toast.error("Error loading talent data. Please refresh the page.");
      return;
    }

    // Check for missing required fields
    const talentsWithIssues = talents.filter(talent =>
      !talent.userId || !talent.firstName || !talent.lastName
    );

    if (talentsWithIssues.length > 0) {
      console.warn("Some talents have missing data:", talentsWithIssues);
      toast.error("Some talent profiles may have incomplete information.");
    }
  }, [talents]);

  useEffect(() => {
    if (!matchJobId || talents.length === 0) {
      setMatchScores({});
      return;
    }

    const initialState: MatchScoreMap = {};
    for (const talent of talents) {
      if (!talent.userId) continue;
      initialState[talent.userId] = {
        loading: true,
        score: null,
        reasons: [],
        gaps: [],
        unavailable: false,
      };
    }
    setMatchScores(initialState);

    let isActive = true;

    const fetchMatchScores = async () => {
      const talentsWithUserId = talents.filter((talent) => Boolean(talent.userId));
      const results: PromiseSettledResult<MatchScoreFetchResult>[] = [];

      for (let index = 0; index < talentsWithUserId.length; index += 5) {
        const chunk = talentsWithUserId.slice(index, index + 5);
        const chunkResults = await Promise.allSettled(
          chunk.map(async (talent): Promise<MatchScoreFetchResult> => {
            const talentId = talent.userId as string;
            try {
              const response = await fetch("/api/ai/match-score", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  jobId: matchJobId,
                  talentId,
                }),
              });

              if (!response.ok) {
                return {
                  talentId,
                  score: null,
                  reasons: [],
                  gaps: [],
                  unavailable: true,
                  message:
                    "AI match analysis is temporarily unavailable. Please try again shortly.",
                  error: false,
                };
              }

              const payload = await response.json();
              const data = payload?.data as
                | {
                    score?: number | null;
                    reasons?: string[];
                    gaps?: string[];
                    unavailable?: boolean;
                    message?: string;
                  }
                | undefined;
              const reasons = data?.reasons;
              const gaps = data?.gaps;

              return {
                talentId,
                score: typeof data?.score === "number" ? data.score : null,
                reasons: Array.isArray(reasons)
                  ? reasons.filter((reason): reason is string => typeof reason === "string")
                  : [],
                gaps: Array.isArray(gaps)
                  ? gaps.filter((gap): gap is string => typeof gap === "string")
                  : [],
                unavailable: data?.unavailable === true,
                message:
                  typeof data?.message === "string" ? data.message : undefined,
                error: false,
              };
            } catch {
              return {
                talentId,
                score: null,
                reasons: [],
                gaps: [],
                unavailable: true,
                message:
                  "AI match analysis is temporarily unavailable. Please try again shortly.",
                error: false,
              };
            }
          }),
        );

        results.push(...chunkResults);
      }

      if (!isActive) return;

      setMatchScores((previous) => {
        const next = { ...previous };

        for (const result of results) {
          if (result.status !== "fulfilled") continue;
          const value = result.value;
          if (value.error) {
            delete next[value.talentId];
            continue;
          }

          next[value.talentId] = {
            loading: false,
            score: value.score,
            reasons: value.reasons.slice(0, 3),
            gaps: value.gaps.slice(0, 3),
            unavailable: value.unavailable,
            message: value.message,
          };
        }

        return next;
      });
    };

    void fetchMatchScores();

    return () => {
      isActive = false;
    };
  }, [matchJobId, talents]);

  if (!Array.isArray(talents)) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Error loading talent data
        </h3>
        <p className="text-gray-500">Please refresh the page to try again.</p>
      </div>
    );
  }

  if (talents.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🐝</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No talents available
        </h3>
        <p className="text-gray-500">Check back later for new professionals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          <span className="text-sm text-gray-600">
            Showing {talents.length}{" "}
            {talents.length === 1 ? "professional" : "professionals"}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {moment().format("MMM DD, YYYY")}
        </div>
      </div>

      {/* Talent Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {talents.map((talent, index) => {
          try {
            const matchState = talent.userId ? matchScores[talent.userId] : undefined;
            return (
              <div key={talent.userId || `talent-${index}`} className="group relative">
                {matchJobId && matchState?.loading && (
                  <div className="mb-2">
                    <MatchScoreBadge score={null} loading />
                  </div>
                )}
                {matchJobId && matchState && !matchState.loading && (
                  <div className="mb-2">
                    <MatchScoreBadge
                      score={matchState.score}
                      reasons={matchState.reasons}
                      gaps={matchState.gaps}
                      unavailable={matchState.unavailable}
                      unavailableMessage={matchState.message}
                      showTooltip
                    />
                  </div>
                )}
                <Card
                  type="talent"
                  title={talent.title || "Professional"}
                  postedBy={`${talent.firstName || ""} ${talent.lastName || ""}`}
                  postedOn={
                    talent.last_active
                      ? typeof talent.last_active === 'string'
                        ? talent.last_active
                        : new Date(talent.last_active).toISOString()
                      : "Recently active"
                  }
                  image={talent.imageUrl || ""}
                  country={talent.country || ""}
                  city={talent.city || "Remote"}
                  rateMin={talent.minRate}
                  rateMax={talent.maxRate}
                  projectType="hourly"
                  currency={talent.currency || "€"}
                  description={talent.description || "No description available."}
                  skills={Array.isArray(talent.skills) ? talent.skills : []}
                  buttonText="Connect"
                  walletAddress={talent.walletAddress}
                  freelancer={talent.freelancer}
                  remote={talent.remote}
                  availability={
                    talent.availability_status === "immediately" ||
                    talent.availability === "Available" ||
                    talent.availability === true
                  }
                  uniqueId={talent.userId}
                />

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
              </div>
            );
          } catch (error) {
            console.error("Error rendering talent card:", error, talent);
            toast.error(`Error displaying profile for ${talent.firstName || 'professional'}`);
            return (
              <div key={talent.userId || `talent-error-${index}`} className="group relative">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-red-200">
                  <div className="text-center">
                    <div className="text-2xl mb-2">⚠️</div>
                    <h3 className="text-lg font-semibold text-gray-700">
                      Error loading profile
                    </h3>
                    <p className="text-sm text-gray-500">
                      Profile for {talent.firstName || 'professional'} could not be displayed
                    </p>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 pt-6 border-t border-amber-200/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white/50 rounded-lg p-4 border border-amber-200/20">
            <div className="text-2xl font-bold text-amber-600">
              {talents.length}
            </div>
            <div className="text-sm text-gray-600">Total Professionals</div>
          </div>
          <div className="bg-white/50 rounded-lg p-4 border border-amber-200/20">
            <div className="text-2xl font-bold text-orange-600">
              {talents.filter((talent) => talent.freelancer).length}
            </div>
            <div className="text-sm text-gray-600">Freelancers</div>
          </div>
          <div className="bg-white/50 rounded-lg p-4 border border-amber-200/20">
            <div className="text-2xl font-bold text-blue-600">
              {talents.filter((talent) => talent.remote).length}
            </div>
            <div className="text-sm text-gray-600">Remote Workers</div>
          </div>
          <div className="bg-white/50 rounded-lg p-4 border border-amber-200/20">
            <div className="text-2xl font-bold text-green-600">
              {talents.filter(
                (talent) =>
                  talent.availability_status === "immediately" ||
                  talent.availability === "Available" ||
                  talent.availability === true,
              ).length}
            </div>
            <div className="text-sm text-gray-600">Available Now</div>
          </div>
        </div>
      </div>
    </div>
  );
}
