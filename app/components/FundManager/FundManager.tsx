"use client";

import { ReactNode, useState, useEffect } from 'react';
import {
  useActiveAccount,
  useActiveWalletChain,
  useSwitchActiveWalletChain,
} from 'thirdweb/react';
import { toast } from 'react-hot-toast';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Compass,
  Loader2,
  Receipt,
  Wallet,
  X,
} from 'lucide-react';

import { useConfirm } from '@/app/components/ConfirmDialog/ConfirmDialog';
import { FundManagerTour } from './FundManagerTour';

import { useJobManager, useJobData } from '@/hooks/contracts/useJobManager';
import { getTokenInfo, getTokenBalance, formatTokenBalance } from '@/lib/contracts/erc20';
import { getFriendlyWalletError } from '@/lib/contracts/walletErrors';
import { ACTIVE_CHAIN_ID, ACTIVE_CHAIN_NAME, activeChain } from '@/config/chains';
import type { DatabaseIdentifier } from '@/lib/contracts/jobManager';

// "polygon-amoy" -> "Polygon Amoy"
function formatChainLabel(label: string): string {
  return label
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

interface FundManagerProps {
  jobId: DatabaseIdentifier;
  databaseJobId: number | string;
  tokenAddress: string;
  jobChainId?: number | null;
  jobChainLabel?: string;
  /** Tab to open on. */
  initialTab?: 'add' | 'withdraw' | 'fees';
  onClose: () => void;
}

export default function FundManager({
  jobId,
  databaseJobId,
  tokenAddress,
  jobChainId,
  jobChainLabel,
  initialTab = 'add',
  onClose
}: FundManagerProps) {
  const account = useActiveAccount();
  const walletChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [confirm, confirmDialog] = useConfirm();
  const [tourReplayToken, setTourReplayToken] = useState(0);
  const { addFunds, withdrawFunds, payFees, isLoading: isContractLoading } = useJobManager();
  const {
    jobData,
    balance: jobBalance,
    refetch: refetchJobData,
    error: jobDataError,
  } = useJobData(jobId);

  const [activeTab, setActiveTab] = useState<'add' | 'withdraw' | 'fees'>(initialTab);
  const [amount, setAmount] = useState('');
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    action: 'add' | 'withdraw' | 'fees';
    amount: string;
    tokenSymbol: string;
  } | null>(null);

  const friendlyChainName = jobChainLabel
    ? formatChainLabel(jobChainLabel)
    : 'another network';
  const appChainName = formatChainLabel(ACTIVE_CHAIN_NAME);
  const hasWithdrawableBalance = Boolean(jobBalance) && Number(jobBalance) > 0;

  // Load token info and user balance
  useEffect(() => {
    const loadData = async () => {
      if (!tokenAddress || !account) {
        setTokenInfo(null);
        return;
      }

      try {
        setIsLoading(true);
        const [info, balance] = await Promise.all([
          getTokenInfo(tokenAddress),
          getTokenBalance(tokenAddress, account.address)
        ]);

        setTokenInfo(info);
        setUserBalance(balance);
        setTokenError(null);
      } catch (error) {
        console.error('Failed to load token data:', error);
        toast.error('Failed to load token information');
        setTokenError('Token information unavailable for this job.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [tokenAddress, account]);

  const handleAddFunds = async () => {
    if (!amount || !tokenInfo) return;

    const success = await addFunds(jobId, amount, tokenAddress);
    if (success) {
      // Show success screen
      setSuccessDetails({
        action: 'add',
        amount,
        tokenSymbol: tokenInfo.symbol
      });
      setShowSuccess(true);
      setAmount('');
      refetchJobData();
      // Refresh user balance
      if (account) {
        const balance = await getTokenBalance(tokenAddress, account.address);
        setUserBalance(balance);
      }
    }
  };

  const handleWithdrawFunds = async (withdrawAll: boolean = false) => {
    if (!withdrawAll && !amount) return;

    const success = await withdrawFunds(jobId, withdrawAll ? '0' : amount, withdrawAll);
    if (success) {
      // Show success screen
      setSuccessDetails({
        action: 'withdraw',
        amount: withdrawAll ? 'all funds' : amount,
        tokenSymbol: tokenInfo.symbol
      });
      setShowSuccess(true);
      setAmount('');
      refetchJobData();
      // Refresh user balance
      if (account) {
        const balance = await getTokenBalance(tokenAddress, account.address);
        setUserBalance(balance);
      }
    }
  };

  const handlePayFees = async () => {
    if (!amount) return;

    const success = await payFees(jobId, amount);
    if (success) {
      // Show success screen
      setSuccessDetails({
        action: 'fees',
        amount,
        tokenSymbol: tokenInfo.symbol
      });
      setShowSuccess(true);
      setAmount('');
      refetchJobData();
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setSuccessDetails(null);
    onClose();
  };

  const getMaxAmount = () => {
    if (activeTab === 'add') {
      return tokenInfo ? formatTokenBalance(typeof userBalance === 'bigint' ? userBalance : BigInt(userBalance), tokenInfo.decimals) : '0';
    } else if (activeTab === 'withdraw') {
      // For withdraw, jobBalance is already formatted as a string from useJobData hook
      return jobBalance || '0';
    }
    return '0';
  };

  const setMaxAmount = () => {
    setAmount(getMaxAmount());
  };

  // The job lives on a different network than the app is configured for.
  // Switching the wallet can't fix this — the app reads from its own network.
  const jobOnOtherNetwork = Boolean(
    jobChainId !== undefined &&
      jobChainId !== null &&
      jobChainId !== ACTIVE_CHAIN_ID,
  );

  // The company's wallet is on a different network than the app. Fixable
  // with a network switch.
  const walletOnWrongNetwork = Boolean(
    !jobOnOtherNetwork && walletChain && walletChain.id !== ACTIVE_CHAIN_ID,
  );

  const handleSwitchNetwork = async () => {
    setIsSwitchingNetwork(true);
    try {
      await switchChain(activeChain);
      toast.success(`Switched to ${appChainName}`);
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast.error(
        getFriendlyWalletError(
          error,
          `Couldn't switch network. Please switch to ${appChainName} in your wallet.`,
        ),
      );
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const actionsDisabled =
    isContractLoading ||
    isLoading ||
    isSwitchingNetwork ||
    jobOnOtherNetwork ||
    walletOnWrongNetwork ||
    Boolean(jobDataError);


  const isBusy = isLoading || isContractLoading;
  const symbol = tokenInfo?.symbol ?? '';
  const walletBalanceLabel = tokenInfo
    ? formatTokenBalance(typeof userBalance === 'bigint' ? userBalance : BigInt(userBalance), tokenInfo.decimals)
    : null;

  const handleWithdrawAll = async () => {
    const confirmed = await confirm({
      title: 'Withdraw all funds?',
      description: `All ${jobBalance ?? ''} ${symbol} in this job's escrow goes back to your wallet. Without funds in escrow, talent on this job can't be paid until you add more.`,
      confirmLabel: 'Withdraw all',
      tone: 'danger',
    });
    if (confirmed) await handleWithdrawFunds(true);
  };

  const shell = (children: ReactNode, maxWidth = 'max-w-lg') => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isBusy ? undefined : onClose}
      />
      <div className={`relative z-10 w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-[28px] bg-white shadow-2xl`}>
        {children}
      </div>
      {confirmDialog}
    </div>
  );

  const notice = (title: string, body: string) =>
    shell(
      <div className="px-6 py-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Wallet className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{body}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
        >
          Close
        </button>
      </div>,
      'max-w-md',
    );

  if (!account) {
    return notice('Connect your wallet', 'Connect the wallet you used to publish this job to manage its funds.');
  }

  if (!tokenAddress) {
    return notice(
      'Payment token not found',
      "We couldn't determine the payment token for this job. Please republish the job or contact support.",
    );
  }

  if (showSuccess && successDetails) {
    const verb = { add: 'Added', withdraw: 'Withdrawn', fees: 'Paid' }[successDetails.action];
    const headline = {
      add: 'Funds added to escrow',
      withdraw: 'Funds sent back to your wallet',
      fees: 'Service fees paid',
    }[successDetails.action];

    return shell(
      <div className="px-6 py-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">{headline}</h2>
        <div className="mx-auto mt-4 max-w-xs rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">{verb}</p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900">
            {successDetails.amount} {successDetails.tokenSymbol}
          </p>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          The transaction is confirmed on-chain and the job balance is updated.
        </p>
        <button
          type="button"
          onClick={handleCloseSuccess}
          className="mt-6 flex w-full items-center justify-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
        >
          Done
        </button>
      </div>,
      'max-w-md',
    );
  }

  const tabs = [
    { id: 'add' as const, label: 'Add funds', icon: ArrowDownToLine },
    { id: 'withdraw' as const, label: 'Withdraw', icon: ArrowUpFromLine },
    { id: 'fees' as const, label: 'Pay fees', icon: Receipt },
  ];
  const amountInvalid = !amount || parseFloat(amount) <= 0;
  const primaryButton =
    'flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed';
  const processing = (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      Processing…
    </>
  );

  return shell(
    <>
      <FundManagerTour replayToken={tourReplayToken} />
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
            Manage funds
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Job escrow</h2>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-xs text-slate-400">Job #{String(databaseJobId)}</span>
            <button
              type="button"
              onClick={() => setTourReplayToken((n) => n + 1)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
            >
              <Compass className="h-3.5 w-3.5" />
              How it works
            </button>
          </div>
        </div>
        {!isBusy && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="space-y-5 px-6 py-6">
        {(jobOnOtherNetwork || walletOnWrongNetwork || tokenError || jobDataError) && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1 space-y-2">
              {jobOnOtherNetwork && (
                <p>
                  This job was created on the {friendlyChainName} network, but
                  GoodHive is currently running on {appChainName}, so its funds
                  can&apos;t be managed here. Please contact support for help.
                </p>
              )}
              {walletOnWrongNetwork && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Your wallet is connected to{' '}
                    {walletChain?.name ? formatChainLabel(walletChain.name) : 'another network'}.
                    Switch to {appChainName} to manage funds.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleSwitchNetwork()}
                    disabled={isSwitchingNetwork}
                    className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
                  >
                    {isSwitchingNetwork ? 'Switching…' : `Switch to ${appChainName}`}
                  </button>
                </div>
              )}
              {tokenError && <p>{tokenError}</p>}
              {jobDataError && (
                <p>
                  {jobDataError.includes('Job does not exist')
                    ? 'We could not find this job on the currently connected network. Confirm you are viewing the correct job and network before managing funds.'
                    : jobDataError}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Balances */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div data-tour="fm-escrow" className="rounded-2xl border border-amber-200 bg-gradient-to-br from-[#fff6d9] to-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">In escrow</p>
            {tokenInfo && jobBalance !== null && jobBalance !== undefined ? (
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {jobBalance} <span className="text-base text-slate-500">{symbol}</span>
              </p>
            ) : (
              <div className="mt-2 h-7 w-28 animate-pulse rounded-lg bg-amber-100" />
            )}
            <p className="mt-1 text-xs text-slate-500">Held by the job&apos;s smart contract</p>
          </div>
          <div data-tour="fm-wallet" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your wallet</p>
            {walletBalanceLabel !== null ? (
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {walletBalanceLabel} <span className="text-base text-slate-500">{symbol}</span>
              </p>
            ) : (
              <div className="mt-2 h-7 w-28 animate-pulse rounded-lg bg-slate-200" />
            )}
            <p className="mt-1 truncate font-mono text-xs text-slate-400">{account.address}</p>
          </div>
        </div>

        {/* Tabs */}
        <div data-tour="fm-tabs" className="flex gap-1 rounded-full bg-slate-100 p-1" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setActiveTab(tab.id);
                  setAmount('');
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  selected ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Amount */}
        <div data-tour="fm-amount">
          <label htmlFor="fund-amount" className="mb-2 block text-sm font-medium text-slate-700">
            Amount {symbol ? `(${symbol})` : ''}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="fund-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isBusy}
              placeholder="e.g. 500"
              step="0.000001"
              min="0"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:bg-slate-50"
            />
            {activeTab !== 'fees' && (
              <button
                type="button"
                onClick={setMaxAmount}
                disabled={isBusy}
                className="shrink-0 rounded-full border border-slate-300 px-3 py-3 text-xs font-medium text-slate-600 transition hover:border-slate-900 hover:text-slate-900 disabled:opacity-50"
              >
                Max
              </button>
            )}
          </div>
          {activeTab !== 'fees' && (
            <p className="mt-1.5 text-xs text-slate-500">
              Available: {getMaxAmount()} {symbol}
            </p>
          )}
        </div>

        {/* Actions */}
        {activeTab === 'add' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleAddFunds}
              data-tour="fm-action"
              disabled={actionsDisabled || amountInvalid}
              className={`${primaryButton} bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300`}
            >
              {isContractLoading ? processing : 'Add funds to escrow'}
            </button>
            <p className="text-center text-xs text-slate-500">
              Moves funds from your wallet into the job&apos;s escrow. Your wallet asks you to approve, then confirm.
            </p>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleWithdrawFunds(false)}
              data-tour="fm-action"
              disabled={actionsDisabled || amountInvalid}
              className={`${primaryButton} bg-slate-900 hover:bg-slate-700 disabled:bg-slate-300`}
            >
              {isContractLoading ? processing : 'Withdraw amount'}
            </button>
            <button
              type="button"
              onClick={() => void handleWithdrawAll()}
              disabled={actionsDisabled || !hasWithdrawableBalance}
              className="flex w-full items-center justify-center rounded-full border border-rose-200 px-6 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Withdraw everything
            </button>
            <p className="text-center text-xs text-slate-500">
              Sends funds from escrow back to your wallet.
            </p>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handlePayFees}
              data-tour="fm-action"
              disabled={actionsDisabled || amountInvalid}
              className={`${primaryButton} bg-slate-900 hover:bg-slate-700 disabled:bg-slate-300`}
            >
              {isContractLoading ? processing : 'Pay service fees'}
            </button>
            <p className="text-center text-xs text-slate-500">
              Enter the base amount. Fees are calculated from the services on this job and paid to GoodHive.
            </p>
          </div>
        )}

        {/* Services & fees */}
        {jobData && (jobData.talentService || jobData.recruiterService || jobData.mentorService) && (
          <div data-tour="fm-services" className="rounded-2xl border border-slate-200 px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Services on this job
            </p>
            <dl className="space-y-1.5 text-sm">
              {[
                { on: jobData.talentService, label: 'Talent selection', fee: '10%' },
                { on: jobData.recruiterService, label: 'Recruiter', fee: '8%' },
                { on: jobData.mentorService, label: 'Mentor', fee: '12%' },
              ]
                .filter((s) => s.on)
                .map((s) => (
                  <div key={s.label} className="flex justify-between">
                    <dt className="text-slate-600">{s.label}</dt>
                    <dd className="font-semibold text-slate-900">{s.fee}</dd>
                  </div>
                ))}
            </dl>
          </div>
        )}
      </div>
    </>,
  );
}
