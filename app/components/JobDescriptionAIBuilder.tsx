"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";
import type { IJobSection } from "@/interfaces/job-offer";

interface JobDescriptionAIBuilderProps {
  jobTitle: string;
  selectedSkills: string[];
  companyName?: string;
  companyBio?: string;
  onGenerated: (title: string, sections: IJobSection[]) => void;
  /** Called after a successful generation, and by the panel's close button. */
  onClose: () => void;
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
  onClose,
}: JobDescriptionAIBuilderProps) {
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
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate job description");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mb-5 rounded-xl border border-[#F0D98A] bg-[#FFF8E1] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[15px] font-extrabold text-[#4A3500]">
            <Sparkles className="h-4 w-4 text-[#E0A800]" />
            Write the description with AI
          </p>
          <p className="mt-1 text-[13px] text-[#6B4700]">
            Uses your title{selectedSkills.length ? " and skills" : ""}. Replaces the sections below; you can edit everything after.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B4700] hover:bg-[#F0D98A]/50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ai-seniority" className="mb-1.5 block text-[13px] font-bold text-[#3A372F]">Seniority</label>
          <select id="ai-seniority" value={seniority} onChange={(e) => setSeniority(e.target.value)} className="box-border h-11 w-full rounded-[10px] border border-[#DCD8CC] bg-white px-3.5 text-[15px] font-medium text-[#1C1B17] outline-none hover:border-[#BDB7A6] focus:border-[#E0A800] focus:ring-[3px] focus:ring-[#F5B800]/25">
            {SENIORITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ai-work-type" className="mb-1.5 block text-[13px] font-bold text-[#3A372F]">Work type</label>
          <select id="ai-work-type" value={workType} onChange={(e) => setWorkType(e.target.value)} className="box-border h-11 w-full rounded-[10px] border border-[#DCD8CC] bg-white px-3.5 text-[15px] font-medium text-[#1C1B17] outline-none hover:border-[#BDB7A6] focus:border-[#E0A800] focus:ring-[3px] focus:ring-[#F5B800]/25">
            {WORK_TYPES.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="ai-budget" className="mb-1.5 block text-[13px] font-bold text-[#3A372F]">
          Budget or salary range <span className="font-normal text-[#6B665A]">(optional)</span>
        </label>
        <input
          id="ai-budget"
          type="text"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="e.g. 5000 USDC/month"
          className="box-border h-11 w-full rounded-[10px] border border-[#DCD8CC] bg-white px-3.5 text-[15px] font-medium text-[#1C1B17] outline-none hover:border-[#BDB7A6] focus:border-[#E0A800] focus:ring-[3px] focus:ring-[#F5B800]/25"
        />
      </div>

      <div className="mt-4">
        <span className="mb-1.5 block text-[13px] font-bold text-[#3A372F]">Tone</span>
        <div className="flex gap-2">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTone(t.value)}
              aria-pressed={tone === t.value}
              className={`h-10 flex-1 rounded-[10px] border text-[13px] font-bold transition ${
                tone === t.value
                  ? "border-[#E0A800] bg-[#F5B800] text-[#1C1B17]"
                  : "border-[#DCD8CC] bg-white text-[#3A372F] hover:border-[#BDB7A6]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleGenerate()}
        disabled={isGenerating || !jobTitle.trim()}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#1C1B17] text-sm font-bold text-white transition hover:bg-[#3A372F] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Writing…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {jobTitle.trim() ? "Generate description" : "Add a job title first"}
          </>
        )}
      </button>
    </div>
  );
}
