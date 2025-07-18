"use client";

import { AuthenticationStatus } from "@rainbow-me/rainbowkit";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { AddressContext } from "../context";

const AddressContextWrapper = ({
  children,
  setAuthStatus,
}: {
  children: React.ReactNode;
  setAuthStatus: Dispatch<SetStateAction<AuthenticationStatus>>;
}) => {
  const { address } = useAccount();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user info from server-side validation
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUserId(data.user.user_id);
          setWalletAddress(data.user.wallet_address);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, []);

  // Send last active time using server-validated user ID
  useEffect(() => {
    const sendLastActiveTime = async () => {
      if (!userId) return;

      try {
        const lastActiveTimeResponse = await fetch(
          "/api/auth/last-active-time",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
          },
        );

        if (lastActiveTimeResponse.ok) {
          // Store timestamp in localStorage instead of cookies
          localStorage.setItem(
            "last_active_request_sent_time",
            new Date().toISOString(),
          );
        }
      } catch (error) {
        console.error("Error sending last active time:", error);
      }
    };

    const lastActiveRequestSentTime = localStorage.getItem(
      "last_active_request_sent_time",
    );

    if (!lastActiveRequestSentTime) {
      if (userId) {
        sendLastActiveTime();
      }
    } else {
      const last_req_less_than_5_minutes =
        new Date().getTime() - new Date(lastActiveRequestSentTime).getTime() <
        300000;

      if (userId && !last_req_less_than_5_minutes) {
        sendLastActiveTime();
      }
    }
  }, [userId]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const checkAuthResponse = await fetch(
          `/api/auth/me?walletAddress=${address}`,
        );

        const authResponse = await checkAuthResponse.json();

        const authenticated = Boolean(authResponse?.ok === true);

        if (authenticated) {
          setAuthStatus("authenticated");
          setWalletAddress(authResponse?.address);
        } else {
          setAuthStatus("unauthenticated");
        }
      } catch (error) {
        setAuthStatus("unauthenticated");
      } finally {
      }
    };

    if (address) fetchStatus();

    window.addEventListener("focus", fetchStatus);

    return () => window.removeEventListener("focus", fetchStatus);
  }, [address]);

  return (
    <div className="address__context__wrapper">
      <AddressContext.Provider value={walletAddress as string}>
        {children}
      </AddressContext.Provider>
    </div>
  );
};

export default AddressContextWrapper;
