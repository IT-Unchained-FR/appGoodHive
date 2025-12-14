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

  useEffect(() => {
    const fetchBlockchainBalance = async () => {
      // Only fetch if we have a jobId (UUID)
      if (!jobId) {
        return;
      }

      setIsLoading(true);
      try {
        // Fetch balance from blockchain using the job UUID
        const balanceWei = await getJobBalance(jobId);

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
  }, [jobId, currency]);

  // Use blockchain balance if available, otherwise fall back to database amount
  const displayAmount = blockchainBalance !== null
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

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#FFC905]/15 to-amber-200/60 border border-[#FFC905]/30 rounded-lg px-2 py-0.5 shadow-sm backdrop-blur-sm">
        {isLoading ? (
          <>
            <div className="w-1.5 h-1.5 bg-[#FFC905] rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-[#FFC905]">
              Loading...
            </span>
          </>
        ) : (
          <>
            <div className="w-1.5 h-1.5 bg-[#FFC905] rounded-full"></div>
            <span className="text-xs font-medium text-[#FFC905]" title={blockchainBalance !== null ? "On-chain escrow balance" : "Database budget"}>
              {displayAmount} {displayCurrency}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default OptimizedJobBalance;