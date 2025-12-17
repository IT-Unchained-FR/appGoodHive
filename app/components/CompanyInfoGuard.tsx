"use client";

import Link from "next/link";
import { useMemo, useState, useRef, useEffect, type ReactNode } from "react";
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
  "Connect Wallet to see",
  "Connect to view",
  "Connect to reveal",
  "Connect to see company",
  "Connect Wallet to view",
  "Connect Wallet to reveal",
  "Connect to see",
  "Connect Wallet here",
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
  blurAmount = "blur-[10px]",
  placement = "bottom",
  compact = false,
  children,
}: CompanyInfoGuardProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { connect } = useConnectModal();
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const sizeClass =
    sizeClassName || (compact ? "text-[11px] font-semibold" : "text-sm font-semibold");

  const blurMaskStyle = !isVisible
    ? {
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.95) 15%, rgba(0,0,0,0.95) 85%, transparent 100%)",
        maskImage:
          "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.95) 15%, rgba(0,0,0,0.95) 85%, transparent 100%)",
        WebkitBackdropFilter: "blur(10px)",
        backdropFilter: "blur(10px)",
      }
    : undefined;

  const tooltipBase =
    "absolute z-30 whitespace-nowrap rounded-xl bg-gradient-to-br from-amber-900 to-yellow-900 text-white text-left shadow-lg shadow-amber-300/40 transition-all duration-150 border border-amber-700/60";

  const tooltipPadding = compact ? "px-4 py-2.5 text-xs" : "px-3.5 py-3 text-xs";

  const tooltipVisibility = showTooltip
    ? "opacity-100 translate-y-0 pointer-events-auto"
    : "opacity-0 translate-y-1 pointer-events-none";

  return (
    <div
      className={classNames(
        "relative inline-flex items-center",
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children ?? (
        <span
          className={classNames(
            "inline-flex items-center gap-1",
            textClassName,
            !isVisible && `${blurAmount} text-amber-600 opacity-75`,
            sizeClass,
          )}
          style={blurMaskStyle}
        >
          <span
            aria-label={isVisible ? value : "Company hidden"}
            style={!isVisible ? {
              filter: "brightness(1.15)",
              letterSpacing: "0.5px",
            } : undefined}
          >
            {displayValue}
          </span>
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
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span
            className={classNames(
              "pointer-events-none absolute inline-block h-2.5 w-2.5 rotate-45 border border-amber-700/60 bg-gradient-to-br from-amber-900 to-yellow-900",
              placement === "top" && "left-1/2 bottom-[-6px] -translate-x-1/2",
              placement === "bottom" && "left-1/2 top-[-6px] -translate-x-1/2",
              placement === "left" && "right-[-6px] top-1/2 -translate-y-1/2",
              placement === "right" && "left-[-6px] top-1/2 -translate-y-1/2",
            )}
            aria-hidden
          />

          {compact ? (
            <div className="text-xs leading-tight">
              <button
                type="button"
                onClick={handleConnectWallet}
                className="font-semibold underline decoration-white/60 underline-offset-2 hover:decoration-white transition-all cursor-pointer"
              >
                Connect Wallet
              </button>
              <span> to see the company</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 font-semibold leading-none">
                <span>Connect to reveal</span>
              </div>
              <p className="text-[11px] leading-tight text-white/90">
                Connect your wallet to view this company.
              </p>
              <div className="flex gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  className="inline-flex items-center justify-center rounded-md bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-amber-700 shadow-sm transition hover:bg-white"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
