"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { useActiveAccount } from "thirdweb/react";
import Cookies from "js-cookie";
import { dispatchAuthChanged } from "@/app/utils/authEvents";

export interface User {
  user_id: string;
  email?: string;
  wallet_address?: string;
  auth_method: "email" | "wallet" | "hybrid";
  talent?: boolean;
  mentor?: boolean;
  recruiter?: boolean;
  talent_status?: string;
  mentor_status?: string;
  recruiter_status?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  walletConnected: boolean;
  authMethod: "email" | "wallet" | "hybrid" | null;
}

interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    walletConnected: false,
    authMethod: null,
  });

  const account = useActiveAccount();

  const login = useCallback((user: User) => {
    setAuthState({
      user,
      isLoading: false,
      isAuthenticated: true,
      walletConnected: !!account?.address,
      authMethod: user.auth_method,
    });
    dispatchAuthChanged();
  }, [account?.address]);

  const logout = useCallback(() => {
    // Clear cookies
    Cookies.remove("session_token");
    Cookies.remove("user_id");
    Cookies.remove("user_email");
    Cookies.remove("loggedIn_user");

    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      walletConnected: !!account?.address,
      authMethod: null,
    });
    dispatchAuthChanged();
  }, [account?.address]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setAuthState(prev => {
      if (!prev.user) return prev;

      const updatedUser = { ...prev.user, ...updates };
      
      // Update cookie
      Cookies.set("loggedIn_user", JSON.stringify(updatedUser), {
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: 7,
      });

      return {
        ...prev,
        user: updatedUser,
      };
    });
    dispatchAuthChanged();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const userData = await response.json();
        const user: User = {
          user_id: userData.user_id,
          email: userData.email,
          wallet_address: userData.wallet_address,
          auth_method: userData.auth_method || "email",
          talent_status: userData.talent_status,
          mentor_status: userData.mentor_status,
          recruiter_status: userData.recruiter_status,
        };

        login(user);
      } else {
        logout();
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      logout();
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [login, logout]);

  // Initialize auth state from cookies
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const userId = Cookies.get("user_id");
        const loggedInUser = Cookies.get("loggedIn_user");

        if (userId && loggedInUser) {
          const user = JSON.parse(loggedInUser);
          setAuthState({
            user,
            isLoading: false,
            isAuthenticated: true,
            walletConnected: !!account?.address,
            authMethod: user.auth_method || (user.wallet_address ? "wallet" : "email"),
          });
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            walletConnected: !!account?.address,
          }));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          user: null,
          isAuthenticated: false,
          walletConnected: !!account?.address,
        }));
      }
    };

    void initializeAuth();
  }, [account?.address]);

  // Keep session auth stable even if the wallet connector briefly reconnects.
  useEffect(() => {
    setAuthState(prev => ({
      ...prev,
      walletConnected: !!account?.address,
    }));
  }, [account?.address]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
