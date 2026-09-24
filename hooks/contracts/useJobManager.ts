import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { parseEventLogs, prepareEvent, sendTransaction, waitForReceipt } from 'thirdweb';
import toast from 'react-hot-toast';

import {
  getJob,
  getJobBalance,
  getUserJobs,
  calculateTotalFees,
  isDatabaseIdUsed,
  getContractStats,
  prepareCreateJobCall,
  prepareAddFundsCall,
  prepareWithdrawFundsCall,
  prepareWithdrawAllFundsCall,
  preparePayFeesCall,
  JobCreationParams,
  JobData,
  JOB_MANAGER_CONTRACT_ADDRESS,
  JOB_MANAGER_ABI,
  normalizeDatabaseId,
  DatabaseIdentifier
} from '@/lib/contracts/jobManager';

import {
  getTokenBalance,
  getTokenAllowance,
  checkTokenPermissions,
  prepareApproveCall,
  getTokenInfo,
  formatTokenBalance,
  parseTokenAmount
} from '@/lib/contracts/erc20';

import { getFriendlyWalletError, UserFacingError } from '@/lib/contracts/walletErrors';

import { thirdwebClient } from '@/clients/thirdwebClient';
import { activeChain } from '@/config/chains';

export interface CreateJobResult {
  jobId: string;
  // null when the job was already on-chain and we only recovered its ID
  transactionHash: string | null;
  tokenAddress: string;
  alreadyPublished: boolean;
}

// Finds the on-chain job owned by `owner` that was created for `databaseId`.
// Returns null when no exact match exists — never guesses.
async function findOwnedJobByDatabaseId(
  owner: string,
  databaseId: bigint
): Promise<{ jobId: string; tokenAddress: string } | null> {
  const userJobIds = await getUserJobs(owner);

  for (const jobId of [...userJobIds].reverse()) {
    try {
      const jobData = await getJob(jobId);
      if (jobData && BigInt(jobData.databaseId) === databaseId) {
        return { jobId: jobId.toString(), tokenAddress: jobData.tokenAddress };
      }
    } catch (err) {
      console.warn(`Failed to load job ${jobId.toString()} while matching database ID`, err);
    }
  }

  return null;
}

// Hook for managing job contract interactions
export function useJobManager() {
  const account = useActiveAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Check if contract is configured
  const isContractConfigured = !!JOB_MANAGER_CONTRACT_ADDRESS;

  // Create a new job on the blockchain
  const createJob = useCallback(async (params: JobCreationParams): Promise<CreateJobResult | null> => {
    if (!account) {
      setError('Please connect your wallet');
      return null;
    }

    if (!isContractConfigured) {
      setError('Job contract not configured');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if database ID is already used
      const normalizedDatabaseId = normalizeDatabaseId(params.databaseId);

      // Already on-chain (e.g. a previous attempt whose DB save failed):
      // recover the existing job instead of failing or sending a new tx.
      const isUsed = await isDatabaseIdUsed(normalizedDatabaseId);
      if (isUsed) {
        const existing = await findOwnedJobByDatabaseId(account.address, normalizedDatabaseId);
        if (!existing) {
          throw new UserFacingError(
            'This job is already on the blockchain under a different wallet. Connect the wallet that published it and try again.'
          );
        }

        toast.success('Job is already on the blockchain. Picking up where you left off.');
        return {
          jobId: existing.jobId,
          transactionHash: null,
          tokenAddress: existing.tokenAddress,
          alreadyPublished: true,
        };
      }

      // Prepare the transaction (gas settings are now in prepareCreateJobCall)
      const transaction = prepareCreateJobCall(params);

      // Send transaction
      const { transactionHash } = await sendTransaction({
        transaction,
        account
      });

      // Wait for confirmation
      const receipt = await waitForReceipt({
        client: thirdwebClient,
        chain: transaction.chain ?? activeChain,
        transactionHash
      });

      let blockchainJobId: string | null = null;

      try {
        const events = parseEventLogs({
          logs: receipt.logs,
          events: [
            prepareEvent({
              signature:
                "event JobCreated(uint256 indexed jobId, uint256 indexed databaseId, address indexed owner, address tokenAddress, string chain)",
            }),
          ],
        });

        console.debug('JobCreated events', events);

        const jobCreatedEvent = events.find((event) => {
          if (!event.args || !('databaseId' in event.args)) {
            return false;
          }

          const eventDatabaseId = event.args.databaseId as bigint | string | number | undefined;

          if (eventDatabaseId === undefined) {
            return false;
          }

          try {
            const normalizedEventDatabaseId =
              typeof eventDatabaseId === 'bigint'
                ? eventDatabaseId
                : BigInt(eventDatabaseId as any);

            return normalizedEventDatabaseId === normalizedDatabaseId;
          } catch {
            return false;
          }
        });

        if (jobCreatedEvent && jobCreatedEvent.args && 'jobId' in jobCreatedEvent.args) {
          const eventJobId = jobCreatedEvent.args.jobId as bigint | string | number;
          const normalizedEventJobId =
            typeof eventJobId === 'bigint'
              ? eventJobId
              : BigInt(eventJobId as any);

          blockchainJobId = normalizedEventJobId.toString();
        }
      } catch (parseError) {
        console.warn('Failed to parse JobCreated event logs:', parseError);
      }

      if (!blockchainJobId) {
        try {
          const existing = await findOwnedJobByDatabaseId(account.address, normalizedDatabaseId);
          blockchainJobId = existing?.jobId ?? null;
        } catch (fallbackError) {
          console.warn('Failed to determine blockchain job ID via fallback', fallbackError);
        }
      }

      if (!blockchainJobId) {
        // The tx succeeded, so a retry will take the recovery path above
        // once the job is readable — no second transaction is sent.
        throw new UserFacingError(
          'Your job was created on the blockchain, but we could not confirm its ID yet. Please wait a moment and try again.'
        );
      }

      toast.success('Job created on blockchain!');

      return {
        jobId: blockchainJobId,
        transactionHash,
        tokenAddress: params.tokenAddress,
        alreadyPublished: false,
      };
    } catch (err: unknown) {
      console.error('Failed to create job:', err);
      const errorMessage = getFriendlyWalletError(
        err,
        "Couldn't publish the job to the blockchain. Please try again."
      );
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [account, isContractConfigured]);

  // Add funds to a job
  const addFunds = useCallback(async (
    jobId: DatabaseIdentifier,
    amount: string,
    tokenAddress: string
  ): Promise<boolean> => {
    if (!account) {
      setError('Please connect your wallet');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get token info
      const tokenInfo = await getTokenInfo(tokenAddress);
      const amountWei = parseTokenAmount(amount, tokenInfo.decimals);

      // Check token permissions
      const permissions = await checkTokenPermissions(
        tokenAddress,
        account.address,
        JOB_MANAGER_CONTRACT_ADDRESS,
        amountWei
      );

      if (!permissions.hasBalance) {
        throw new UserFacingError(`Insufficient ${tokenInfo.symbol} balance`);
      }

      // Approve if needed
      if (permissions.needsApproval) {
        const approvalToastId = toast.loading('Approving token spending...');

        try {
          const approvalTransaction = prepareApproveCall(
            tokenAddress,
            JOB_MANAGER_CONTRACT_ADDRESS,
            amountWei
          );

          const { transactionHash: approvalHash } = await sendTransaction({
            transaction: approvalTransaction,
            account
          });

          await waitForReceipt({
            client: thirdwebClient,
            chain: approvalTransaction.chain ?? activeChain,
            transactionHash: approvalHash
          });

          toast.success('Token spending approved!', { id: approvalToastId });
        } catch (approvalError) {
          // Clear the spinner on reject/failure; the outer catch shows the error.
          toast.dismiss(approvalToastId);
          throw approvalError;
        }
      }

      // Add funds
      const transaction = prepareAddFundsCall(jobId, amountWei);

      const { transactionHash } = await sendTransaction({
        transaction,
        account
      });

      await waitForReceipt({
        client: thirdwebClient,
        chain: transaction.chain ?? activeChain,
        transactionHash
      });

      toast.success('Funds added successfully!');
      return true;
    } catch (err: unknown) {
      console.error('Failed to add funds:', err);
      const errorMessage = getFriendlyWalletError(err, "Couldn't add funds. Please try again.");
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  // Withdraw funds from a job
  const withdrawFunds = useCallback(async (
    jobId: DatabaseIdentifier,
    amount: string,
    withdrawAll: boolean = false
  ): Promise<boolean> => {
    if (!account) {
      setError('Please connect your wallet');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      let transaction;

      if (withdrawAll) {
        transaction = prepareWithdrawAllFundsCall(jobId);
      } else {
        // For partial withdrawal, we need to get job info to determine token decimals
        const job = await getJob(jobId);
        const tokenInfo = await getTokenInfo(job.tokenAddress);
        const amountWei = parseTokenAmount(amount, tokenInfo.decimals);

        transaction = prepareWithdrawFundsCall(jobId, amountWei);
      }

      const { transactionHash } = await sendTransaction({
        transaction,
        account
      });

      await waitForReceipt({
        client: thirdwebClient,
        chain: transaction.chain ?? activeChain,
        transactionHash
      });

      toast.success(withdrawAll ? 'All funds withdrawn!' : 'Funds withdrawn successfully!');
      return true;
    } catch (err: unknown) {
      console.error('Failed to withdraw funds:', err);
      const errorMessage = getFriendlyWalletError(err, "Couldn't withdraw funds. Please try again.");
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  // Pay fees for a job
  const payFees = useCallback(async (
    jobId: DatabaseIdentifier,
    baseAmount: string
  ): Promise<boolean> => {
    if (!account) {
      setError('Please connect your wallet');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get job info to determine token
      const job = await getJob(jobId);
      const tokenInfo = await getTokenInfo(job.tokenAddress);
      const baseAmountWei = parseTokenAmount(baseAmount, tokenInfo.decimals);

      // Calculate total fees
      const totalFees = await calculateTotalFees(jobId, baseAmountWei);

      // Check if job has sufficient balance
      const jobBalance = await getJobBalance(jobId);
      if (jobBalance < totalFees) {
        throw new UserFacingError('Insufficient balance in job to pay fees');
      }

      const transaction = preparePayFeesCall(jobId, baseAmountWei);

      const { transactionHash } = await sendTransaction({
        transaction,
        account
      });

      await waitForReceipt({
        client: thirdwebClient,
        chain: transaction.chain ?? activeChain,
        transactionHash
      });

      toast.success('Fees paid successfully!');
      return true;
    } catch (err: unknown) {
      console.error('Failed to pay fees:', err);
      const errorMessage = getFriendlyWalletError(err, "Couldn't pay the fees. Please try again.");
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  return {
    // State
    isLoading,
    error,
    isContractConfigured,

    // Actions
    createJob,
    addFunds,
    withdrawFunds,
    payFees,

    // Utilities
    clearError: () => setError(null)
  };
}

// Hook for reading job data
export function useJobData(jobId: DatabaseIdentifier | null) {
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobData = useCallback(async () => {
    if (jobId === null || jobId === undefined || jobId === "") {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [job, jobBalance] = await Promise.all([
        getJob(jobId),
        getJobBalance(jobId)
      ]);

      setJobData(job);

      // Convert balance from wei to token units
      // Ensure jobBalance is a bigint
      const balanceBigInt = typeof jobBalance === 'bigint' ? jobBalance : BigInt(jobBalance);

      if (job && job.tokenAddress) {
        const tokenInfo = await getTokenInfo(job.tokenAddress);
        const formattedBalance = formatTokenBalance(balanceBigInt, tokenInfo.decimals);
        setBalance(formattedBalance);
      } else {
        // Fallback: assume 6 decimals for USDC/DAI
        const formattedBalance = formatTokenBalance(balanceBigInt, 6);
        setBalance(formattedBalance);
      }
    } catch (err: any) {
      console.error('Failed to fetch job data:', err);
      setError(err.message || 'Failed to fetch job data');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJobData();
  }, [fetchJobData]);

  return {
    jobData,
    balance,
    isLoading,
    error,
    refetch: fetchJobData
  };
}

// Hook for user's jobs
export function useUserJobs() {
  const account = useActiveAccount();
  const [jobIds, setJobIds] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserJobs = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    setError(null);

    try {
      const jobs = await getUserJobs(account.address);
      setJobIds(jobs);
    } catch (err: any) {
      console.error('Failed to fetch user jobs:', err);
      setError(err.message || 'Failed to fetch user jobs');
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  useEffect(() => {
    fetchUserJobs();
  }, [fetchUserJobs]);

  return {
    jobIds,
    isLoading,
    error,
    refetch: fetchUserJobs
  };
}

// Hook for contract statistics
export function useContractStats() {
  const [stats, setStats] = useState<{ totalJobs: bigint; activeJobs: bigint } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const contractStats = await getContractStats();
      setStats(contractStats);
    } catch (err: any) {
      console.error('Failed to fetch contract stats:', err);
      setError(err.message || 'Failed to fetch contract stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats
  };
}
