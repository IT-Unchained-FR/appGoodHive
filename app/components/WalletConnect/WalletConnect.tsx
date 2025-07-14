"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";

export const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const handleWalletLogin = async (walletAddress: string) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/check-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet_address: walletAddress }),
      });

      const data = await response.json();
      console.log(data, "Wallet User Data...");

      return;
    } catch (error) {
      console.error("Error checking wallet:", error);
      toast.error("Failed to verify wallet status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address && !isLoading) {
      console.log("Wallet connected:", address);
      handleWalletLogin(address);
    }
  }, [isConnected, address]);

  return <ConnectButton />;
};
