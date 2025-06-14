import React, { useState } from "react";
import { useOkto, getAccount } from "@okto_web3/react-sdk";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import Cookies from "js-cookie";
import styles from "./OktoOTPLogin.module.scss";

const OktoOTPLogin = () => {
  const oktoClient = useOkto();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  async function handleSendOTP() {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setIsLoading(true);

      const response = await oktoClient.sendOTP(email, "email");
      console.log("OTP Sent:", response);
      setToken(response.token);
      setShowOtpInput(true);
      toast.success("OTP sent to your email!");
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOTP() {
    if (!email || !token) {
      toast.error("Please request a new OTP first");
      return;
    }

    try {
      setIsLoading(true);
      const response = await oktoClient.resendOTP(email, token, "email");
      console.log("OTP Resent:", response);
      setToken(response.token);
      toast.success("OTP resent to your email!");
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (!email || !otp || !token) {
      toast.error("Please enter all required fields");
      return;
    }

    try {
      setIsLoading(true);
      const walletAddress = await oktoClient.loginUsingEmail(
        email,
        otp,
        token,
        (session: any) => {
          localStorage.setItem("okto_session", JSON.stringify(session));
        },
      );
      console.log("Login Successful:", walletAddress);
      console.log("Okto Client:", oktoClient);
      console.log("Okto User ID:", (oktoClient as any)._userKeys?.userId);

      toast.success("Login successful!");

      // Verify wallet address and create/update user
      const verifyResponse = await fetch("/api/auth/verify-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          user_id: (oktoClient as any)._userKeys?.userId,
          email: email,
        }),
      });

      const data = await verifyResponse.json();

      // Store minimal user data in cookies
      Cookies.set("user_id", data.user.user_id);
      Cookies.set("user_email", data.user.email);
      Cookies.set("user_address", data.user.wallet_address);

      toast.success("Welcome to the hive! 🐝");
      window.location.href = "/talents/my-profile";
    } catch (error: any) {
      console.error("Error verifying OTP:", error);

      // Check if it's a wallet address conflict error

      // Check if the existing account is using Google login
      try {
        const checkAccountResponse = await fetch(
          `/api/auth/check-account?email=${email}`,
        );
        const accountData = await checkAccountResponse.json();

        if (accountData.loginMethod === "google") {
          toast.error(
            "You already have an account with Google login. Please use Google login instead.",
          );
        } else {
          toast.error("This email is already associated with another account.");
        }
      } catch (checkError) {
        console.error("Error checking account:", checkError);
        toast.error("Failed to verify account status. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.otpLoginContainer}>
      <div className={styles.formWrapper}>
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <div className="relative">
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || showOtpInput}
            />
            <Mail
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
        </div>

        {showOtpInput && (
          <div className={styles.inputGroup}>
            <label htmlFor="otp">OTP</label>
            <div className="relative">
              <input
                type="text"
                id="otp"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isLoading}
              />
              <Lock
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>
          </div>
        )}

        <div className={styles.buttonGroup}>
          {!showOtpInput ? (
            <button
              onClick={handleSendOTP}
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? "Sending..." : "Send OTP"}
            </button>
          ) : (
            <>
              <button
                onClick={handleResendOTP}
                disabled={isLoading}
                className={styles.secondaryButton}
              >
                {isLoading ? "Resending..." : "Resend OTP"}
              </button>
              <button
                onClick={handleVerifyOTP}
                disabled={isLoading}
                className={styles.submitButton}
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OktoOTPLogin;
