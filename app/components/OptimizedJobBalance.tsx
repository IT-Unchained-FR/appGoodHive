"use client";

import { useJobBalances } from "@/app/hooks/useJobBalances";
import { useEffect } from "react";

// HoneyBee Loader Component
const HoneyBeeLoader: React.FC<{ size?: number }> = ({ size = 16 }) => {
  return (
    <div className="inline-flex items-center justify-center">
      <div
        className="animate-spin rounded-full border-2 border-[#FFC905]/20 border-t-[#FFC905] flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span
          className="animate-bounce text-[#FFC905]"
          style={{ fontSize: Math.max(size * 0.6, 8) }}
        >
          🐝
        </span>
      </div>
    </div>
  );
};

interface OptimizedJobBalanceProps {
  jobId?: number;
  blockId?: number;
  currency?: string; // Keep for backward compatibility, but will be overridden by token info
  className?: string;
}

export const OptimizedJobBalance: React.FC<OptimizedJobBalanceProps> = ({
  jobId,
  blockId,
  currency = "", // Fallback if no token info is available
  className = "",
}) => {
  const { requestBalance, getBalance } = useJobBalances();

  useEffect(() => {
    // Request balance when component mounts
    requestBalance(jobId, blockId);
  }, [jobId, blockId, requestBalance]);

  const balanceResult = getBalance(jobId, blockId);

  if (!jobId && !blockId) {
    return null;
  }

  if (!balanceResult) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#FFC905]/15 to-amber-200/60 border border-[#FFC905]/30 rounded-lg px-2.5 py-1 shadow-sm backdrop-blur-sm">
          {/* <HoneyBeeLoader size={12} /> */}
          <span className="text-xs font-medium text-[#FFC905]">Loading...</span>
        </div>
      </div>
    );
  }

  if (balanceResult.isLoading) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#FFC905]/15 to-amber-200/60 border border-[#FFC905]/30 rounded-lg px-2.5 py-1 shadow-sm backdrop-blur-sm">
          {/* <HoneyBeeLoader size={12} /> */}
          <span className="text-xs font-medium text-[#FFC905]">Loading...</span>
        </div>
      </div>
    );
  }

  if (balanceResult.error) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <div className="flex items-center gap-1.5 bg-red-50/90 border border-red-200/60 rounded-lg px-2.5 py-1 shadow-sm backdrop-blur-sm">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
          <span className="text-xs font-medium text-red-700">Error</span>
        </div>
      </div>
    );
  }

  if (balanceResult.balance === 0) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-gray-50/90 to-slate-50/90 border border-gray-200/60 rounded-lg px-2.5 py-1 shadow-sm backdrop-blur-sm">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          <span className="text-xs font-medium text-gray-600">
            No funds
          </span>
        </div>
      </div>
    );
  }

  // Use the token name from the balance result, fallback to currency prop
  const displayCurrency = balanceResult.tokenName || currency;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-50/90 to-green-50/90 border border-emerald-200/60 rounded-lg px-2.5 py-1 shadow-sm backdrop-blur-sm">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
        <span className="text-xs font-medium text-emerald-700">
          💰 {balanceResult.balance.toFixed(2)} {displayCurrency}
        </span>
      </div>
    </div>
  );
};

export default OptimizedJobBalance; 