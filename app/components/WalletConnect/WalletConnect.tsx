"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { WalletConnectPopup } from "./WalletConnectPopup";

export const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const router = useRouter();

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

      if (data.exists && data.user && !data.isNewUser) {
        // Existing user - redirect to talent profile
        console.log("Existing user found:", {
          userId: data.user.user_id,
          email: data.user.email,
          walletAddress: data.user.wallet_address,
        });

        if (data.needsEmailSetup) {
          // Show popup for users who need to add email
          setWalletAddress(walletAddress);
          setShowPopup(true);
        } else {
          // Redirect to talent profile
          toast.success("Welcome back! 🐝");
          router.push("/talents/my-profile");
        }
      } else if (data.isNewUser) {
        // New user created - show welcome popup
        console.log("New user created:", {
          userId: data.user.user_id,
          walletAddress: data.user.wallet_address,
        });

        setWalletAddress(walletAddress);
        setShowPopup(true);
        toast.success("Welcome to GoodHive! 🐝");
      } else {
        toast.error("Failed to create or find user account");
      }
    } catch (error) {
      console.error("Error checking wallet:", error);
      toast.error("Failed to verify wallet status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setWalletAddress("");
    // Redirect to talent profile even if they skip the email setup
    router.push("/talents/my-profile");
  };

  useEffect(() => {
    if (isConnected && address && !isLoading) {
      console.log("Wallet connected:", address);
      handleWalletLogin(address);
    }
  }, [isConnected, address]);

  return (
    <>
      <ConnectButton />
      <WalletConnectPopup
        isOpen={showPopup}
        onClose={handleClosePopup}
        walletAddress={walletAddress}
      />
    </>
  );
};
