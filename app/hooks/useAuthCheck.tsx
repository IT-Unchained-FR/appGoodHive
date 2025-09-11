"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { useActiveAccount } from "thirdweb/react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

export function useAuthCheck() {
  const { isAuthenticated, user } = useAuth();
  const account = useActiveAccount();
  const user_id = Cookies.get("user_id");

  const checkAuthAndShowConnectPrompt = (actionDescription: string = "perform this action") => {
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
      
      // Programmatically click the connect button if it exists
      // The connect button should be in the navbar
      // Small delay to ensure toast is visible first
      setTimeout(() => {
        // Try to find the Thirdweb ConnectButton by various methods
        // Method 1: Find by button text
        const allButtons = document.querySelectorAll('button');
        for (const button of allButtons) {
          const buttonText = button.textContent?.toLowerCase() || '';
          if (buttonText.includes('connect') && buttonText.includes('wallet')) {
            (button as HTMLButtonElement).click();
            return;
          }
        }
        
        // Method 2: Find button that contains wallet address (when connected but not authenticated)
        for (const button of allButtons) {
          const buttonText = button.textContent || '';
          // Check if it looks like a wallet address (0x...)
          if (buttonText.startsWith('0x') && buttonText.length > 10) {
            (button as HTMLButtonElement).click();
            return;
          }
        }
        
        // Method 3: Find by aria-label or other attributes
        const connectButton = document.querySelector('[aria-label*="Connect"], [aria-label*="wallet"], button[class*="connect"]') as HTMLButtonElement;
        if (connectButton) {
          connectButton.click();
        }
      }, 100);
      
      return false; // Not authenticated
    }
    
    return true; // Authenticated
  };

  return {
    isAuthenticated: isAuthenticated || !!user_id || !!account?.address,
    user,
    user_id,
    checkAuthAndShowConnectPrompt,
  };
}