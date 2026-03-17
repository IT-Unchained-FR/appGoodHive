"use client";

import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { CheckCircle2, CircleDashed, Loader2, Wallet, X } from "lucide-react";
import toast from "react-hot-toast";

import { useJobManager } from "@/hooks/contracts/useJobManager";
import {
  formatTokenBalance,
  getTokenBalance,
  getTokenInfo,
} from "@/lib/contracts/erc20";
import { getSupportedTokensForChain } from "@/lib/contracts/jobManager";
import { ACTIVE_CHAIN_ID } from "@/config/chains";

export interface BlockchainActivateJob {
  blockchainJobId: number | null;
  chain: string | null;
  id: string;
  mentorService: boolean;
  paymentTokenAddress: string | null;
  recruiterService: boolean;
  talentService: boolean;
  title: string;
}

interface BlockchainActivateModalProps {
  isOpen: boolean;
  job: BlockchainActivateJob;
  onActivated: (jobId: string) => void;
  onClose: () => void;
}

type Step = 1 | 2;

interface TokenOption {
  address: string;
  symbol: string;
}

function getTokenOptions(): TokenOption[] {
  const supported = getSupportedTokensForChain(ACTIVE_CHAIN_ID);
  return Object.entries(supported).map(([symbol, address]) => ({
    address,
    symbol,
  }));
}

export default function BlockchainActivateModal({
  isOpen,
  job,
  onActivated,
  onClose,
}: BlockchainActivateModalProps) {
  const account = useActiveAccount();
  const { createJob, addFunds, isLoading: isContractLoading } = useJobManager();

  const tokenOptions = getTokenOptions();

  // Derive initial step from job state — resume from wherever the company left off
  // payment_token_address being set means step 1 (blockchain publish) is complete
  const initialStep: Step = job.paymentTokenAddress !== null ? 2 : 1;

  const [step, setStep] = useState<Step>(initialStep);
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<string>(
    job.paymentTokenAddress ?? tokenOptions[0]?.address ?? "",
  );
  const [fundAmount, setFundAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [tokenDecimals, setTokenDecimals] = useState<number>(6);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step1Done, setStep1Done] = useState(job.paymentTokenAddress !== null);

  // Resolved blockchain job ID — may be set after step 1 completes mid-session
  const [resolvedBlockchainJobId, setResolvedBlockchainJobId] = useState<
    number | null
  >(job.blockchainJobId);

  // Load token info + wallet balance whenever token selection or account changes
  useEffect(() => {
    if (!selectedTokenAddress || !account) return;

    let cancelled = false;

    (async () => {
      try {
        const [info, rawBalance] = await Promise.all([
          getTokenInfo(selectedTokenAddress),
          getTokenBalance(selectedTokenAddress, account.address),
        ]);

        if (cancelled) return;

        setTokenSymbol(info.symbol);
        setTokenDecimals(info.decimals);
        setWalletBalance(formatTokenBalance(rawBalance, info.decimals));
      } catch {
        // Non-fatal — display will fall back to defaults
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedTokenAddress, account]);

  // Keep step in sync if job prop changes externally (e.g. parent re-renders)
  useEffect(() => {
    if (job.paymentTokenAddress !== null) {
      setStep(2);
      setStep1Done(true);
      if (job.blockchainJobId !== null) {
        setResolvedBlockchainJobId(job.blockchainJobId);
      }
      setSelectedTokenAddress(job.paymentTokenAddress);
    }
  }, [job.blockchainJobId, job.paymentTokenAddress]);

  if (!isOpen) return null;

  async function handlePublishToBlockchain() {
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!selectedTokenAddress) {
      toast.error("Please select a payment token");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await createJob({
        chain: job.chain ?? "polygon",
        databaseId: job.id,
        mentorService: job.mentorService,
        recruiterService: job.recruiterService,
        talentService: job.talentService,
        tokenAddress: selectedTokenAddress,
      });

      if (!result) {
        // createJob already showed a toast on failure
        return;
      }

      const { jobId: onChainJobId } = result;
      const blockchainJobIdNum = Number(onChainJobId);

      // Persist to DB
      const res = await fetch(`/api/jobs/${job.id}/blockchain-publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockchainJobId: blockchainJobIdNum,
          paymentTokenAddress: selectedTokenAddress,
        }),
      });

      const payload = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to save blockchain data");
      }

      setResolvedBlockchainJobId(blockchainJobIdNum);
      setStep1Done(true);
      setStep(2);
      toast.success("Job published to blockchain! Now add a provision fund.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to publish to blockchain";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleAddFundAndActivate() {
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!fundAmount || Number(fundAmount) <= 0) {
      toast.error("Please enter a valid fund amount");
      return;
    }

    if (resolvedBlockchainJobId === null) {
      toast.error("Blockchain job ID is missing. Please restart from step 1.");
      return;
    }

    setIsProcessing(true);

    try {
      const success = await addFunds(
        resolvedBlockchainJobId,
        fundAmount,
        selectedTokenAddress,
      );

      if (!success) {
        // addFunds already showed a toast on failure
        return;
      }

      // Activate the job in our DB
      const res = await fetch(`/api/jobs/${job.id}/activate`, {
        method: "POST",
      });

      const payload = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to activate job");
      }

      toast.success(`Job is now live! ${fundAmount} ${tokenSymbol} added as provision fund.`);
      onActivated(job.id);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to activate job";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }

  const isBusy = isProcessing || isContractLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isBusy ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-[28px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
              Blockchain Activation
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {job.title}
            </h2>
          </div>
          {!isBusy && (
            <button
              type="button"
              onClick={onClose}
              className="ml-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                step1Done
                  ? "bg-emerald-500 text-white"
                  : step === 1
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {step1Done ? <CheckCircle2 className="h-4 w-4" /> : "1"}
            </div>
            <span
              className={`text-sm font-medium ${
                step === 1 && !step1Done ? "text-slate-900" : "text-slate-500"
              }`}
            >
              Publish to Blockchain
            </span>
          </div>

          <div className="h-px flex-1 bg-slate-200" />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                step === 2
                  ? "bg-slate-900 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              2
            </div>
            <span
              className={`text-sm font-medium ${
                step === 2 ? "text-slate-900" : "text-slate-500"
              }`}
            >
              Add Provision Fund
            </span>
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-6">
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-slate-600">
                Publishing your job to the Polygon blockchain creates an
                on-chain escrow contract. Select the payment token your company
                will use to pay talents.
              </p>

              {/* Wallet status */}
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Wallet className="h-4 w-4 shrink-0 text-slate-500" />
                {account ? (
                  <span className="truncate font-mono text-xs text-slate-700">
                    {account.address}
                  </span>
                ) : (
                  <span className="text-sm text-rose-600">
                    No wallet connected — connect via the wallet button
                  </span>
                )}
              </div>

              {/* Token selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Payment Token
                </label>
                {tokenOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tokenOptions.map((token) => (
                      <button
                        key={token.address}
                        type="button"
                        disabled={isBusy}
                        onClick={() => setSelectedTokenAddress(token.address)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          selectedTokenAddress === token.address
                            ? "border-amber-500 bg-amber-500 text-white"
                            : "border-slate-300 text-slate-700 hover:border-slate-900"
                        }`}
                      >
                        {token.symbol}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-rose-600">
                    No supported tokens found for this chain. Check your network
                    configuration.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={isBusy || !account || !selectedTokenAddress}
                onClick={() => void handlePublishToBlockchain()}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  "Publish to Blockchain"
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-slate-600">
                Add a provision fund to your job&apos;s on-chain escrow. This
                fund will be used to pay the assigned talent upon mission
                completion.
              </p>

              {/* Wallet balance */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Wallet balance</span>
                  <span className="font-semibold text-slate-900">
                    {walletBalance} {tokenSymbol}
                  </span>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Fund Amount ({tokenSymbol || "tokens"})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    disabled={isBusy}
                    placeholder="e.g. 500"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => setFundAmount(walletBalance)}
                    className="shrink-0 rounded-full border border-slate-300 px-3 py-3 text-xs font-medium text-slate-600 transition hover:border-slate-900 hover:text-slate-900 disabled:opacity-50"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
                <CircleDashed className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Funds are held in a smart contract escrow on Polygon. You can
                  withdraw unused funds at any time from the job management
                  page.
                </span>
              </div>

              <button
                type="button"
                disabled={isBusy || !account || !fundAmount || Number(fundAmount) <= 0}
                onClick={() => void handleAddFundAndActivate()}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  "Fund & Activate Job"
                )}
              </button>

              {/* Back to step 1 if not yet confirmed on-chain */}
              {!step1Done && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setStep(1)}
                  className="w-full text-center text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600"
                >
                  Back to step 1
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
