import { Check, Copy, Wallet } from "lucide-react";
import React, { useState } from "react";

interface WalletTabProps {
  walletType: "okto" | "external";
  walletAddress: string | null;
  balance?: string;
  coins?: any[];
  loading?: boolean;
  error?: string | null;
}

export const WalletTab: React.FC<WalletTabProps> = ({
  walletType,
  walletAddress,
  balance = "$0.00",
  coins = [],
  loading = false,
  error = null,
}) => {
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  const handleCopyAddress = (address: string) => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1500);
    }
  };

  // Default coins for external wallet (dummy data)
  const defaultExternalCoins = [
    {
      icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
      name: "Ethereum",
      symbol: "ETH",
      network: "ETHEREUM",
      balance: "0.5",
      valueUsd: "1250.00",
    },
    {
      icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
      name: "Tether USD",
      symbol: "USDT",
      network: "ETHEREUM",
      balance: "1000",
      valueUsd: "1000.00",
    },
  ];

  const displayCoins = walletType === "external" ? defaultExternalCoins : coins;
  const displayBalance = walletType === "external" ? "$2,250.00" : balance;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center w-full min-h-[180px]">
        <svg
          className="animate-spin h-10 w-10 text-[#FFC905]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="#FFC905"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="#FFC905"
            d="M4 12a8 8 0 018-8v8z"
          ></path>
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center w-full min-h-[180px] text-red-500 font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Balance */}
      <div className="mt-6 mb-2 text-center w-full">
        <div className="text-[#A6A6A6] text-sm font-medium">Wallet Balance</div>
        <div className="text-4xl font-extrabold text-gray-900">
          {displayBalance}
        </div>
      </div>

      {/* Wallet Address Section */}
      <div className="w-full mt-4 mb-2">
        <div className="bg-[#FFF7D1] rounded-xl p-3 border border-[#FFC905]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">
              {walletType === "okto" ? "Okto" : "External"} Wallet Address
            </span>
            <button
              type="button"
              className="p-1 rounded hover:bg-[#FFC905]/20 transition"
              onClick={() => handleCopyAddress(walletAddress || "")}
              aria-label="Copy address"
              disabled={!walletAddress}
            >
              {copiedAddress ? (
                <Check
                  size={14}
                  className="text-green-500 transition-transform scale-110"
                />
              ) : (
                <Copy
                  size={14}
                  className="text-gray-500 hover:text-[#FFC905] transition-transform"
                />
              )}
            </button>
          </div>
          <div className="text-xs font-mono text-gray-600 break-all">
            {walletAddress || `No ${walletType} wallet address available`}
          </div>
          <div className="mt-2 text-xs text-gray-500 leading-relaxed">
            {walletType === "okto"
              ? "This is your Okto wallet address. You can view your portfolio and manage your assets here."
              : "This is your external wallet address connected to your GoodHive account. You can use this address for transactions and payments on the platform."}
          </div>
        </div>
      </div>

      {/* Coins */}
      <div className="w-full mt-2">
        <div className="text-sm font-semibold text-gray-900 mb-2">Coins</div>
        <div className="flex flex-col gap-2">
          {displayCoins.map((coin: any, idx: number) => (
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
