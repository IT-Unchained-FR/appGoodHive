import { ConnectButton } from "@rainbow-me/rainbowkit";
import Cookies from "js-cookie";
import { Check, Copy, Wallet } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { polygon } from "wagmi/chains";

interface ExternalWalletTabProps {
  walletAddress: string | null;
  loading?: boolean;
  error?: string | null;
  isOpen?: boolean;
}

export const ExternalWalletTab: React.FC<ExternalWalletTabProps> = ({
  walletAddress,
  loading = false,
  error = null,
  isOpen = true,
}) => {
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [maticPrice, setMaticPrice] = useState<number>(0);
  const { address: wagmiAddress, isConnected } = useAccount();

  // Add wallet verification states
  const [walletVerificationStatus, setWalletVerificationStatus] = useState<
    "idle" | "checking" | "duplicate" | "success" | "error"
  >("idle");
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );
  const [showBalances, setShowBalances] = useState<boolean>(false);

  // Get user_id from cookies
  const userId = Cookies.get("user_id");

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
        setMaticPrice(0.8);
      }
    };
    fetchMaticPrice();
  }, []);

  function isValidAddress(address: string | null | undefined): boolean {
    return typeof address === "string" && /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  const effectiveAddress =
    wagmiAddress ||
    (walletAddress && walletAddress !== "null" ? walletAddress : undefined);
  const shouldFetch =
    isOpen && !!effectiveAddress && isValidAddress(effectiveAddress);

  const { data: nativeBalance, isLoading: nativeBalanceLoading } = useBalance({
    address: effectiveAddress as `0x${string}`,
    chainId: polygon.id,
    watch: true,
    enabled: shouldFetch,
  });

  const USDCE_ADDRESS =
    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as `0x${string}`;
  const USDT_ADDRESS =
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f" as `0x${string}`;
  const DAI_ADDRESS =
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063" as `0x${string}`;

  const { data: usdceBalance, isLoading: usdceLoading } = useBalance({
    address: effectiveAddress as `0x${string}`,
    token: USDCE_ADDRESS,
    chainId: polygon.id,
    watch: true,
    enabled: shouldFetch,
  });
  const { data: usdtBalance, isLoading: usdtLoading } = useBalance({
    address: effectiveAddress as `0x${string}`,
    token: USDT_ADDRESS,
    chainId: polygon.id,
    watch: true,
    enabled: shouldFetch,
  });
  const { data: daiBalance, isLoading: daiLoading } = useBalance({
    address: effectiveAddress as `0x${string}`,
    token: DAI_ADDRESS,
    chainId: polygon.id,
    watch: true,
    enabled: shouldFetch,
  });

  const handleCopyAddress = (address: string) => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1500);
    }
  };

  const calculateExternalBalance = () => {
    if (!isConnected && !walletAddress) return "$0.00";
    let totalUSD = 0;
    if (nativeBalance?.formatted) {
      const maticValue = parseFloat(nativeBalance.formatted) * maticPrice;
      totalUSD += maticValue;
    }
    if (usdceBalance?.formatted) {
      totalUSD += parseFloat(usdceBalance.formatted);
    }
    // Uncomment if you want to include USDT and DAI in total
    // if (usdtBalance?.formatted) {
    //   totalUSD += parseFloat(usdtBalance.formatted);
    // }
    // if (daiBalance?.formatted) {
    //   totalUSD += parseFloat(daiBalance.formatted);
    // }
    return `$${totalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const generateExternalCoins = () => {
    if (!isConnected && !walletAddress) return [];
    const coins = [];
    if (nativeBalance?.formatted && parseFloat(nativeBalance.formatted) > 0) {
      coins.push({
        icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png",
        name: "Polygon",
        symbol: "MATIC",
        network: "POLYGON",
        balance: nativeBalance.formatted,
        valueUsd: (parseFloat(nativeBalance.formatted) * maticPrice).toFixed(2),
      });
    }
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

  const displayCoins = generateExternalCoins();
  const displayBalance = calculateExternalBalance();
  const isExternalLoading =
    nativeBalanceLoading || usdceLoading || usdtLoading || daiLoading;

  const handleConnectWallet = () => {
    console.log("=== Wallet Connection Process ===");
    console.log("Connecting MetaMask wallet...");
    console.log("Current connection status:", isConnected);
    console.log("Current wagmi address:", wagmiAddress);
    console.log("Stored wallet address from DB:", walletAddress);
    console.log("Wagmi connection state:", {
      isConnected,
      address: wagmiAddress,
      hasStoredAddress: !!walletAddress,
      effectiveConnection: isConnected || !!walletAddress,
    });
    console.log("=================================");
  };

  useEffect(() => {
    console.log("=== External Wallet Status Update ===");
    console.log("Connection status changed:", isConnected);
    console.log("Wagmi address:", wagmiAddress);
    console.log("Stored address:", walletAddress);
    console.log("Effective connection status:", isConnected || !!walletAddress);
    console.log("Wagmi connection details:", {
      isConnected,
      address: wagmiAddress,
      hasStoredAddress: !!walletAddress,
      effectiveConnection: isConnected || !!walletAddress,
    });
    console.log("=====================================");
  }, [isConnected, wagmiAddress, walletAddress]);

  // Effect to verify wallet after connection
  useEffect(() => {
    // Only run if wallet is connected, wagmiAddress is set, and not already verified
    if (
      isConnected &&
      wagmiAddress &&
      walletVerificationStatus === "idle" &&
      isValidAddress(wagmiAddress)
    ) {
      console.log("=== External Wallet Verification ===");
      console.log("Wallet connected:", isConnected);
      console.log("Wagmi address:", wagmiAddress);
      console.log("Wallet verification status:", walletVerificationStatus);
      console.log("User ID:", userId);
      console.log("=====================================");

      // If no userId, show error
      if (!userId) {
        setWalletVerificationStatus("error");
        setVerificationError(
          "User session expired or not found. Please log in again.",
        );
        return;
      }
      setWalletVerificationStatus("checking");
      setVerificationError(null);

      // Check if wallet is already in use (no user creation)
      fetch("/api/auth/wallet-address-exists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: wagmiAddress }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to verify wallet address.");
          return res.json();
        })
        .then(async (data) => {
          // If exists and not this user, show duplicate error
          if (data.exists && data.user_id !== userId) {
            setWalletVerificationStatus("duplicate");
            setVerificationError(
              "This wallet address is already connected to another user.",
            );
            setShowBalances(false);
          } else if (!data.exists) {
            // If not in use, and user does not have a wallet address, set it
            const res = await fetch("/api/auth/set-wallet-address", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ walletAddress: wagmiAddress, userId }),
            });
            const setData = await res.json();
            if (!setData.success) {
              setWalletVerificationStatus("error");
              setVerificationError(
                setData.message || "Failed to set wallet address.",
              );
              setShowBalances(false);
              return;
            }

            setWalletVerificationStatus("success");
            setShowBalances(true);
          } else {
            // Address is not in use or is already set for this user
            setWalletVerificationStatus("success");
            setShowBalances(true);
          }
        })
        .catch((err) => {
          setWalletVerificationStatus("error");
          setVerificationError(
            err.message || "Failed to verify wallet address.",
          );
          setShowBalances(false);
        });
    }
  }, [
    isConnected,
    wagmiAddress,
    walletVerificationStatus,
    walletAddress,
    userId,
  ]);

  // UI branches for verification
  if (walletVerificationStatus === "checking") {
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
        <span className="ml-4 text-[#FFC905] font-semibold">
          Verifying wallet address...
        </span>
      </div>
    );
  }
  if (walletVerificationStatus === "duplicate") {
    return (
      <div className="flex flex-1 items-center justify-center w-full min-h-[180px] text-red-500 font-semibold text-center">
        {verificationError ||
          "This wallet address is already connected to another user."}
      </div>
    );
  }
  if (walletVerificationStatus === "error") {
    return (
      <div className="flex flex-1 items-center justify-center w-full min-h-[180px] text-red-500 font-semibold text-center">
        {verificationError || "An error occurred. Please try again."}
      </div>
    );
  }

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

  if (!isValidAddress(walletAddress)) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[200px]">
        <div className="text-center mb-4">
          <div className="text-lg font-semibold text-gray-900 mb-2">
            No External Wallet Connected
          </div>
          <div className="text-sm text-gray-600 mb-4">
            You have not connected an external wallet address to your GoodHive
            account. Please connect your wallet to use it for transactions and
            payments.
          </div>
        </div>
        <ConnectButton />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="w-full">
        {/* Wallet Address Section */}
        <div className="w-full mt-4 mb-2">
          <div className="bg-[#FFF7D1] rounded-xl p-3 border border-[#FFC905]/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">
                  External Wallet Address
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Not Connected
                </span>
              </div>
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
              {walletAddress || "No external wallet address available"}
            </div>
            <div className="mt-2 text-xs text-gray-500 leading-relaxed">
              This is your external wallet address stored in your GoodHive
              account. Connect your wallet to view balances and manage assets.
            </div>
          </div>
        </div>
        {/* Connect Wallet Button */}
        <div className="w-full mt-4">
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900 mb-3">
              Connect Your Wallet
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-3">
                Connect your MetaMask wallet to view your balances and manage
                your assets on GoodHive.
              </p>
              <div
                onClick={handleConnectWallet}
                className="flex justify-center"
              >
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show balances if verified or not using wagmi connection
  if (
    walletVerificationStatus === "success" ||
    (!isConnected && isValidAddress(walletAddress))
  ) {
    return (
      <div className="w-full">
        {/* Balance */}
        <div className="mt-6 mb-2 text-center w-full">
          <div className="text-[#A6A6A6] text-sm font-medium">
            Wallet Balance
          </div>
          <div className="text-4xl font-extrabold text-gray-900">
            {displayBalance}
          </div>
        </div>
        {/* Wallet Address Section */}
        <div className="w-full mt-4 mb-2">
          <div className="bg-[#FFF7D1] rounded-xl p-3 border border-[#FFC905]/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">
                  External Wallet Address
                </span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isConnected || walletAddress
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {isConnected || walletAddress ? "Connected" : "Not Connected"}
                </span>
              </div>
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
              {walletAddress || "No external wallet address available"}
            </div>
            <div className="mt-2 text-xs text-gray-500 leading-relaxed">
              This is your external wallet address connected to your GoodHive
              account. You can use this address for transactions and payments on
              the platform.
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
  }

  return (
    <div className="w-full">
      {/* Wallet Address Section */}
      <div className="w-full mt-4 mb-2">
        <div className="bg-[#FFF7D1] rounded-xl p-3 border border-[#FFC905]/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">
                External Wallet Address
              </span>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isConnected || walletAddress
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {isConnected || walletAddress ? "Connected" : "Not Connected"}
              </span>
            </div>
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
            {walletAddress || "No external wallet address available"}
          </div>
          <div className="mt-2 text-xs text-gray-500 leading-relaxed">
            This is your external wallet address connected to your GoodHive
            account. You can use this address for transactions and payments on
            the platform.
          </div>
        </div>
      </div>
      {/* Connect Wallet Button */}
      <div className="w-full mt-4">
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900 mb-3">
            Connect Your Wallet
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-600 mb-3">
              Connect your MetaMask wallet to view your balances and manage your
              assets on GoodHive.
            </p>
            <div onClick={handleConnectWallet}>
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
