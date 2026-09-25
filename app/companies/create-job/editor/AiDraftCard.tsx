"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

import { jobEditorUi } from "./ui";

// The proposal endpoint rejects shorter input.
const MIN_LENGTH = 50;
const MAX_LENGTH = 5000;

/**
 * Create-mode starter: a few lines about the role become a drafted title,
 * sections, skills and budget, via the same endpoint the old AI modal used.
 */
export function AiDraftCard({
  onGenerated,
  onDismiss,
}: {
  onGenerated: (data: unknown) => void;
  onDismiss: () => void;
}) {
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const length = text.trim().length;

  const draft = async () => {
    if (length < MIN_LENGTH) {
      toast.error(`Add a little more detail (at least ${MIN_LENGTH} characters).`);
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch("/api/companies/ai-generate-job-from-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobProposal: text.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.status !== "success" || !result.data) {
        throw new Error(result.message || "Couldn't draft the job. Please try again.");
      }
      onGenerated(result.data);
      onDismiss();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't draft the job.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section
      data-tour="create-with-ai"
      className="flex flex-col gap-3.5 rounded-2xl bg-[#1C1B17] px-5 py-6 text-white sm:px-7"
    >
      <div className="flex items-center gap-2.5">
        <Sparkles className="h-5 w-5 text-[#F5B800]" />
        <h2 className="m-0 text-lg font-extrabold">Start with a few lines</h2>
      </div>
      <p className="m-0 text-sm leading-normal text-[#D6D2C6]">
        Describe the role in your own words. We&apos;ll draft the title,
        description and skills. You review everything before submitting.
      </p>
      <label htmlFor="ai-draft" className="sr-only">
        Describe the role
      </label>
      <textarea
        id="ai-draft"
        rows={3}
        maxLength={MAX_LENGTH}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isGenerating}
        placeholder="e.g. Remote intern to help build our Ethereum app from Figma designs, 3+ months, $2k fixed"
        className={`${jobEditorUi.field} h-auto resize-y border-[#3E3C34] bg-[#2A2923] py-3 leading-relaxed text-white placeholder:text-[#8F8A7C] hover:border-[#5A574C]`}
      />
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => void draft()}
          disabled={isGenerating}
          className={jobEditorUi.btnPrimary}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Drafting…
            </>
          ) : (
            "Draft my job post"
          )}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={isGenerating}
          className="h-11 px-3.5 text-sm font-semibold text-[#D6D2C6] hover:text-white"
        >
          I&apos;ll write it myself
        </button>
        <span className="ml-auto text-xs tabular-nums text-[#8F8A7C]">
          {length < MIN_LENGTH ? `${MIN_LENGTH - length} more characters` : `${length} characters`}
        </span>
      </div>
    </section>
  );
}
