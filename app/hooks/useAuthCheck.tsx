"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { thirdwebClient } from "@/clients";
import { activeChain } from "@/config/chains";
import { connectModalOptions, supportedWallets } from "@/lib/auth/walletConfig";
import { useActiveAccount, useConnectModal } from "thirdweb/react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { useCallback, useRef } from "react";

export function useAuthCheck() {
  const { isAuthenticated, user } = useAuth();
  const account = useActiveAccount();
  const user_id = Cookies.get("user_id");
  const { connect, isConnecting } = useConnectModal();
  const connectInFlightRef = useRef(false);

  const openConnectModal = useCallback(async () => {
    if (connectInFlightRef.current || isConnecting) {
      return;
    }

    connectInFlightRef.current = true;

    try {
      await connect({
        client: thirdwebClient,
        wallets: supportedWallets,
        chain: activeChain,
        ...connectModalOptions,
      });
    } catch (error) {
      console.debug("Connect modal dismissed", error);
    } finally {
      connectInFlightRef.current = false;
    }
  }, [connect, isConnecting]);

  const checkAuthAndShowConnectPrompt = useCallback(
    (actionDescription: string = "perform this action") => {
      // Check if user is authenticated (either through traditional auth or Thirdweb)
      if (!isAuthenticated && !user_id && !account?.address) {
        // Show a toast prompting user to connect
        toast.error(`Please connect your wallet to ${actionDescription}`, {
          duration: 5000,
          icon: '🔐',
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #FCD34D',
          },
        });
        void openConnectModal();

        return false; // Not authenticated
      }
      
      return true; // Authenticated
    },
    [account?.address, isAuthenticated, openConnectModal, user_id],
  );

  return {
    isAuthenticated: isAuthenticated || !!user_id || !!account?.address,
    user,
    user_id,
    checkAuthAndShowConnectPrompt,
    openConnectModal,
  };
}
