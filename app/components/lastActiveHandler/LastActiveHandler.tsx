"use client";

import React from "react";
import { useEffect } from "react";
import Cookies from "js-cookie";
import { useAccount } from "wagmi";

const LastActiveHandler = () => {
  const { address } = useAccount();
  const walletAddress = address;

  useEffect(() => {
    const user_email = Cookies.get("user_email");
    const sendLastActiveTime = async () => {
      try {
        const lastActiveTimeResponse = await fetch(
          "/api/auth/last-active-time",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress, email: user_email }),
          }
        );

        console.log(lastActiveRequestSentTime, "lastActiveRequestSentTime");

        if (lastActiveTimeResponse.ok) {
          Cookies.set(
            "last_active_request_sent_time",
            new Date().toISOString()
          );
        }
      } catch (error) {
        console.error(error, "Error sending last active time");
      } finally {
      }
    };

    // Send the last active time if it has been more than 5 minutes since the last request
    const lastActiveRequestSentTime = Cookies.get(
      "last_active_request_sent_time"
    );

    if (lastActiveRequestSentTime === undefined) {
      if (walletAddress) {
        sendLastActiveTime();
      }
    } else {
      const last_req_less_than_5_minutes =
        new Date().getTime() -
          new Date(lastActiveRequestSentTime as string).getTime() <
        300000;

      console.log(last_req_less_than_5_minutes, "last_req_less_than_5_minutes");
      if ((walletAddress || user_email) && !last_req_less_than_5_minutes) {
        sendLastActiveTime();
      }
    }
  }, [walletAddress]);
  return <></>;
};

export default LastActiveHandler;
