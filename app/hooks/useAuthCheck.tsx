"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { thirdwebClient } from "@/clients";
import { activeChain } from "@/config/chains";
import {
  authenticateWithWallet,
  detectWalletType,
  extractWalletAuthData,
  getEmailFromInAppWallet,
} from "@/lib/auth/thirdwebAuth";
import { connectModalOptions, supportedWallets } from "@/lib/auth/walletConfig";
import { ReturnUrlManager } from "@/app/utils/returnUrlManager";
import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";
import { useActiveAccount, useConnectModal } from "thirdweb/react";
import { useCurrentUserId } from "./useCurrentUserId";
import { dispatchAuthChanged } from "@/app/utils/authEvents";

export function useAuthCheck() {
  const { isAuthenticated, user, login, refreshUser } = useAuth();
  const account = useActiveAccount();
  const pathname = usePathname();
  const user_id = useCurrentUserId();
  const { connect, isConnecting } = useConnectModal();
  const connectInFlightRef = useRef(false);
  const modalTriggerPathnameRef = useRef<string | null>(null);
  const authInFlightRef = useRef(false);
  const sessionAuthenticated = isAuthenticated || !!user_id;

  const authenticateWalletAccount = useCallback(
    async (accountToAuth?: any) => {
      const targetAccount = accountToAuth || account;

      if (!targetAccount?.address) {
        return false;
      }

      if (authInFlightRef.current || sessionAuthenticated) {
        return true;
      }

      authInFlightRef.current = true;

      try {
        let extractedEmail: string | undefined;
        let isThirdwebWallet = false;

        try {
          const email = await getEmailFromInAppWallet(thirdwebClient);
          if (email) {
            extractedEmail = email;
            isThirdwebWallet = true;
          }
        } catch (error) {
          console.debug("No in-app wallet email detected:", error);
        }

        const walletData = extractWalletAuthData(
          targetAccount,
          extractedEmail,
          isThirdwebWallet,
        );

        if (!walletData) {
          return false;
        }

        if (!walletData.isThirdwebWallet) {
          const typeInfo = await detectWalletType(targetAccount.address);
          if (typeInfo.isThirdwebWallet) {
            walletData.isThirdwebWallet = true;
            walletData.walletType = "in-app";
            if (!walletData.email && typeInfo.userInfo?.primaryEmail) {
              walletData.email = typeInfo.userInfo.primaryEmail;
            }
          }
        } else {
          walletData.walletType = "in-app";
        }

        const authResult = await authenticateWithWallet(walletData);

        if (authResult.success && authResult.user) {
          login(authResult.user);
          await refreshUser();
          dispatchAuthChanged();
          return true;
        }

        return false;
      } catch (error) {
        console.error("Wallet authentication failed:", error);
        return false;
      } finally {
        authInFlightRef.current = false;
      }
    },
    [account, login, refreshUser, sessionAuthenticated],
  );

  const openConnectModal = useCallback(async () => {
    if (connectInFlightRef.current || isConnecting) {
      return;
    }

    connectInFlightRef.current = true;
    modalTriggerPathnameRef.current = pathname;

    try {
      if (account?.address && !sessionAuthenticated) {
        await authenticateWalletAccount(account);
        return;
      }

      const wallet = await connect({
        client: thirdwebClient,
        wallets: supportedWallets,
        chain: activeChain,
        ...connectModalOptions,
      });

      const connectedAccount = await wallet?.getAccount?.();
      await authenticateWalletAccount(connectedAccount);
    } catch (error) {
      console.debug("Connect modal dismissed", error);
    } finally {
      connectInFlightRef.current = false;
      modalTriggerPathnameRef.current = null;
    }
  }, [
    account,
    authenticateWalletAccount,
    connect,
    sessionAuthenticated,
    isConnecting,
    pathname,
  ]);

  const checkAuthAndShowConnectPrompt = useCallback(
    (
      actionDescription: string = "perform this action",
      intendedAction: 'contact' | 'access-protected' | 'service-action' = 'access-protected',
      actionData?: any
    ) => {
      // If wallet is connected but session state is not ready, trigger sync first.
      if (!sessionAuthenticated && account?.address) {
        void authenticateWalletAccount(account);
        return false;
      }

      // Check if user is authenticated by confirmed session state.
      if (!sessionAuthenticated) {
        // Store the current context for prompted authentication
        const currentUrl = pathname;

        if (intendedAction === 'contact') {
          ReturnUrlManager.setContactAction(currentUrl, actionData);
        } else if (intendedAction === 'access-protected') {
          // For access-protected, only set context if none exists
          // This prevents overwriting context set by ProtectedLink
          const existingContext = ReturnUrlManager.getAuthContext();
          if (!existingContext || !existingContext.returnUrl) {
            console.log('useAuthCheck: Setting protected route access for current URL:', currentUrl);
            ReturnUrlManager.setProtectedRouteAccess(currentUrl);
          } else {
            console.log('useAuthCheck: Keeping existing context:', existingContext);
          }
        } else if (intendedAction === 'service-action') {
          ReturnUrlManager.setServiceAction(currentUrl, actionData?.serviceType);
        }

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
    [
      account,
      authenticateWalletAccount,
      openConnectModal,
      pathname,
      sessionAuthenticated,
    ],
  );

  const setManualConnection = useCallback(
    (currentUrl?: string) => {
      ReturnUrlManager.setManualConnection(currentUrl ?? pathname);
    },
    [pathname],
  );

  // Effect to handle modal cleanup when navigating away
  useEffect(() => {
    const closeModal = () => {
      // Try multiple selectors as Thirdweb's modal structure may vary
      const closeButtonSelectors = [
        'button[aria-label="Close"]',
        'button[aria-label="close"]',
        'button[data-close]',
        '[role="dialog"] button:first-child',
        'button svg[data-testid="close-icon"]',
        // Look for any button with an X or close icon
        'div[role="dialog"] button[type="button"]:first-of-type',
        // Thirdweb specific selectors
        '[data-tw-modal] button[aria-label="Close"]',
        '.tw-connected-wallet-modal button[aria-label="Close"]'
      ];

      let modalClosed = false;
      for (const selector of closeButtonSelectors) {
        try {
          const closeButton = document.querySelector(selector);
          if (closeButton instanceof HTMLElement) {
            closeButton.click();
            modalClosed = true;
            console.debug('Modal closed using selector:', selector);
            break;
          }
        } catch (e) {
          // Selector might be invalid, continue to next
          continue;
        }
      }

      // If no close button found, try to press Escape key
      if (!modalClosed) {
        const escEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true
        });
        document.dispatchEvent(escEvent);
      }

      return modalClosed;
    };

    // Always try to close any open modal when pathname changes
    // This handles both:
    // 1. Navigation away from a page that triggered the modal
    // 2. Direct navigation to protected routes then navigating away
    const modalCheck = setTimeout(() => {
      const modalPresent = document.querySelector('[role="dialog"], [data-tw-modal], .tw-connected-wallet-modal');
      if (modalPresent) {
        // A modal is present, close it
        closeModal();
        // Clean up our tracking refs
        connectInFlightRef.current = false;
        modalTriggerPathnameRef.current = null;
      }
    }, 100);

    return () => clearTimeout(modalCheck);
  }, [pathname]); // Run whenever pathname changes

  return {
    isAuthenticated: sessionAuthenticated,
    user,
    user_id,
    checkAuthAndShowConnectPrompt,
    openConnectModal,
    setManualConnection,
  };
}
