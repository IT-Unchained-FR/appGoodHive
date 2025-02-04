import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { AddressContext } from "../context";
import { useAccount } from "wagmi";
import { AuthenticationStatus } from "@rainbow-me/rainbowkit";
import Cookies from "js-cookie";

const AddressContextWrapper = ({
  children,
  setAuthStatus,
}: {
  children: React.ReactNode;
  setAuthStatus: Dispatch<SetStateAction<AuthenticationStatus>>;
}) => {
  const user_id = Cookies.get("user_id");
  const { address } = useAccount();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Send a request to the server to store last active time
  useEffect(() => {
    const user_email = Cookies.get("user_email");
    const sendLastActiveTime = async () => {
      if (!user_id) return;
      try {
        const lastActiveTimeResponse = await fetch(
          "/api/auth/last-active-time",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress, user_id }),
          },
        );

        console.log(lastActiveRequestSentTime, "lastActiveRequestSentTime");

        if (lastActiveTimeResponse.ok) {
          Cookies.set(
            "last_active_request_sent_time",
            new Date().toISOString(),
          );
        }
      } catch (error) {
        console.error(error, "Error sending last active time");
      } finally {
      }
    };

    // Send the last active time if it has been more than 5 minutes since the last request
    const lastActiveRequestSentTime = Cookies.get(
      "last_active_request_sent_time",
    );

    console.log(lastActiveRequestSentTime, "lastActiveRequestSentTime");

    if (lastActiveRequestSentTime === undefined) {
      if (walletAddress || user_email) {
        sendLastActiveTime();
      }
    } else {
      const last_req_less_than_5_minutes =
        new Date().getTime() -
          new Date(lastActiveRequestSentTime as string).getTime() <
        300000;

      if ((walletAddress || user_email) && !last_req_less_than_5_minutes) {
        sendLastActiveTime();
      }
    }
  }, [walletAddress]);

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
