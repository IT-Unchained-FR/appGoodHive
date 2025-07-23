import { Wallet } from "lucide-react";
import React from "react";
import { ExternalWalletTab } from "./ExternalWalletTab";

interface WalletTabProps {
  walletType: "okto" | "external";
  walletAddress: string | null;
  balance?: string;
  coins?: any[];
  loading?: boolean;
  error?: string | null;
  isOpen?: boolean; // Add isOpen prop for popup state
}

export const WalletTab: React.FC<WalletTabProps> = ({
  walletType,
  walletAddress,
  balance = "$0.00",
  coins = [],
  loading = false,
  error = null,
  isOpen = true, // Default to true for backward compatibility
}) => {
  if (walletType === "external") {
    return (
      <ExternalWalletTab
        walletAddress={walletAddress}
        loading={loading}
        error={error}
        isOpen={isOpen}
      />
    );
  }

  // Okto wallet logic and UI only below
  // Remove all 'walletType === "external"' checks and related code

  // Utility function to check for a valid Ethereum address
  function isValidAddress(address: string | null | undefined): boolean {
    return typeof address === "string" && /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Okto wallet UI
  return (
    <div className="w-full">
      {/* Balance */}
      <div className="mt-6 mb-2 text-center w-full">
        <div className="text-[#A6A6A6] text-sm font-medium">Wallet Balance</div>
        <div className="text-4xl font-extrabold text-gray-900">{balance}</div>
      </div>

      {/* Wallet Address Section */}
      <div className="w-full mt-4 mb-2">
        <div className="bg-[#FFF7D1] rounded-xl p-3 border border-[#FFC905]/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">
                Okto Wallet Address
              </span>
            </div>
          </div>
          <div className="text-xs font-mono text-gray-600 break-all">
            {walletAddress || "No GoodHive wallet address available"}
          </div>
          <div className="mt-2 text-xs text-gray-500 leading-relaxed">
            This is your Goodhive Wallet address. You can view your portfolio
            and manage your assets here.
          </div>
        </div>
      </div>

      {/* Coins */}
      <div className="w-full mt-2">
        <div className="text-sm font-semibold text-gray-900 mb-2">Coins</div>
        <div className="flex flex-col gap-2">
          {coins.map((coin: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FFF7D1] transition"
            >
              {coin.icon ? (
                <img
                  src={coin.icon}
                  alt={coin.symbol}
                  className="w-8 h-8 rounded-full border border-[#FFC905] bg-[#FFF7D1] object-contain"
                />
              ) : (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FFF7D1] border border-[#FFC905]">
                  <Wallet size={18} color="#FFC905" />
                </span>
              )}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium text-gray-900 text-sm truncate">
                  {coin.name}{" "}
                  <span className="text-xs text-gray-400 font-mono">
                    ({coin.symbol})
                  </span>
                </span>
                <span className="text-xs text-gray-400 truncate">
                  {Number(coin.balance) === 0
                    ? "No balance"
                    : `${Number(coin.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${coin.symbol}`}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-semibold text-gray-900 text-sm">
                  $
                  {Number(coin.valueUsd).toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
