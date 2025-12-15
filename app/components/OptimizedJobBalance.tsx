"use client";

import React, { useEffect, useState } from "react";
import { getJobBalance } from "@/lib/contracts/jobManager";
import { getTokenInfo, formatTokenBalance } from "@/lib/contracts/erc20";

interface OptimizedJobBalanceProps {
  jobId?: string; // UUID string
  blockId?: number;
  currency?: string;
  className?: string;
  amount?: number; // Database amount (fallback if blockchain fails)
}

export const OptimizedJobBalance: React.FC<OptimizedJobBalanceProps> = ({
  jobId,
  blockId,
  currency = "",
  className = "",
  amount,
}) => {
  const [blockchainBalance, setBlockchainBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Prefer on-chain job id (blockId) if present, otherwise use database jobId
  const chainJobId = blockId ? blockId.toString() : jobId;

  useEffect(() => {
    const fetchBlockchainBalance = async () => {
      // Only fetch if we have a jobId (UUID)
      if (!chainJobId) {
        return;
      }

      setIsLoading(true);
      try {
        // Fetch balance from blockchain using the job UUID
        const balanceWei = await getJobBalance(chainJobId);

        // Get token info to determine decimals
        let decimals = 6; // Default to 6 for USDC
        if (currency && currency.startsWith("0x")) {
          try {
            const tokenInfo = await getTokenInfo(currency);
            decimals = tokenInfo.decimals;
          } catch (err) {
            console.warn("Failed to get token info, using default decimals:", err);
          }
        }

        // Format the balance
        const formatted = formatTokenBalance(balanceWei, decimals);
        setBlockchainBalance(formatted);
      } catch (err) {
        console.error("Failed to fetch blockchain balance:", err);
        // Keep blockchainBalance as null to fall back to database amount
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlockchainBalance();
  }, [chainJobId, currency]);

  // Use blockchain balance if available, otherwise fall back to database amount
  const hasOnChainBalance = blockchainBalance !== null;
  const displayAmount = hasOnChainBalance
    ? parseFloat(blockchainBalance).toFixed(2)
    : (typeof amount === 'number' && !isNaN(amount) ? amount.toFixed(2) : "0.00");

  // Function to get proper currency symbol from contract address or currency string
  const getCurrencySymbol = (currencyInput: string): string => {
    // If it's a contract address (starts with 0x), return a default symbol
    if (currencyInput.startsWith("0x")) {
      return "USDC"; // Default to USDC for contract addresses
    }

    // Handle common currency cases
    switch (currencyInput.toUpperCase()) {
      case "EUR":
      case "€":
        return "€";
      case "USD":
      case "$":
        return "$";
      case "USDC":
        return "USDC";
      case "ETH":
        return "ETH";
      case "BTC":
        return "BTC";
      default:
        return "USDC"; // Default fallback to USDC instead of ETH
    }
  };

  const displayCurrency = getCurrencySymbol(currency);
  const balanceLabel = hasOnChainBalance ? "On-chain fund" : "Budget";
  const balanceTitle = hasOnChainBalance
    ? "On-chain escrow balance"
    : "Budget fallback (on-chain balance unavailable)";

  const badgeColors = hasOnChainBalance
    ? {
        container: "from-green-50/60 to-emerald-100/60 border-emerald-200 text-emerald-700",
        dot: "bg-emerald-500",
      }
    : {
        container: "from-gray-50/70 to-slate-100/80 border-gray-200 text-gray-700",
        dot: "bg-gray-400",
      };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className={`flex items-center gap-1.5 bg-gradient-to-r border rounded-lg px-2 py-0.5 shadow-sm backdrop-blur-sm ${badgeColors.container}`}
      >
        {isLoading ? (
          <>
            <div className={`w-1.5 h-1.5 ${badgeColors.dot} rounded-full animate-pulse`}></div>
            <span className={`text-xs font-medium ${hasOnChainBalance ? "text-emerald-700" : "text-[#FFC905]"}`}>
              Loading...
            </span>
          </>
        ) : (
          <>
            <div
              className={`flex items-center gap-1 ${hasOnChainBalance ? "text-emerald-700" : "text-[#d97706]"}`}
              title={balanceTitle}
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3 5 6v5c0 4.5 3.1 8.6 7 10 3.9-1.4 7-5.5 7-10V6l-7-3z" />
                <circle cx="12" cy="11" r="3" />
                <path d="M12 9v2l1 1" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-tight">
                {balanceLabel}
              </span>
            </div>
            <span
              className={`text-xs font-semibold ${hasOnChainBalance ? "text-emerald-700" : "text-[#FFC905]"}`}
              title={balanceTitle}
            >
              {displayAmount} {displayCurrency}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default OptimizedJobBalance;
