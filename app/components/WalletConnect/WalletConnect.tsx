"use client";

import { useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export const WalletConnect = () => {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      console.log("Wallet connected:", address);
    }
  }, [isConnected, address]);

  return <ConnectButton />;
};
