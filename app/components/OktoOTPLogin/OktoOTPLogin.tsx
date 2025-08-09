import { checkUserLoginMethod } from "@/lib/auth/checkUserLoginMethod";
import { useOkto } from "@okto_web3/react-sdk";
import Cookies from "js-cookie";
import { Mail } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import styles from "./OktoOTPLogin.module.scss";

const OktoOTPLogin = ({
  setIsLoading,
  isLoading,
}: {
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
}) => {
  const oktoClient = useOkto();

  const [email, setEmail] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [token, setToken] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("OktoOTPLogin component mounted", { isLoading });

    // Reset loading state on mount to ensure it's not stuck
    if (isLoading) {
      console.log("Resetting loading state on mount");
      setIsLoading(false);
    }

    return () => {
      console.log("OktoOTPLogin component unmounted");
    };
  }, []);

  useEffect(() => {
    console.log("OktoOTPLogin state changed:", {
      email,
      showOtpInput,
      token: !!token,
      isLoading,
    });
  }, [email, showOtpInput, token, isLoading]);

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

  async function handleSendOTP(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();

    console.log("handleSendOTP called", { email, isLoading });

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setIsLoading(true);

      const accountData = await checkUserLoginMethod(email);

      console.log("accountData", accountData);
      // If the account is already associated with Google login, show an error
      if (accountData.loginMethod === "google") {
        toast.error(
          "You already have an account with Google login. Please use Google login instead.",
        );
        setIsLoading(false);
        return;
      }

      console.log("Sending OTP to:", email);
      const response = await oktoClient.sendOTP(email, "email");
      console.log("OTP Sent:", response);

      console.log("📋 OTP Response received:", response);

      if (response && response.token) {
        console.log("✅ Valid response with token, setting up OTP input");
        setToken(response.token);

        // Set OTP input state
        setShowOtpInput(true);
        console.log("🔄 State after setting showOtpInput:", {
          token: response.token,
          showOtpInput: true,
        });

        // Reset loading state after UI update
        setIsLoading(false);

        toast.success("OTP sent to your email!");
      } else {
        console.log("❌ Invalid response:", response);
        throw new Error("Invalid response from OTP service");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send OTP. Please try again.");
      setIsLoading(false); // Reset loading on error
    }
  }

  async function handleResendOTP(e?: React.MouseEvent) {
    e?.preventDefault();
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

  async function handleVerifyOTP(e?: React.MouseEvent) {
    e?.preventDefault();
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        width: "100%",
        position: "relative",
      }}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner} />
            {showOtpInput ? "Verifying..." : "Sending OTP..."}
          </div>
        </div>
      )}
      {!showOtpInput ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <label
            htmlFor="email"
            style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#374151",
            }}
          >
            Email
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSendOTP();
                }
              }}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "0.75rem 3rem 0.75rem 1rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                fontSize: "1rem",
                transition: "all 0.2s",
                background: "white",
                outline: "none",
              }}
            />
            <Mail
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
              }}
              size={20}
            />
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            textAlign: "center",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#111827",
                marginBottom: "0.5rem",
              }}
            >
              Verify Your Email Address
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                lineHeight: "1.5",
              }}
            >
              Please enter the 6-digit code we sent to{" "}
              <strong
                style={{
                  color: "#111827",
                  textDecoration: "underline",
                }}
              >
                {email}
              </strong>
              .
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
              margin: "1rem 0",
            }}
          >
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
                disabled={isLoading}
                aria-label={`OTP digit ${index + 1}`}
                title={`Enter digit ${index + 1} of verification code`}
                style={{
                  width: "3rem",
                  height: "3rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  textAlign: "center",
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#111827",
                  background: "white",
                  transition: "all 0.2s",
                  outline: "none",
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleResendOTP}
            disabled={isLoading}
            style={{
              background: "none",
              border: "none",
              color: "#f59e0b",
              fontSize: "0.875rem",
              fontWeight: "500",
              cursor: isLoading ? "not-allowed" : "pointer",
              padding: "0.5rem",
              transition: "color 0.2s",
              textDecoration: "underline",
            }}
          >
            Send Again
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          console.log("🔴 BUTTON CLICKED!", {
            showOtpInput,
            isLoading,
            email,
            buttonDisabled: isLoading || (!showOtpInput && !email.trim()),
          });
          e.preventDefault();
          e.stopPropagation();

          if (!showOtpInput) {
            console.log("📧 Calling handleSendOTP");
            handleSendOTP(e);
          } else {
            console.log("🔐 Calling handleVerifyOTP");
            handleVerifyOTP(e);
          }
        }}
        disabled={isLoading || (!showOtpInput && !email.trim())}
        style={{
          width: "100%",
          background: "linear-gradient(135deg, #ffc905 0%, #ffb300 100%)",
          color: "#111",
          border: "none",
          borderRadius: "0.5rem",
          padding: "0.875rem 1.5rem",
          fontSize: "1rem",
          fontWeight: "600",
          cursor:
            isLoading || (!showOtpInput && !email.trim())
              ? "not-allowed"
              : "pointer",
          transition: "all 0.2s",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          opacity: isLoading || (!showOtpInput && !email.trim()) ? 0.6 : 1,
          position: "relative",
          zIndex: 10,
        }}
      >
        {(() => {
          if (isLoading) {
            return showOtpInput ? "Verifying..." : "Sending...";
          }
          return showOtpInput ? "Verify & Login" : "Send OTP";
        })()}
      </button>
    </div>
  );
};

export default OktoOTPLogin;
