"use client";

import { AlertTriangle, Check, Clock3, Lock, Zap } from "lucide-react";

import { useJobData } from "@/hooks/contracts/useJobManager";
import { REVIEW_TURNAROUND, type JobReviewStatus } from "@/lib/jobs/review";
import { jobEditorUi as ui } from "./ui";

export interface ChecklistItem {
  label: string;
  done: boolean;
}

interface EditorRailProps {
  status: JobReviewStatus;
  checklist: ChecklistItem[];
  totalFeePercent: number;
  adminFeedback: string | null;
  isOnChain: boolean;
  blockchainJobId: string | null;
  currency: string;
  /** Budget plus fees for a fixed-price job; null when it can't be known (hourly). */
  fundingGoal: number | null;
  busy: boolean;
  onPublish: () => void;
  onManageFunds: (tab: "add" | "withdraw") => void;
  onUnpublish: () => void;
  onDelete?: () => void;
}

const railCard = "rounded-2xl border border-[#E8E5DC] bg-white p-[22px]";
const railTitle = "text-[13px] font-bold text-[#6B665A]";

function formatAmount(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function EscrowCard({
  blockchainJobId,
  currency,
  fundingGoal,
  busy,
  onManageFunds,
}: Pick<EditorRailProps, "currency" | "fundingGoal" | "busy" | "onManageFunds"> & {
  blockchainJobId: string;
}) {
  const { balance } = useJobData(blockchainJobId);
  const amount = Number(String(balance ?? "0").replace(/,/g, "")) || 0;
  const percent = fundingGoal ? Math.min(100, (amount / fundingGoal) * 100) : null;
  const shortfall = fundingGoal ? Math.max(0, fundingGoal - amount) : 0;

  return (
    <div className={railCard} data-tour="job-escrow">
      <div className={railTitle}>Escrow balance</div>
      <div className="mt-1.5 text-[30px] font-extrabold tracking-[-0.5px] tabular-nums">
        {formatAmount(amount)} <span className="text-base text-[#6B665A]">{currency}</span>
      </div>
      {percent !== null && (
        <>
          <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-[#EFEDE6]">
            <div
              className="h-full min-w-[6px] rounded-full bg-[#E0A800]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[12.5px] font-semibold text-[#6B665A]">
            <span>{percent < 10 ? percent.toFixed(1) : Math.round(percent)}% funded</span>
            <span>Goal {formatAmount(fundingGoal ?? 0)}</span>
          </div>
        </>
      )}
      {shortfall > 0 && (
        <div className="mt-4 flex gap-2.5 rounded-[10px] bg-[#FFF6DB] px-3.5 py-3 text-[13px] leading-normal text-[#6B4700]">
          <AlertTriangle className="mt-px h-4 w-4 shrink-0" />
          <span>
            Add {formatAmount(shortfall)} {currency} to fully fund this job.
          </span>
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" disabled={busy} onClick={() => onManageFunds("add")} className={ui.btnDark}>
          Add funds
        </button>
        <button
          type="button"
          disabled={busy || amount <= 0}
          onClick={() => onManageFunds("withdraw")}
          className={ui.btnOutline}
        >
          Withdraw
        </button>
      </div>
    </div>
  );
}

export function EditorRail(props: EditorRailProps) {
  const { status, checklist, totalFeePercent, adminFeedback, isOnChain, busy } = props;
  const isDraft = status === "draft" || status === "rejected";
  const remaining = checklist.filter((item) => !item.done).length;

  return (
    <aside className="flex flex-col gap-4">
      {status === "rejected" && adminFeedback && (
        <div className="rounded-2xl border border-[#F2C9C4] bg-[#FEF3F2] p-[22px] text-[13.5px] leading-normal text-[#7A271A]">
          <div className="mb-1.5 font-extrabold">Changes requested</div>
          {adminFeedback}
        </div>
      )}

      {isDraft && (
        <div className={railCard}>
          <div className={`${railTitle} mb-3.5`}>Before you submit</div>
          <ul className="flex flex-col gap-3 text-sm text-[#3A372F]">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-2.5">
                {item.done ? (
                  <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#1F9D4C] text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : (
                  <span className="h-[18px] w-[18px] rounded-full border-[1.5px] border-[#C9C3B2]" />
                )}
                <span className={item.done ? "text-[#6B665A]" : ""}>{item.label}</span>
              </li>
            ))}
          </ul>
          {remaining === 0 && (
            <p className="mt-4 text-[13px] font-semibold text-[#146C35]">
              Ready to submit for review.
            </p>
          )}
        </div>
      )}

      {status === "pending_review" && (
        <div className={railCard}>
          <div className={`${railTitle} flex items-center gap-2`}>
            <Clock3 className="h-4 w-4" />
            In review
          </div>
          <p className="mt-2 text-[13.5px] leading-normal text-[#3A372F]">
            The GoodHive team is checking that the description, skills, budget
            and services are clear and complete. This usually takes{" "}
            {REVIEW_TURNAROUND}. We&apos;ll email you when it&apos;s approved.
          </p>
          <p className="mt-3 flex items-center gap-2 text-[12.5px] text-[#6B665A]">
            <Lock className="h-3.5 w-3.5" />
            Editing is locked while we review.
          </p>
        </div>
      )}

      {status === "approved" && (
        <div className="rounded-2xl border border-[#F0D98A] bg-[#FFF8E1] p-[22px]">
          <div className="text-[13px] font-extrabold text-[#4A3500]">Approved: one step to go live</div>
          <p className="mt-2 text-[13.5px] leading-normal text-[#4A3500]">
            {isOnChain
              ? "Your job is on the blockchain. Add a provision fund to its escrow to make it live."
              : "Publish your job on the blockchain, then fund its escrow to make it live. You'll need your wallet."}
          </p>
          <button type="button" onClick={props.onPublish} disabled={busy} className={`${ui.btnPrimary} mt-4 w-full`}>
            <Zap className="h-4 w-4" />
            {isOnChain ? "Add provision fund" : "Publish to blockchain"}
          </button>
        </div>
      )}

      {isOnChain && props.blockchainJobId && (status === "active" || status === "closed") && (
        <EscrowCard
          blockchainJobId={props.blockchainJobId}
          currency={props.currency}
          fundingGoal={status === "active" ? props.fundingGoal : null}
          busy={busy}
          onManageFunds={props.onManageFunds}
        />
      )}

      {status === "active" && (
        <div className={railCard}>
          <div className={`${railTitle} mb-3`}>What you can change</div>
          <div className="flex flex-col gap-2.5 text-[13.5px] text-[#3A372F]">
            <div className="flex items-start gap-2.5">
              <span className="font-extrabold text-[#1F9D4C]">✓</span>
              <span>Title, description, skills and budget. Talent sees edits as soon as you save.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6B665A]" />
              <span>Network, currency and who can respond are fixed on-chain.</span>
            </div>
          </div>
        </div>
      )}

      {(status === "active" || status === "closed") && (
        <div className={railCard}>
          <div className={railTitle}>Visibility</div>
          <p className="mb-3.5 mt-2 text-[13.5px] leading-normal text-[#3A372F]">
            {status === "active"
              ? "This job is live and accepting applications."
              : "This job is closed. Talent can't find or apply to it."}
          </p>
          {status === "active" && (
            <button type="button" onClick={props.onUnpublish} disabled={busy} className={ui.btnDanger}>
              Unpublish job
            </button>
          )}
        </div>
      )}

      {(isDraft || status === "approved") && (
        <div className="rounded-2xl border border-[#F0D98A] bg-[#FFF8E1] p-[22px] text-[13.5px] leading-[1.55] text-[#4A3500]">
          <div className="mb-1.5 font-extrabold">How funding works</div>
          After approval you publish the job on the blockchain and fund its
          smart contract with your budget plus the {totalFeePercent}% GoodHive
          fee. You can add or withdraw funds anytime from this page.
        </div>
      )}

      {props.onDelete && (
        <button
          type="button"
          onClick={props.onDelete}
          disabled={busy}
          className="self-start px-1 text-[13px] font-semibold text-[#B42318] hover:underline disabled:opacity-50"
        >
          Delete this {status === "draft" ? "draft" : "job"}
        </button>
      )}
    </aside>
  );
}
