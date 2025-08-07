"use client";

import { checkUserLoginMethod } from "@/lib/auth/checkUserLoginMethod";
import { useOkto } from "@okto_web3/react-sdk";
import { GoogleLogin } from "@react-oauth/google";
import Cookies from "js-cookie";
import { Mail } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import styles from "./WalletConnectPopup.module.scss";

interface WalletConnectPopupProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  connectedWalletAddress: string;
  newUser: boolean;
  needsEmailSetup: boolean;
  walletUserId: string;
}

export const WalletConnectPopup = ({
  isOpen,
  onClose,
  email,
  newUser,
  connectedWalletAddress,
  needsEmailSetup,
  walletUserId,
}: WalletConnectPopupProps) => {
  const oktoClient = useOkto();
  const [isLoading, setIsLoading] = useState(false);
  
  // Email OTP state
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [otpToken, setOtpToken] = useState("");
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

  if (!isOpen) return null;

  const handleGoogleLogin = async (credentialResponse: any) => {
    console.log(credentialResponse, "credentialResponse...goodhive");
    setIsLoading(true);

    try {
      const base64Url = credentialResponse.credential.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );

      const userInfo = JSON.parse(jsonPayload);
      const userEmail = userInfo.email;

      if (email !== userEmail && !needsEmailSetup) {
        toast.error("This Email Already Merged With Different Wallet Address");
        setIsLoading(false);
        return;
      }

      // Fetch Okto Wallet Address
      const oktoUser = await oktoClient.loginUsingOAuth({
        idToken: credentialResponse.credential,
        provider: "google",
      });

      // if the user is new and needs to setup email then update the user with the new email
      if (needsEmailSetup) {
        // Update the user with the new email
        const updateUserResponse = await fetch("/api/auth/update-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: walletUserId,
            email: userEmail,
          }),
        });

        if (!updateUserResponse.ok) {
          const errorData = await updateUserResponse.json();
          throw new Error(errorData.error);
        }

        const updateData = await updateUserResponse.json();
        if (updateData.error) {
          throw new Error(updateData.error);
        }
      }

      // Verify wallet address and create/update user
      const verifyResponse = await fetch("/api/auth/verify-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: connectedWalletAddress,
          login_method: "google",
          okto_wallet_address: oktoUser,
          user_id: walletUserId, // Okto might return either the ID directly or an object with id
          email: userEmail, // Include the email from Google OAuth
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Failed to verify wallet address");
      }

      const data = await verifyResponse.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Store minimal user data in cookies
      Cookies.set("user_id", data.user.user_id);
      Cookies.set("user_email", data.user.email);
      Cookies.set("user_address", data.user.wallet_address);

      toast.success("Welcome to the hive! 🐝");
      window.location.href = "/talents/my-profile";
    } catch (error: any) {
      console.error("Google login error:", error.message);

      // Clear Okto session on error
      try {
        oktoClient.sessionClear();
      } catch (clearError) {
        console.error("Error clearing Okto session:", clearError);
      }

      toast.error(error.message || "Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (newUser) return; // New users can't skip
    onClose();
  };

  // Email OTP handlers
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 6);
        const newOtpValues = [...otpValues];
        for (let i = 0; i < digits.length && i < 6; i++) {
          newOtpValues[i] = digits[i];
        }
        setOtpValues(newOtpValues);
        const nextIndex = Math.min(digits.length, 5);
        otpRefs[nextIndex].current?.focus();
      });
    }
  };

  const handleSendOTP = async () => {
    if (!otpEmail) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setIsLoading(true);
      const accountData = await checkUserLoginMethod(otpEmail);

      if (accountData.loginMethod === "google") {
        toast.error(
          "You already have an account with Google login. Please use Google login instead.",
        );
        return;
      }

      const response = await oktoClient.sendOTP(otpEmail, "email");
      setOtpToken(response.token);
      setShowOtpInput(true);
      toast.success("OTP sent to your email!");
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!otpEmail || !otpToken) {
      toast.error("Please request a new OTP first");
      return;
    }

    try {
      setIsLoading(true);
      const response = await oktoClient.resendOTP(otpEmail, otpToken, "email");
      setOtpToken(response.token);
      setOtpValues(["", "", "", "", "", ""]);
      toast.success("OTP resent to your email!");
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    const otp = otpValues.join("");

    if (!otpEmail || otp.length !== 6 || !otpToken) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    try {
      setIsLoading(true);
      const oktoWalletAddress = await oktoClient.loginUsingEmail(
        otpEmail,
        otp,
        otpToken,
        (session: any) => {
          localStorage.setItem("okto_session", JSON.stringify(session));
        },
      );

      // if the user is new and needs to setup email then update the user with the new email
      if (needsEmailSetup) {
        const updateUserResponse = await fetch("/api/auth/update-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: walletUserId,
            email: otpEmail,
          }),
        });

        if (!updateUserResponse.ok) {
          const errorData = await updateUserResponse.json();
          throw new Error(errorData.error);
        }

        const updateData = await updateUserResponse.json();
        if (updateData.error) {
          throw new Error(updateData.error);
        }
      }

      // Verify wallet address and create/update user
      const verifyResponse = await fetch("/api/auth/verify-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: connectedWalletAddress,
          login_method: "email",
          okto_wallet_address: oktoWalletAddress,
          user_id: walletUserId,
          email: otpEmail,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Failed to verify wallet address");
      }

      const data = await verifyResponse.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Store minimal user data in cookies
      Cookies.set("user_id", data.user.user_id);
      Cookies.set("user_email", data.user.email);
      Cookies.set("user_address", data.user.wallet_address);

      toast.success("Welcome to the hive! 🐝");
      window.location.href = "/talents/my-profile";
    } catch (error: any) {
      console.error("Email OTP verification error:", error.message);
      try {
        oktoClient.sessionClear();
      } catch (clearError) {
        console.error("Error clearing Okto session:", clearError);
      }
      toast.error(error.message || "Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
        <div className="relative bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🐝</span>
              {newUser ? "Welcome to GoodHive!" : "Welcome back to GoodHive!"}
            </h3>
          </div>
        </div>

        <div className="p-6">
          {newUser ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🎉</span>
                </div>
                <p className="text-gray-700 font-medium mb-2">
                  Your account has been created!
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-600 mb-1">Wallet Address:</p>
                  <p className="text-xs font-mono text-gray-800 break-all">
                    {connectedWalletAddress}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <span>⚠️</span>
                  Complete Your Registration
                </h4>
                <p className="text-sm text-amber-700 mb-3">
                  To unlock all features and secure your account, please sign in
                  with Google to complete your registration.
                </p>
              </div>

              {!showEmailOTP ? (
                <div className={styles.socialButtons}>
                  <div className={styles.googleButtonWrapper}>
                    <div className="flex items-center justify-center gap-3">
                      <Image
                        src="/icons/honeybee-pointing.svg"
                        alt="Honeybee pointing"
                        width={40}
                        height={40}
                      />
                      <span className="text-sm font-medium text-gray-600">
                        Choose your sign-in method
                      </span>
                    </div>
                    <div className="flex justify-center mb-3">
                      <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => {
                          toast.error("Google login failed. Please try again.");
                        }}
                        auto_select={false}
                        useOneTap={process.env.NODE_ENV === "production"}
                        theme="outline"
                        width="300"
                        text="signin_with"
                        shape="pill"
                        size="large"
                        logo_alignment="left"
                      />
                    </div>
                    <div className="text-center text-sm text-gray-500 mb-3">
                      or
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => setShowEmailOTP(true)}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        <Mail size={20} />
                        Sign in with Email OTP
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setShowEmailOTP(false);
                        setShowOtpInput(false);
                        setOtpEmail("");
                        setOtpValues(["", "", "", "", "", ""]);
                        setOtpToken("");
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800 mb-4 flex items-center gap-1 mx-auto"
                    >
                      ← Back to login options
                    </button>
                  </div>

                  {!showOtpInput ? (
                    <div className="space-y-3">
                      <label htmlFor="popup-email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="popup-email"
                          placeholder="Enter your email"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSendOTP();
                            }
                          }}
                          disabled={isLoading}
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50"
                        />
                        <Mail
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                      </div>
                      <button
                        onClick={handleSendOTP}
                        disabled={isLoading || !otpEmail}
                        className="w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 transition-all"
                      >
                        {isLoading ? "Sending..." : "Send OTP"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Verify Your Email Address
                        </h4>
                        <p className="text-sm text-gray-600">
                          Please enter the 6-digit code we sent to <strong>{otpEmail}</strong>.
                        </p>
                      </div>

                      <div className="flex gap-2 justify-center">
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
                            className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50"
                            disabled={isLoading}
                            aria-label={`OTP digit ${index + 1}`}
                            title={`Enter digit ${index + 1} of verification code`}
                          />
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleResendOTP}
                          disabled={isLoading}
                          className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                          Send Again
                        </button>
                        <button
                          onClick={handleVerifyEmailOTP}
                          disabled={isLoading || otpValues.join("").length !== 6}
                          className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 transition-all"
                        >
                          {isLoading ? "Verifying..." : "Verify & Login"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isLoading && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    Setting up your account...
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">👋</span>
                </div>
                <p className="text-gray-700 font-medium mb-2">
                  Welcome To GoodHive
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-600 mb-1">
                    Connected Wallet:
                  </p>
                  <p className="text-xs font-mono text-gray-800 break-all">
                    {connectedWalletAddress}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <span>✨</span>
                  Enhanced Features Available
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  Sign in with Google to enable Okto wallet features and enhance
                  your GoodHive experience.
                </p>
              </div>

              {!showEmailOTP ? (
                <div className={styles.socialButtons}>
                  <div className={styles.googleButtonWrapper}>
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <Image
                        src="/icons/honeybee-pointing.svg"
                        alt="Honeybee pointing"
                        width={40}
                        height={40}
                      />
                      <span className="text-sm font-medium text-gray-600">
                        Choose your sign-in method for enhanced features
                      </span>
                    </div>
                    <div className="flex justify-center mb-3">
                      <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => {
                          toast.error("Google login failed. Please try again.");
                        }}
                        auto_select={false}
                        useOneTap={process.env.NODE_ENV === "production"}
                        theme="outline"
                        width="300"
                        text="signin_with"
                        shape="pill"
                        size="large"
                        logo_alignment="left"
                      />
                    </div>
                    <div className="text-center text-sm text-gray-500 mb-3">
                      or
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => setShowEmailOTP(true)}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        <Mail size={20} />
                        Sign in with Email OTP
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setShowEmailOTP(false);
                        setShowOtpInput(false);
                        setOtpEmail("");
                        setOtpValues(["", "", "", "", "", ""]);
                        setOtpToken("");
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800 mb-4 flex items-center gap-1 mx-auto"
                    >
                      ← Back to login options
                    </button>
                  </div>

                  {!showOtpInput ? (
                    <div className="space-y-3">
                      <label htmlFor="popup-email-existing" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="popup-email-existing"
                          placeholder="Enter your email"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSendOTP();
                            }
                          }}
                          disabled={isLoading}
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50"
                        />
                        <Mail
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                      </div>
                      <button
                        onClick={handleSendOTP}
                        disabled={isLoading || !otpEmail}
                        className="w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 transition-all"
                      >
                        {isLoading ? "Sending..." : "Send OTP"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Verify Your Email Address
                        </h4>
                        <p className="text-sm text-gray-600">
                          Please enter the 6-digit code we sent to <strong>{otpEmail}</strong>.
                        </p>
                      </div>

                      <div className="flex gap-2 justify-center">
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
                            className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50"
                            disabled={isLoading}
                            aria-label={`OTP digit ${index + 1}`}
                            title={`Enter digit ${index + 1} of verification code`}
                          />
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleResendOTP}
                          disabled={isLoading}
                          className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                          Send Again
                        </button>
                        <button
                          onClick={handleVerifyEmailOTP}
                          disabled={isLoading || otpValues.join("").length !== 6}
                          className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 transition-all"
                        >
                          {isLoading ? "Verifying..." : "Verify & Login"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={() =>
                    toast("Please use the Google sign-in button above")
                  }
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 transition-all"
                >
                  Continue
                </button>
              </div>

              {isLoading && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    Connecting your account...
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500 text-center">
            {newUser
              ? "Google sign-in is required to complete your registration."
              : "You can always connect Google later in your profile settings."}
          </div>
        </div>
      </div>
    </div>
  );
};
