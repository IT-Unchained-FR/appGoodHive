import { getPortfolio, useOkto } from "@okto_web3/react-sdk";
import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { WalletTab } from "./WalletTab";

// Placeholder avatar (rocket emoji)
const avatar = "🚀";

export interface WalletPopupProps {
  isOpen: boolean;
  anchorRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  oktoWalletAddress: string | null;
}

export const WalletPopup: React.FC<WalletPopupProps> = ({
  isOpen,
  anchorRef,
  onClose,
  oktoWalletAddress,
}) => {
  const oktoClient = useOkto();
  const { address: wagmiAddress, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"okto" | "external">("okto");
  const [externalWalletAddress, setExternalWalletAddress] = useState<
    string | null
  >(null);

  const POLYGON_CAIP2_ID = "eip155:137";

  // Get external wallet address from cookies or wagmi
  useEffect(() => {
    const userAddress = Cookies.get("user_address");
    const address = wagmiAddress || userAddress;
    setExternalWalletAddress(address || null);
  }, [isOpen, wagmiAddress]);

  // Fetch Okto portfolio data
  useEffect(() => {
    if (isOpen && oktoWalletAddress && activeTab === "okto") {
      setLoading(true);
      setError(null);
      getPortfolio(oktoClient, oktoWalletAddress)
        .then((data: any) => {
          setPortfolio(data);
          setLoading(false);
        })
        .catch((err: unknown) => {
          setError("Failed to fetch portfolio");
          setLoading(false);
        });
    }
  }, [isOpen, oktoWalletAddress, oktoClient, activeTab]);

  if (!isOpen) return null;

  // Extract USD balance and coins from portfolio
  const balance = portfolio?.aggregatedData?.totalHoldingPriceUsdt
    ? `$${Number(portfolio.aggregatedData.totalHoldingPriceUsdt).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : "$0.00";

  // Default coins to show when no portfolio data is available
  const defaultCoins = [
    {
      icon: "https://www.dextools.io/resources/tokens/logos/3/ether/0x455e53cbb86018ac2b8092fdcd39d8444affc3f6.png?1698233684",
      name: "POL",
      symbol: "POL",
      network: "POLYGON",
      balance: "0",
      valueUsd: "0",
    },
    {
      icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/18852.png",
      name: "Bridged USD Coin",
      symbol: "USDC.e",
      network: "POLYGON",
      balance: "0",
      valueUsd: "0",
    },
  ];

  const coins =
    Array.isArray(portfolio?.groupTokens) && portfolio.groupTokens.length > 0
      ? portfolio.groupTokens.map((token: any) => ({
          icon: token.tokenImage,
          name: token.name,
          symbol: token.symbol,
          network: token.networkName,
          balance: token.balance,
          valueUsd: token.holdingsPriceUsdt,
        }))
      : defaultCoins;

  return (
    <div
      className="absolute top-full right-0 mt-4 z-50 min-w-[340px] max-w-[95vw] bg-white rounded-2xl border border-[#FFC905] shadow-2xl p-0"
      ref={anchorRef}
      style={{
        boxShadow: "0 8px 32px 0 rgba(255, 201, 5, 0.18)",
        right: "-24px", // move a bit to the left
      }}
    >
      {/* Arrow */}
      <div className="absolute -top-2 right-10 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white"></div>
      <div className="p-6 pb-4 flex flex-col items-center min-h-[350px] w-[425px]">
        {/* Wallet header */}
        <div className="flex items-center gap-3 w-full">
          <span className="w-10 h-10 rounded-full flex items-center justify-center text-2xl bg-[#ffeabf] border border-[#FFC905]">
            {avatar}
          </span>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-semibold text-gray-900 text-base leading-tight">
              My GoodHive Wallet
            </span>
            <span className="text-xs text-gray-400 font-mono truncate">
              {activeTab === "okto"
                ? oktoWalletAddress || "No Goodhive wallet address available"
                : externalWalletAddress ||
                  "No external wallet address available"}
            </span>
          </div>
          <button
            className="ml-auto p-1 rounded-full hover:bg-[#FFF7D1] transition"
            onClick={onClose}
            aria-label="Close wallet popup"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="#FFC905"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex w-full mt-4 mb-2 bg-gray-100 rounded-xl p-1">
          <button
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
              activeTab === "okto"
                ? "bg-white text-[#FFC905] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("okto")}
          >
            GoodHive Wallet
          </button>
          <button
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
              activeTab === "external"
                ? "bg-white text-[#FFC905] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("external")}
          >
            External Wallet
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "okto" ? (
          <WalletTab
            walletType="okto"
            walletAddress={oktoWalletAddress}
            balance={balance}
            coins={coins}
            loading={loading}
            error={error}
          />
        ) : (
          <WalletTab
            walletType="external"
            walletAddress={externalWalletAddress}
            loading={false}
            error={null}
          />
        )}
      </div>
    </div>
  );
};
