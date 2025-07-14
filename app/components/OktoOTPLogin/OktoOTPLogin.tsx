import { checkUserLoginMethod } from "@/lib/auth/checkUserLoginMethod";
import { useOkto } from "@okto_web3/react-sdk";
import Cookies from "js-cookie";
import { Mail } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import styles from "./OktoOTPLogin.module.scss";

const OktoOTPLogin = () => {
  const oktoClient = useOkto();

  const [email, setEmail] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  // Refs for OTP inputs
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }

    // Handle paste
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 6);
        const newOtpValues = [...otpValues];
        for (let i = 0; i < digits.length && i < 6; i++) {
          newOtpValues[i] = digits[i];
        }
        setOtpValues(newOtpValues);

        // Focus the next empty input or the last one
        const nextIndex = Math.min(digits.length, 5);
        otpRefs[nextIndex].current?.focus();
      });
    }
  };

  async function handleSendOTP() {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setIsLoading(true);

      const accountData = await checkUserLoginMethod(email);

      // If the account is already associated with Google login, show an error
      if (accountData.loginMethod === "google") {
        toast.error(
          "You already have an account with Google login. Please use Google login instead.",
        );
        return;
      }

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
      // Clear OTP inputs
      setOtpValues(["", "", "", "", "", ""]);
      toast.success("OTP resent to your email!");
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOTP() {
    const otp = otpValues.join("");

    if (!email || otp.length !== 6 || !token) {
      toast.error("Please enter the complete 6-digit OTP");
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
          login_method: "email",
          okto_wallet_address: walletAddress,
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
      toast.error("Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.otpLoginContainer}>
      {!showOtpInput ? (
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <div className="relative">
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendOTP();
                }
              }}
              disabled={isLoading}
            />
            <Mail
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
        </div>
      ) : (
        <div className={styles.otpSection}>
          <div className={styles.otpHeader}>
            <h2>Verify Your Email Address</h2>
            <p>
              Please enter the 6-digit code we sent to <strong>{email}</strong>.
            </p>
          </div>

          <div className={styles.otpInputContainer}>
            {otpValues.map((value, index) => (
              <input
                key={index}
                ref={otpRefs[index]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                value={value}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className={styles.otpInput}
                disabled={isLoading}
                aria-label={`OTP digit ${index + 1}`}
                title={`Enter digit ${index + 1} of verification code`}
              />
            ))}
          </div>

          <button
            onClick={handleResendOTP}
            disabled={isLoading}
            className={styles.resendButton}
          >
            Send Again
          </button>
        </div>
      )}

      <button
        onClick={!showOtpInput ? handleSendOTP : handleVerifyOTP}
        disabled={isLoading}
        className={styles.submitButton}
      >
        {isLoading
          ? !showOtpInput
            ? "Sending..."
            : "Verifying..."
          : !showOtpInput
            ? "Send OTP"
            : "Verify & Login"}
      </button>
    </div>
  );
};

export default OktoOTPLogin;
