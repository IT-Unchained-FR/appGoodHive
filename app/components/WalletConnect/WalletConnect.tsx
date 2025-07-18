"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { WalletConnectPopup } from "./WalletConnectPopup";

interface WalletUserState {
  exists: boolean;
  isNewUser: boolean;
  needsEmailSetup: boolean;
  user: {
    user_id: string;
    email: string;
    wallet_address: string;
  };
}

export const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const [showPopup, setShowPopup] = useState(false);
  const [connectedWalletAddress, setConnectedWalletAddress] = useState("");
  const [walletUser, setWalletUser] = useState<WalletUserState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleWalletLogin = async (walletAddress: string) => {
    setIsLoading(true);
    setConnectedWalletAddress(walletAddress);

    try {
      const response = await fetch("/api/auth/check-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet_address: walletAddress }),
      });

      const data = await response.json();

      setWalletUser(data);
      setShowPopup(true);
    } catch (error) {
      console.error("Error checking wallet:", error);
      toast.error("Failed to verify wallet status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setConnectedWalletAddress("");
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
      {walletUser && (
        <WalletConnectPopup
          email={walletUser.user.email}
          isOpen={showPopup}
          onClose={handleClosePopup}
          connectedWalletAddress={connectedWalletAddress}
          newUser={walletUser.isNewUser}
          needsEmailSetup={walletUser.needsEmailSetup}
          walletUserId={walletUser.user.user_id}
        />
      )}
    </>
  );
};
