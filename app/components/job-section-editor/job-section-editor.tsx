"use client";

import { IJobSection } from "@/interfaces/job-offer";
import dynamic from "next/dynamic";
import React, { useState } from "react";
import { useConfirm } from "@/app/components/ConfirmDialog/ConfirmDialog";
import "react-quill/dist/quill.snow.css";
import "@/app/styles/job-sections.css";
import "./job-section-editor.css";

// Dynamically import React Quill to prevent server-side rendering issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Define Quill modules and formats for job sections
const quillModules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "bullet" }, { list: "ordered" }],
    ["link"],
  ],
};

interface JobSectionEditorProps {
  section: IJobSection;
  onUpdate: (section: IJobSection) => void;
  onDelete: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dragHandleProps?: any; // For drag and drop functionality
}

export const JobSectionEditor: React.FC<JobSectionEditorProps> = ({
  section,
  onUpdate,
  onDelete,
  isCollapsed,
  onToggleCollapse,
  dragHandleProps,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirm, confirmDialog] = useConfirm();

  const handleHeadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      ...section,
      heading: e.target.value,
    });
  };

  const handleContentChange = (content: string) => {
    onUpdate({
      ...section,
      content,
    });
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: section.heading?.trim()
        ? `Delete the "${section.heading.trim()}" section?`
        : "Delete this section?",
      description: "Its content is removed from the job description.",
      confirmLabel: "Delete section",
      tone: "danger",
    });
    if (confirmed) {
      setIsDeleting(true);
      onDelete();
    }
  };

  const plainText = section.content
    .replace(/<\/(p|li|h[1-6])>/g, " · ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/(\s*·\s*)+$/, "")
    .trim();
  const wordCount = plainText.split(/\s+/).filter((w) => w && w !== "·").length;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white ${
        isCollapsed ? "border-[#E8E5DC]" : "border-[#E0C766]"
      }`}
    >
      <div className="flex min-h-[56px] items-center gap-2.5 pl-1.5 pr-2">
        <button
          type="button"
          aria-label="Drag to reorder"
          {...dragHandleProps}
          className="inline-flex h-11 w-8 shrink-0 cursor-grab items-center justify-center text-[#A39E8F] active:cursor-grabbing"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="9" cy="6" r="1.6" />
            <circle cx="15" cy="6" r="1.6" />
            <circle cx="9" cy="12" r="1.6" />
            <circle cx="15" cy="12" r="1.6" />
            <circle cx="9" cy="18" r="1.6" />
            <circle cx="15" cy="18" r="1.6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!isCollapsed}
          className="flex h-[52px] min-w-0 flex-1 items-center gap-3.5 rounded-lg px-2 text-left hover:bg-[#FBFAF6]"
        >
          <span className="whitespace-nowrap text-[15px] font-bold text-[#1C1B17]">
            {section.heading?.trim() || "Untitled section"}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#7A7566]">
            {isCollapsed ? plainText : ""}
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B665A"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
            className={`shrink-0 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <div className="border-t border-[#EFEDE6] bg-[#FCFBF8] px-5 pb-5 pt-[18px]">
          <label
            htmlFor={`section-heading-${section.sort_order}`}
            className="mb-1.5 block text-[13px] font-bold text-[#3A372F]"
          >
            Section title
          </label>
          <input
            id={`section-heading-${section.sort_order}`}
            type="text"
            value={section.heading}
            onChange={handleHeadingChange}
            placeholder="e.g. About the role, Requirements, Benefits"
            maxLength={255}
            className="mb-4 box-border h-11 w-full rounded-[10px] border border-[#DCD8CC] bg-white px-3.5 text-[15px] font-medium text-[#1C1B17] outline-none hover:border-[#BDB7A6] focus:border-[#E0A800] focus:ring-[3px] focus:ring-[#F5B800]/25"
          />
          <span className="mb-1.5 block text-[13px] font-bold text-[#3A372F]">Content</span>
          <ReactQuill
            theme="snow"
            modules={quillModules}
            value={section.content}
            onChange={handleContentChange}
            placeholder="Describe this part of the job…"
            className="job-editor-quill"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[12.5px] text-[#6B665A]">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="h-9 text-[13px] font-semibold text-[#B42318] hover:underline disabled:opacity-50"
            >
              Remove section
            </button>
          </div>
        </div>
      )}
      {confirmDialog}
    </div>
  );
};

export default JobSectionEditor;