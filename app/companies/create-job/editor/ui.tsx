import type { ReactNode } from "react";
import { Lock } from "lucide-react";

import type { JobReviewStatus } from "@/lib/jobs/review";

// Tokens for the job editor (create + edit), from the "Job Editor Redesign"
// reference: warm neutrals, white 16px cards, amber accent.
export const jobEditorUi = {
  page: "bg-[#F7F6F2] text-[#1C1B17]",
  card: "rounded-2xl border border-[#E8E5DC] bg-white p-5 sm:p-7",
  cardTitle: "m-0 text-lg font-extrabold",
  cardDescription: "mt-1 text-sm text-[#6B665A]",
  label: "mb-1.5 block text-[13px] font-bold text-[#3A372F]",
  hint: "mt-1.5 text-[12.5px] leading-[1.45] text-[#6B665A]",
  field:
    "box-border h-11 w-full rounded-[10px] border border-[#DCD8CC] bg-white px-3.5 text-[15px] font-medium text-[#1C1B17] outline-none transition placeholder:text-[#8F8A7C] hover:border-[#BDB7A6] focus:border-[#E0A800] focus:ring-[3px] focus:ring-[#F5B800]/25 disabled:cursor-not-allowed disabled:bg-[#F3F1EA] disabled:text-[#6B665A]",
  btnPrimary:
    "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#F5B800] px-5 text-sm font-bold text-[#1C1B17] transition hover:bg-[#E0A800] disabled:cursor-not-allowed disabled:bg-[#EFEDE6] disabled:text-[#8A8474]",
  btnDark:
    "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#1C1B17] px-4 text-sm font-bold text-white transition hover:bg-[#3A372F] disabled:cursor-not-allowed disabled:opacity-50",
  btnOutline:
    "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#DCD8CC] bg-white px-4 text-sm font-bold text-[#1C1B17] transition hover:border-[#BDB7A6] disabled:cursor-not-allowed disabled:opacity-50",
  btnDanger:
    "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#F2C9C4] bg-white px-3.5 text-sm font-bold text-[#B42318] transition hover:bg-[#FEF3F2] disabled:cursor-not-allowed disabled:opacity-50",
  btnGhost:
    "inline-flex items-center gap-1.5 bg-transparent text-sm font-semibold hover:underline disabled:cursor-not-allowed disabled:opacity-50",
};

export const hexClip = "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)";

export function EditorCard({
  id,
  title,
  description,
  action,
  children,
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`${jobEditorUi.card} scroll-mt-24`}>
      <div className="mb-5 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className={jobEditorUi.cardTitle}>{title}</h2>
          {description && <p className={jobEditorUi.cardDescription}>{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/** Read-only value shown in place of an input once it's fixed on-chain. */
export function LockedValue({ children }: { children: ReactNode }) {
  return (
    <div className="box-border flex h-11 items-center gap-2.5 rounded-[10px] border border-[#E8E5DC] bg-[#F3F1EA] px-3.5 text-[15px] font-semibold text-[#3A372F]">
      <Lock className="h-[15px] w-[15px] shrink-0 text-[#6B665A]" />
      {children}
    </div>
  );
}

const STATUS_PILL: Record<JobReviewStatus, { label: string; className: string; dot?: string }> = {
  draft: { label: "Draft", className: "bg-[#EFEDE6] text-[#4A463C]" },
  pending_review: { label: "In review", className: "bg-[#FFF6DB] text-[#6B4700]", dot: "bg-[#E0A800]" },
  approved: { label: "Approved", className: "bg-[#E8F1FD] text-[#1D4E89]", dot: "bg-[#3B82F6]" },
  rejected: { label: "Changes requested", className: "bg-[#FEF3F2] text-[#B42318]", dot: "bg-[#B42318]" },
  active: { label: "Live", className: "bg-[#E7F6EC] text-[#146C35]", dot: "bg-[#1F9D4C]" },
  closed: { label: "Closed", className: "bg-[#EFEDE6] text-[#4A463C]" },
};

export function StatusPill({ status }: { status: JobReviewStatus }) {
  const meta = STATUS_PILL[status] ?? STATUS_PILL.draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}
    >
      {meta.dot && <span className={`h-[7px] w-[7px] rounded-full ${meta.dot}`} />}
      {meta.label}
    </span>
  );
}

export function SelectField<T extends { label: string; value: string }>({
  id,
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (option: T | null) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className={jobEditorUi.label}>
        {label}
      </label>
      <select
        id={id}
        value={value?.value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(options.find((o) => o.value === e.target.value) ?? null)}
        className={`${jobEditorUi.field} ${value ? "" : "text-[#8F8A7C]"}`}
      >
        {!value && <option value="">Select…</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
