import { Check, Copy, Wallet } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { polygon } from "wagmi/chains";

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
  const [maticPrice, setMaticPrice] = useState<number>(0);
  const { address: wagmiAddress, isConnected } = useAccount();

  // Fetch MATIC price from CoinGecko
  useEffect(() => {
    const fetchMaticPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=polygon-ecosystem-token&vs_currencies=usd",
        );
        const data = await response.json();
        setMaticPrice(data["polygon-ecosystem-token"]?.usd || 0);
      } catch (error) {
        console.error("Failed to fetch MATIC price:", error);
        setMaticPrice(0.8); // Fallback to hardcoded value
      }
    };

    fetchMaticPrice();
  }, []);

  // Fetch native token balance (MATIC for Polygon)
  const { data: nativeBalance, isLoading: nativeBalanceLoading } = useBalance({
    address: wagmiAddress as `0x${string}`,
    chainId: polygon.id,
    watch: true,
  });

  console.log(nativeBalance, "nativeBalance", isConnected, "isConnected");

  // Common token addresses on Polygon
  const USDCE_ADDRESS =
    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as `0x${string}`;
  const USDT_ADDRESS =
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f" as `0x${string}`;
  const DAI_ADDRESS =
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063" as `0x${string}`;

  // Fetch token balances
  const { data: usdceBalance, isLoading: usdceLoading } = useBalance({
    address: wagmiAddress as `0x${string}`,
    token: USDCE_ADDRESS,
    chainId: polygon.id,
    watch: true,
  });

  const { data: usdtBalance, isLoading: usdtLoading } = useBalance({
    address: wagmiAddress as `0x${string}`,
    token: USDT_ADDRESS,
    chainId: polygon.id,
    watch: true,
  });

  const { data: daiBalance, isLoading: daiLoading } = useBalance({
    address: wagmiAddress as `0x${string}`,
    token: DAI_ADDRESS,
    chainId: polygon.id,
    watch: true,
  });

  const handleCopyAddress = (address: string) => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1500);
    }
  };

  // Calculate total balance for external wallet
  const calculateExternalBalance = () => {
    if (walletType !== "external" || !isConnected) return "$0.00";

    let totalUSD = 0;

    // Add native MATIC balance (real USD value from API)
    if (nativeBalance?.formatted) {
      const maticValue = parseFloat(nativeBalance.formatted) * maticPrice;
      totalUSD += maticValue;
    }

    // Add USDC.e balance (1:1 with USD)
    if (usdceBalance?.formatted) {
      totalUSD += parseFloat(usdceBalance.formatted);
    }

    // // Add USDT balance (1:1 with USD)
    // if (usdtBalance?.formatted) {
    //   totalUSD += parseFloat(usdtBalance.formatted);
    // }

    // // Add DAI balance (1:1 with USD)
    // if (daiBalance?.formatted) {
    //   totalUSD += parseFloat(daiBalance.formatted);
    // }

    return `$${totalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  // Generate external wallet coins data
  const generateExternalCoins = () => {
    if (walletType !== "external" || !isConnected) return [];

    const coins = [];

    // Add MATIC
    if (nativeBalance?.formatted && parseFloat(nativeBalance.formatted) > 0) {
      coins.push({
        icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png",
        name: "Polygon",
        symbol: "MATIC",
        network: "POLYGON",
        balance: nativeBalance.formatted,
        valueUsd: (parseFloat(nativeBalance.formatted) * maticPrice).toFixed(2), // Real price from API
      });
    }

    // Add USDC.e
    if (usdceBalance?.formatted && parseFloat(usdceBalance.formatted) > 0) {
      coins.push({
        icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/18852.png",
        name: "Bridged USD Coin",
        symbol: "USDC.e",
        network: "POLYGON",
        balance: usdceBalance.formatted,
        valueUsd: usdceBalance.formatted,
      });
    }

    // Add USDT
    if (usdtBalance?.formatted && parseFloat(usdtBalance.formatted) > 0) {
      coins.push({
        icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
        name: "Tether USD",
        symbol: "USDT",
        network: "POLYGON",
        balance: usdtBalance.formatted,
        valueUsd: usdtBalance.formatted,
      });
    }

    // Add DAI
    if (daiBalance?.formatted && parseFloat(daiBalance.formatted) > 0) {
      coins.push({
        icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png",
        name: "Dai",
        symbol: "DAI",
        network: "POLYGON",
        balance: daiBalance.formatted,
        valueUsd: daiBalance.formatted,
      });
    }

    return coins.length > 0
      ? coins
      : [
          {
            icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png",
            name: "Polygon",
            symbol: "MATIC",
            network: "POLYGON",
            balance: "0",
            valueUsd: "0",
          },
        ];
  };

  const displayCoins =
    walletType === "external" ? generateExternalCoins() : coins;
  const displayBalance =
    walletType === "external" ? calculateExternalBalance() : balance;
  const isExternalLoading =
    walletType === "external" &&
    (nativeBalanceLoading || usdceLoading || usdtLoading || daiLoading);

  if (loading || isExternalLoading) {
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
            {walletAddress ||
              `No ${walletType === "okto" ? "GoodHive" : "External"} wallet address available`}
          </div>
          <div className="mt-2 text-xs text-gray-500 leading-relaxed">
            {walletType === "okto"
              ? "This is your Goodhive Wallet address. You can view your portfolio and manage your assets here."
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
