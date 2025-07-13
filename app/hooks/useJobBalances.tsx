"use client";

import { getJobBalanceWithToken } from "@/app/lib/blockchain/contracts/GoodhiveJobContract";
import { useCallback, useEffect, useState } from "react";

interface BalanceRequest {
  key: string;
  jobId?: number;
  blockId?: number;
}

interface BalanceResult {
  key: string;
  balance: number;
  tokenAddress: string;
  tokenName: string;
  error?: string;
  isLoading: boolean;
}

// Global cache for balance results
const balanceCache = new Map<string, { balance: number; tokenAddress: string; tokenName: string; timestamp: number; error?: string }>();
const CACHE_DURATION = 60000; // 1 minute cache
const BATCH_SIZE = 5; // Process 5 requests at a time
const BATCH_DELAY = 100; // 100ms delay between batches

export const useJobBalances = () => {
  const [balances, setBalances] = useState<Map<string, BalanceResult>>(new Map());
  const [requestQueue, setRequestQueue] = useState<BalanceRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate cache key for a request
  const getCacheKey = useCallback((jobId?: number, blockId?: number) => {
    return blockId ? `balance-${blockId}` : jobId ? `balance-${jobId}` : null;
  }, []);

  // Add a balance request to the queue
  const requestBalance = useCallback((jobId?: number, blockId?: number) => {
    const cacheKey = getCacheKey(jobId, blockId);
    if (!cacheKey) return;

    // Check if we already have this request
    const existingBalance = balances.get(cacheKey);
    if (existingBalance && !existingBalance.isLoading) return;

    // Check cache first
    const cached = balanceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setBalances(prev => new Map(prev).set(cacheKey, {
        key: cacheKey,
        balance: cached.balance,
        tokenAddress: cached.tokenAddress,
        tokenName: cached.tokenName,
        error: cached.error,
        isLoading: false,
      }));
      return;
    }

    // Mark as loading
    setBalances(prev => new Map(prev).set(cacheKey, {
      key: cacheKey,
      balance: 0,
      tokenAddress: "",
      tokenName: "Unknown",
      isLoading: true,
    }));

    // Add to queue if not already there
    setRequestQueue(prev => {
      const exists = prev.some(req => req.key === cacheKey);
      if (exists) return prev;
      return [...prev, { key: cacheKey, jobId, blockId }];
    });
  }, [balances, getCacheKey]);

  // Process the request queue in batches
  const processQueue = useCallback(async () => {
    if (isProcessing || requestQueue.length === 0) return;

    setIsProcessing(true);

    try {
      // Process requests in batches
      const batches = [];
      for (let i = 0; i < requestQueue.length; i += BATCH_SIZE) {
        batches.push(requestQueue.slice(i, i + BATCH_SIZE));
      }

      for (const batch of batches) {
        const promises = batch.map(async (request) => {
          try {
            const result = await getJobBalanceWithToken(
              request.blockId?.toString() || request.jobId?.toString() || "0"
            );

            // Cache the result
            balanceCache.set(request.key, {
              balance: result.balance,
              tokenAddress: result.tokenAddress,
              tokenName: result.tokenName,
              timestamp: Date.now(),
            });

            return {
              key: request.key,
              balance: result.balance,
              tokenAddress: result.tokenAddress,
              tokenName: result.tokenName,
              error: undefined,
              isLoading: false,
            };
          } catch (error) {
            const errorMessage = "Failed to fetch balance";

            // Cache the error
            balanceCache.set(request.key, {
              balance: 0,
              tokenAddress: "",
              tokenName: "Unknown",
              timestamp: Date.now(),
              error: errorMessage,
            });

            return {
              key: request.key,
              balance: 0,
              tokenAddress: "",
              tokenName: "Unknown",
              error: errorMessage,
              isLoading: false,
            };
          }
        });

        const results = await Promise.all(promises);

        // Update balances
        setBalances(prev => {
          const newMap = new Map(prev);
          results.forEach(result => {
            newMap.set(result.key, result);
          });
          return newMap;
        });

        // Small delay between batches to avoid overwhelming the blockchain
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      // Clear the queue
      setRequestQueue([]);
    } catch (error) {
      console.error("Error processing balance queue:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, requestQueue]);

  // Process queue when it changes
  useEffect(() => {
    if (requestQueue.length > 0 && !isProcessing) {
      const timer = setTimeout(processQueue, 50); // Small delay to batch requests
      return () => clearTimeout(timer);
    }
  }, [requestQueue, isProcessing, processQueue]);

  // Get balance for a specific job
  const getBalance = useCallback((jobId?: number, blockId?: number) => {
    const cacheKey = getCacheKey(jobId, blockId);
    if (!cacheKey) return null;

    return balances.get(cacheKey) || null;
  }, [balances, getCacheKey]);

  // Clear cache (useful for manual refresh)
  const clearCache = useCallback(() => {
    balanceCache.clear();
    setBalances(new Map());
  }, []);

  return {
    requestBalance,
    getBalance,
    clearCache,
    isProcessing,
  };
};

export default useJobBalances; 