import React, { useState } from "react";
import { useOkto } from "@okto_web3/react-sdk";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
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
      const session = await oktoClient.loginUsingEmail(
        email,
        otp,
        token,
        (session: any) => {
          localStorage.setItem("okto_session", JSON.stringify(session));
        },
      );
      console.log("Login Successful:", session);
      toast.success("Login successful!");
      // You can add additional logic here, like redirecting the user
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Failed to verify OTP. Please try again.");
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
