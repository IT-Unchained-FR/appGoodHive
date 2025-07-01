"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

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

      if (data.exists && data.user) {
        console.log("User found:", {
          userId: data.user.user_id,
          email: data.user.email,
          walletAddress: data.user.wallet_address,
        });

        // Clear existing localStorage and cookies before setting new ones
        localStorage.clear();
        document.cookie.split(";").forEach(function (c) {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(
              /=.*/,
              "=;expires=" + new Date().toUTCString() + ";path=/",
            );
        });

        // Set user data in cookies (same as Google login)
        Cookies.set("user_id", data.user.user_id);
        Cookies.set("user_email", data.user.email);
        Cookies.set("user_address", data.user.wallet_address);

        toast.success("Welcome back to the hive! 🐝");

        // Redirect to profile page
        window.location.href = "/talents/my-profile";
      } else {
        console.log("Wallet not registered:", walletAddress);
        toast("We don't have any previous user with this wallet address.");
      }
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
