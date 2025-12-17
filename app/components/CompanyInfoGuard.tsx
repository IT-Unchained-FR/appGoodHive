"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Lock, Wallet2 } from "lucide-react";
import { useConnectModal } from "thirdweb/react";
import { connectModalOptions } from "@/lib/auth/walletConfig";

type TooltipPlacement = "top" | "bottom" | "left" | "right";

interface CompanyInfoGuardProps {
  value?: string;
  seed?: string;
  isVisible: boolean;
  className?: string;
  textClassName?: string;
  sizeClassName?: string;
  blurAmount?: string;
  placement?: TooltipPlacement;
  compact?: boolean;
}

const placeholders = [
  "Stealth Hive",
  "Hidden Colony",
  "Confidential Partner",
  "Mystery Studio",
  "Citrus Labs",
  "Aurora Works",
  "Nebula Partners",
  "Honeycomb Crew",
];

const classNames = (...values: Array<string | false | undefined>) =>
  values.filter(Boolean).join(" ");

const pickPlaceholder = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % placeholders.length;
  return placeholders[index];
};

export const CompanyInfoGuard = ({
  value,
  seed = "company",
  isVisible,
  className,
  textClassName,
  sizeClassName,
  blurAmount = "blur-[1.5px]",
  placement = "bottom",
  compact = false,
}: CompanyInfoGuardProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { connect } = useConnectModal();

  const placeholder = useMemo(
    () => pickPlaceholder(seed || value || "company"),
    [seed, value],
  );

  const displayValue = isVisible ? value || placeholder : placeholder;

  const tooltipPosition =
    placement === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : placement === "left"
        ? "right-full top-1/2 -translate-y-1/2 mr-2"
        : placement === "right"
          ? "left-full top-1/2 -translate-y-1/2 ml-2"
          : "top-full left-1/2 -translate-x-1/2 mt-2";

  const handleConnectWallet = () => {
    if (connect) {
      connect(connectModalOptions);
    }
  };

  const sizeClass = sizeClassName || (compact ? "text-xs" : "text-sm font-semibold");

  return (
    <div
      className={classNames(
        "relative inline-flex items-center",
        className,
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <span
        className={classNames(
          "inline-flex items-center gap-1",
          textClassName,
          !isVisible && `${blurAmount} text-gray-500`,
          sizeClass,
        )}
      >
        {!isVisible && <Lock className="w-3.5 h-3.5 text-amber-500" />}
        <span aria-label={isVisible ? value : "Company hidden"}>
          {displayValue}
        </span>
      </span>

      {!isVisible && (
        <div
          className={classNames(
            "absolute z-30 min-w-[200px] max-w-xs rounded-lg border border-amber-100 bg-white/95 px-3 py-2 shadow-lg transition-all duration-150 backdrop-blur-sm",
            tooltipPosition,
            showTooltip
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-1 pointer-events-none",
          )}
        >
          <span
            className={classNames(
              "pointer-events-none absolute inline-block h-2 w-2 rotate-45 border border-amber-100 bg-white/95",
              placement === "top" && "left-1/2 bottom-[-5px] -translate-x-1/2",
              placement === "bottom" && "left-1/2 top-[-5px] -translate-x-1/2",
              placement === "left" && "right-[-5px] top-1/2 -translate-y-1/2",
              placement === "right" && "left-[-5px] top-1/2 -translate-y-1/2",
            )}
            aria-hidden
          />
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-800">
            Sign in to reveal
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
            Create an account or connect your wallet to view the company.
          </p>
          <div className="mt-2 flex gap-1.5">
            <Link
              href="/auth/signup"
              className="inline-flex flex-1 items-center justify-center rounded-md bg-amber-500 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-amber-600"
            >
              Sign up
            </Link>
            <button
              type="button"
              onClick={handleConnectWallet}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
            >
              <Wallet2 className="w-3.5 h-3.5" />
              Connect wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
