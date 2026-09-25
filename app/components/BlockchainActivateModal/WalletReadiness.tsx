"use client";

import { useState } from "react";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  useActiveAccount,
  useActiveWalletChain,
  useConnectModal,
  useSwitchActiveWalletChain,
  useWalletBalance,
} from "thirdweb/react";

import { thirdwebClient } from "@/clients";
import { ACTIVE_CHAIN_ID, activeChain } from "@/config/chains";
import { connectModalOptions, supportedWallets } from "@/lib/auth/walletConfig";
import { SUPPORTED_TOKENS } from "@/lib/contracts/jobManager";
import { getFriendlyWalletError } from "@/lib/contracts/walletErrors";

// Polygon's gas token (formerly MATIC).
const GAS_SYMBOL = "POL";
const IS_TESTNET = Boolean(activeChain.testnet);
const NETWORK_NAME = IS_TESTNET ? "Polygon Amoy (testnet)" : "Polygon";
const GAS_FAUCET_URL = "https://faucet.polygon.technology/";
// Amoy's USDC is Circle's official test token, which Circle's faucet hands out.
const USDC_FAUCET_URL = "https://faucet.circle.com/";

type CheckState = "ok" | "missing" | "loading";

interface ReadinessItem {
  id: string;
  label: string;
  state: CheckState;
  help?: React.ReactNode;
}

export interface WalletReadiness {
  /** Connected, on the right network, and holding gas. */
  canTransact: boolean;
  items: ReadinessItem[];
}

/**
 * What a company needs before a publish or funding transaction can succeed.
 * `tokenBalance` / `tokenSymbol` come from the modal's own balance read;
 * `requiredAmount` is what the next step will pull from the wallet (0 when
 * nothing is being funded yet).
 */
export function useWalletReadiness({
  tokenAddress,
  tokenBalance,
  tokenSymbol,
  requiredAmount,
}: {
  tokenAddress: string;
  tokenBalance: string;
  tokenSymbol: string;
  requiredAmount: number;
}): WalletReadiness {
  const account = useActiveAccount();
  const walletChain = useActiveWalletChain();
  const { data: gasBalance, isLoading: gasLoading } = useWalletBalance({
    client: thirdwebClient,
    chain: activeChain,
    address: account?.address,
  });

  const connected = Boolean(account);
  const onNetwork = connected && walletChain?.id === ACTIVE_CHAIN_ID;
  const hasGas = gasBalance ? gasBalance.value > 0n : false;
  const tokenAmount = Number(tokenBalance.replace(/,/g, "")) || 0;
  const hasToken = requiredAmount > 0 ? tokenAmount >= requiredAmount : tokenAmount > 0;
  const symbol = tokenSymbol || "USDC";
  const isAmoyUsdc = tokenAddress.toLowerCase() === SUPPORTED_TOKENS.USDC_AMOY.toLowerCase();

  const faucetLink = (href: string, label: string) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-800"
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  );

  const items: ReadinessItem[] = [
    { id: "wallet", label: "Wallet connected", state: connected ? "ok" : "missing" },
    {
      id: "network",
      label: `On ${NETWORK_NAME}`,
      state: !connected ? "missing" : onNetwork ? "ok" : "missing",
    },
    {
      id: "gas",
      label: `${GAS_SYMBOL} for network fees`,
      state: !onNetwork ? "missing" : gasLoading ? "loading" : hasGas ? "ok" : "missing",
      help: IS_TESTNET ? (
        <>Get free test {GAS_SYMBOL} from the {faucetLink(GAS_FAUCET_URL, "Polygon faucet")}.</>
      ) : (
        <>Add a little {GAS_SYMBOL} to your wallet. Each transaction costs a few cents.</>
      ),
    },
    {
      id: "token",
      label:
        requiredAmount > 0
          ? `${requiredAmount.toLocaleString("en-US")} ${symbol} to fund the job`
          : `${symbol} to fund the job`,
      state: !onNetwork ? "missing" : hasToken ? "ok" : "missing",
      help: IS_TESTNET ? (
        isAmoyUsdc ? (
          <>
            Get free test USDC from {faucetLink(USDC_FAUCET_URL, "Circle's faucet")} (pick
            Polygon PoS Amoy).
          </>
        ) : (
          <>Contact GoodHive for test {symbol}.</>
        )
      ) : (
        <>Buy or bridge {symbol} on the Polygon network to this wallet.</>
      ),
    },
  ];

  return { canTransact: connected && onNetwork && hasGas, items };
}

export function WalletReadinessList({
  readiness,
  showToken,
}: {
  readiness: WalletReadiness;
  /** Hide the token row when the next step doesn't spend tokens. */
  showToken: boolean;
}) {
  const { connect } = useConnectModal();
  const switchChain = useSwitchActiveWalletChain();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async () => {
    setIsSwitching(true);
    try {
      await switchChain(activeChain);
    } catch (error) {
      toast.error(getFriendlyWalletError(error, `Please switch to ${NETWORK_NAME} in your wallet.`));
    } finally {
      setIsSwitching(false);
    }
  };

  const items = readiness.items.filter((item) => showToken || item.id !== "token");
  // Only the first unmet requirement gets its fix: later ones depend on it.
  const firstMissing = items.find((item) => item.state === "missing")?.id;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" data-tour="activate-wallet">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Wallet checklist
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="text-sm">
            <div className="flex items-center gap-2.5">
              {item.state === "ok" ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : item.state === "loading" ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              ) : (
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    item.id === firstMissing ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  <X className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              <span className={item.state === "ok" ? "text-slate-600" : "font-medium text-slate-900"}>
                {item.label}
              </span>
              {item.id === firstMissing && item.id === "wallet" && (
                <button
                  type="button"
                  onClick={() =>
                    void connect({
                      client: thirdwebClient,
                      wallets: supportedWallets,
                      chain: activeChain,
                      ...connectModalOptions,
                    })
                  }
                  className="ml-auto rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  Connect
                </button>
              )}
              {item.id === firstMissing && item.id === "network" && (
                <button
                  type="button"
                  onClick={() => void handleSwitch()}
                  disabled={isSwitching}
                  className="ml-auto rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600 disabled:bg-amber-300"
                >
                  {isSwitching ? "Switching…" : "Switch network"}
                </button>
              )}
            </div>
            {item.id === firstMissing && item.help && (
              <p className="ml-[30px] mt-1 text-xs leading-5 text-slate-600">{item.help}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
