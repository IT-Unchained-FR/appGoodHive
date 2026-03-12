"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import type { IJobSection } from "@/interfaces/job-offer";

interface JobDescriptionAIBuilderProps {
  jobTitle: string;
  selectedSkills: string[];
  companyName?: string;
  companyBio?: string;
  onGenerated: (title: string, sections: IJobSection[]) => void;
}

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "startup", label: "Startup" },
  { value: "friendly", label: "Friendly" },
] as const;

const SENIORITY_OPTIONS = ["Junior", "Mid-level", "Senior", "Lead", "Principal"] as const;
const WORK_TYPES = ["Remote", "Hybrid", "On-site"] as const;

export function JobDescriptionAIBuilder({
  jobTitle,
  selectedSkills,
  companyName,
  companyBio,
  onGenerated,
}: JobDescriptionAIBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [seniority, setSeniority] = useState<string>("Mid-level");
  const [workType, setWorkType] = useState<string>("Remote");
  const [budget, setBudget] = useState("");
  const [tone, setTone] = useState<string>("professional");

  const handleGenerate = async () => {
    if (!jobTitle.trim()) {
      toast.error("Please enter a job title first");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-job-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobTitle,
          seniority,
          skills: selectedSkills.join(", "),
          workType,
          budget,
          tone,
          companyName: companyName ?? "",
          companyBio: companyBio ?? "",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to generate");
      }
      onGenerated(json.data.title, json.data.sections);
      toast.success("Job description generated! Review and edit as needed.");
      setIsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate job description");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-amber-900">AI Job Description Builder</p>
            <p className="text-xs text-amber-700">Generate a professional JD from a few inputs</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-amber-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-600" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-4 border-t border-amber-200">
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Seniority */}
            <div>
              <label className="text-xs font-medium text-amber-900 block mb-1.5">Seniority Level</label>
              <select
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              >
                {SENIORITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Work type */}
            <div>
              <label className="text-xs font-medium text-amber-900 block mb-1.5">Work Type</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              >
                {WORK_TYPES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="text-xs font-medium text-amber-900 block mb-1.5">
              Budget / Salary Range <span className="text-amber-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 5000 USDC/month or $80k–$100k"
              className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Tone */}
          <div>
            <label className="text-xs font-medium text-amber-900 block mb-1.5">Tone</label>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold border transition ${
                    tone === t.value
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-amber-200 bg-white text-amber-800 hover:border-amber-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skills preview */}
          {selectedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedSkills.slice(0, 8).map((s) => (
                <span key={s} className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs text-amber-900 font-medium">
                  {s}
                </span>
              ))}
              {selectedSkills.length > 8 && (
                <span className="text-xs text-amber-600">+{selectedSkills.length - 8} more</span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={isGenerating || !jobTitle.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Job Description
              </>
            )}
          </button>
          <p className="text-xs text-amber-600 text-center">
            AI will fill the sections below. You can edit them freely after.
          </p>
        </div>
      )}
    </div>
  );
}
