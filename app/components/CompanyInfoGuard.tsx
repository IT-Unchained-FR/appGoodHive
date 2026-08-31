"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useMemo, useState, useRef, useEffect, type ReactNode } from "react";
import { useConnectModal } from "thirdweb/react";
import { connectModalOptions, supportedWallets } from "@/lib/auth/walletConfig";
import { thirdwebClient } from "@/clients";
import { activeChain } from "@/config/chains";
import { ReturnUrlManager } from "@/app/utils/returnUrlManager";
import { useConfidentialLockCopy } from "@/app/hooks/useConfidentialLock";

type TooltipPlacement = "top" | "bottom" | "left" | "right";

interface CompanyInfoGuardProps {
  value?: string;
  seed?: string;
  isVisible: boolean;
  placeholder?: string;
  allowTooltip?: boolean;
  className?: string;
  textClassName?: string;
  sizeClassName?: string;
  blurAmount?: string;
  placement?: TooltipPlacement;
  compact?: boolean;
  children?: ReactNode;
  redirectUrl?: string; // URL to redirect to after authentication
  /** What is hidden behind the blur — drives the tooltip copy. */
  subject?: "company" | "talent";
}

const classNames = (...values: Array<string | false | undefined>) =>
  values.filter(Boolean).join(" ");

export const CompanyInfoGuard = ({
  value,
  seed = "company",
  isVisible,
  placeholder,
  allowTooltip = true,
  className,
  textClassName,
  sizeClassName,
  blurAmount = "blur-[10px]",
  placement = "bottom",
  compact = false,
  children,
  redirectUrl,
  subject = "company",
}: CompanyInfoGuardProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { connect } = useConnectModal();
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lockCopy = useConfidentialLockCopy({
    seed: seed || value || "company",
    subject,
  });
  const needsWalletConnection = lockCopy.reason === "connect";

  const resolvedPlaceholder = useMemo(
    () => placeholder || lockCopy.blurredLabel,
    [placeholder, lockCopy.blurredLabel],
  );

  const displayValue = isVisible ? value || resolvedPlaceholder : resolvedPlaceholder;

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
      // Store destination URL for redirect after auth
      if (typeof window !== 'undefined') {
        const urlToStore = redirectUrl || window.location.pathname;
        ReturnUrlManager.setProtectedRouteAccess(urlToStore);
      }

      connect({
        client: thirdwebClient,
        wallets: supportedWallets,
        chain: activeChain,
        ...connectModalOptions,
      });
    }
  };

  const handleMouseEnter = () => {
    if (!allowTooltip) {
      return;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    if (!allowTooltip) {
      return;
    }
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

  // An absolutely positioned tooltip shrink-to-fits, so multi-line copy needs an
  // explicit width or it collapses into a tall one-word column.
  const tooltipBase =
    "absolute z-30 overflow-hidden rounded-2xl bg-slate-900/95 text-left text-white shadow-[0_24px_48px_-16px_rgba(15,23,42,0.55)] ring-1 ring-white/10 backdrop-blur-md transition-all duration-150";

  const tooltipSizing = compact ? "w-[244px] p-3.5" : "w-[268px] p-4";

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
            aria-label={
              isVisible
                ? value
                : subject === "talent"
                  ? "Talent hidden"
                  : "Company hidden"
            }
            style={!isVisible ? {
              filter: "brightness(1.15)",
              letterSpacing: "0.5px",
            } : undefined}
          >
            {displayValue}
          </span>
        </span>
      )}

      {!isVisible && allowTooltip && (
        <div
          className={classNames(
            tooltipBase,
            tooltipPosition,
            tooltipSizing,
            tooltipVisibility,
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Soft amber glow so the panel reads as part of the Hive palette. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl"
          />

          <div className="relative flex flex-col gap-3 whitespace-normal">
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300 ring-1 ring-inset ring-amber-300/25">
                <LockKeyhole className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-5 text-white">
                  {lockCopy.title}
                </p>
                <p className="mt-1 text-[11.5px] leading-[1.45] text-slate-300">
                  {lockCopy.description}
                </p>
              </div>
            </div>

            {needsWalletConnection ? (
              <button
                type="button"
                onClick={handleConnectWallet}
                className="group/cta inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-[11.5px] font-semibold text-slate-900 transition hover:bg-amber-300"
              >
                {lockCopy.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5" />
              </button>
            ) : lockCopy.ctaHref ? (
              <Link
                href={lockCopy.ctaHref}
                className="group/cta inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-[11.5px] font-semibold text-slate-900 transition hover:bg-amber-300"
              >
                {lockCopy.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5" />
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
