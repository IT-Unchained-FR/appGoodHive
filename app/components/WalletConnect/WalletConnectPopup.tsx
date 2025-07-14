"use client";

import { checkUserLoginMethod } from "@/lib/auth/checkUserLoginMethod";
import { useOkto } from "@okto_web3/react-sdk";
import { GoogleLogin } from "@react-oauth/google";
import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";
import styles from "./WalletConnectPopup.module.scss";

interface WalletConnectPopupProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  email: string;
}

export const WalletConnectPopup = ({
  isOpen,
  onClose,
  walletAddress,
  email,
}: WalletConnectPopupProps) => {
  const oktoClient = useOkto();

  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async (credentialResponse: any) => {
    console.log(credentialResponse, "credentialResponse...goodhive");
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

    const goodHiveAccountData = await checkUserLoginMethod(userEmail);

    if (goodHiveAccountData.loginMethod === "email") {
      console.log("Please login with your email OTP to continue.");
    } else {
      console.log("Please login with your wallet to continue.");
    }
    console.log(goodHiveAccountData.wallet_address, walletAddress, "goodHiveAccountData.wallet_address and walletAddress...goodhive");

    const isSameWallet = goodHiveAccountData.wallet_address === walletAddress;

    if (isSameWallet) {

      // If Same Wallet Address, And  don't have okto wallet address then add the okto wallet address to the goodhive account
      if (!goodHiveAccountData.okto_wallet_address) {

        // Fetch Okto Wallet Address
        const oktoWalletAddress = await oktoClient.loginUsingOAuth({
          idToken: credentialResponse.credential,
          provider: "google"
        });

        console.log(oktoWalletAddress, "oktoWalletAddress...goodhive");
        return;

        // Update the goodhive account with the okto wallet address
        const updateAccount = await fetch("/api/auth/update-account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            okto_wallet_address: oktoWalletAddress,
            user_id: goodHiveAccountData.user_id,
            email: userEmail,
            wallet_address: walletAddress,
          }),
        });



        const updateResult = await updateAccount.json();

        if (updateAccount.ok) {
          toast.success("Account linked successfully! 🐝");
          console.log("Account updated:", updateResult);
        } else {
          toast.error(updateResult.error || "Failed to link account");
          console.error("Update failed:", updateResult);
        }

        console.log(oktoWalletAddress, "oktoWalletAddress...goodhive");
        return;
      }

      return;
    } else {
      toast.error("Wallet not linked to this googleaccount.");
    }

    return;

  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Add functionality to connect email with wallet address
    console.log("Connecting email:", email, "with wallet:", walletAddress);

    // For now, just close the popup
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Welcome to GoodHive! 🐝
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            We've created your account with wallet address:
          </p>
          <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
            {walletAddress}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            To complete your profile and unlock all features, please add your email address:
          </p>

          <div className={styles.socialButtons}>
            <div className={styles.googleButtonWrapper}>
              <Image
                src="/icons/honeybee-pointing.svg"
                alt="Honeybee pointing"
                width={50}
                height={50}
              />
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  toast.error("Google login failed. Please try again.");
                }}
                auto_select={false}
                useOneTap
                theme="outline"
                width="400px"
                text="signin_with"
                shape="pill"
                size="large"
                logo_alignment="left"
                containerProps={{
                  style: {
                    width: "400px !important",
                  },
                }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div> */}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? "Connecting..." : "Add Email"}
              </button>
            </div>
          </form>
        </div>

        <div className="text-xs text-gray-500 text-center">
          You can always add this information later in your profile settings.
        </div>
      </div>
    </div>
  );
}; 