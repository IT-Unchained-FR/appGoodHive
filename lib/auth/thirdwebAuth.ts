import { isAddress } from "thirdweb";

export interface WalletAuthData {
  address: string;
  email?: string;
}

/**
 * Validates if a wallet address is valid
 */
export function validateWalletAddress(address: string): boolean {
  if (!address) return false;
  
  try {
    return isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Normalizes wallet address to lowercase
 */
export function normalizeWalletAddress(address: string): string {
  return address.toLowerCase();
}

/**
 * Extracts wallet data from Thirdweb account
 */
export function extractWalletAuthData(account: any, email?: string): WalletAuthData | null {
  if (!account?.address) {
    return null;
  }

  if (!validateWalletAddress(account.address)) {
    throw new Error("Invalid wallet address");
  }

  return {
    address: normalizeWalletAddress(account.address),
    email: email || undefined,
  };
}

/**
 * Authenticates user with wallet via API
 */
export async function authenticateWithWallet(
  walletData: WalletAuthData
): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  isNewUser?: boolean;
}> {
  try {
    const response = await fetch("/api/auth/thirdweb-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletAddress: walletData.address,
        email: walletData.email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Authentication failed",
      };
    }

    return {
      success: true,
      user: data.user,
      isNewUser: data.isNewUser,
    };
  } catch (error) {
    console.error("Wallet authentication error:", error);
    return {
      success: false,
      error: "Network error during authentication",
    };
  }
}

/**
 * Checks if user is authenticated via wallet
 */
export function isWalletAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  
  const sessionToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("session_token="));
    
  return !!sessionToken;
}

/**
 * Logs out wallet user and clears all session data
 */
export async function logoutWalletUser(): Promise<void> {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Logout request failed");
    }
  } catch (error) {
    console.error("Logout API error:", error);
  }

  // Clear cookies manually as fallback to ensure cleanup
  if (typeof window !== "undefined") {
    const cookiesToClear = [
      "session_token",
      "user_id", 
      "user_email",
      "loggedIn_user",
      "user_address"
    ];

    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
    });

    // Also clear localStorage if used
    try {
      localStorage.removeItem("walletconnect");
      localStorage.removeItem("thirdweb:active-wallet");
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}