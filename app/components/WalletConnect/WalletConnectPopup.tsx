"use client";

import { useOkto } from "@okto_web3/react-sdk";
import { GoogleLogin } from "@react-oauth/google";
import Cookies from "js-cookie";
import Image from "next/image";
import { useState } from "react";
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
                      Sign in with Google to continue
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleLogin}
                      onError={() => {
                        toast.error("Google login failed. Please try again.");
                      }}
                      auto_select={false}
                      useOneTap
                      theme="outline"
                      width="300"
                      text="signin_with"
                      shape="pill"
                      size="large"
                      logo_alignment="left"
                    />
                  </div>
                </div>
              </div>

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
                  Great to see you again!
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
                      Connect with Google for enhanced features
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleLogin}
                      onError={() => {
                        toast.error("Google login failed. Please try again.");
                      }}
                      auto_select={false}
                      useOneTap
                      theme="outline"
                      width="300"
                      text="signin_with"
                      shape="pill"
                      size="large"
                      logo_alignment="left"
                    />
                  </div>
                </div>
              </div>

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
