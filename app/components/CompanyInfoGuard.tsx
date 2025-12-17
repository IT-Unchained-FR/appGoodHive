"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
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
  children?: ReactNode;
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
  children,
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

  const sizeClass =
    sizeClassName || (compact ? "text-[11px] font-semibold" : "text-sm font-semibold");

  const blurMaskStyle = !isVisible
    ? {
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.9) 18%, rgba(0,0,0,0.9) 82%, transparent 100%)",
        maskImage:
          "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.9) 18%, rgba(0,0,0,0.9) 82%, transparent 100%)",
      }
    : undefined;

  const tooltipBase =
    "absolute z-30 whitespace-nowrap rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-200/60 transition-all duration-150 border border-indigo-100";

  const tooltipPadding = compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs";

  const tooltipVisibility = showTooltip
    ? "opacity-100 translate-y-0 pointer-events-auto"
    : "opacity-0 translate-y-1 pointer-events-none";

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
      {children ?? (
        <span
          className={classNames(
            "inline-flex items-center gap-1",
            textClassName,
            !isVisible && `${blurAmount} text-gray-500`,
            sizeClass,
          )}
          style={blurMaskStyle}
        >
          {!isVisible && <Lock className="w-3.5 h-3.5 text-amber-500" />}
          <span aria-label={isVisible ? value : "Company hidden"}>{displayValue}</span>
        </span>
      )}

      {!isVisible && (
        <div
          className={classNames(
            tooltipBase,
            tooltipPosition,
            tooltipPadding,
            tooltipVisibility,
          )}
        >
          <span
            className={classNames(
              "pointer-events-none absolute inline-block h-2.5 w-2.5 rotate-45 border border-indigo-100 bg-indigo-500",
              placement === "top" && "left-1/2 bottom-[-6px] -translate-x-1/2",
              placement === "bottom" && "left-1/2 top-[-6px] -translate-x-1/2",
              placement === "left" && "right-[-6px] top-1/2 -translate-y-1/2",
              placement === "right" && "left-[-6px] top-1/2 -translate-y-1/2",
            )}
            aria-hidden
          />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 font-semibold leading-none">
              <Lock className="w-3.5 h-3.5 text-white/90" />
              <span>Sign in to reveal</span>
            </div>
            <p className="text-[11px] leading-tight text-white/90">
              Create an account or connect your wallet to view this company.
            </p>
            <div className="flex gap-1.5 pt-0.5">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 shadow-sm transition hover:bg-white"
              >
                Sign up
              </Link>
              <button
                type="button"
                onClick={handleConnectWallet}
                className="inline-flex items-center justify-center rounded-md border border-white/50 bg-indigo-400/70 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-indigo-400"
              >
                Connect wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
