"use client";

import OktoOTPLogin from "@/app/components/OktoOTPLogin/OktoOTPLogin";
import { WalletConnect } from "@/app/components/WalletConnect/WalletConnect";
import { HoneybeeSpinner } from "@/app/components/spinners/honey-bee-spinner/honey-bee-spinner";
import { checkUserLoginMethod } from "@/lib/auth/checkUserLoginMethod";
import { useOkto } from "@okto_web3/react-sdk";
import { GoogleLogin } from "@react-oauth/google";
import Cookies from "js-cookie";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import styles from "./login.module.scss";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  // UI state

  const router = useRouter();
  const oktoClient = useOkto();

  // Check if user is already authenticated and redirect
  useEffect(() => {
    const loggedInUserId = Cookies.get("user_id");
    if (loggedInUserId) {
      // User is already logged in, redirect to their profile
      router.push("/talents/my-profile");
      return;
    }
    
    // Clear localStorage if not logged in (as requested)
    localStorage.clear();
  }, [router]);

  // Onboarding video
  const onboardingVideoUrl =
    "https://www.youtube-nocookie.com/embed/soSiYLg6KnA?rel=0&modestbranding=1";

  //
  useEffect(() => {
    const clearSession = async () => {
      // Only clear session on initial mount, not when oktoClient changes
      localStorage.clear();
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      if (oktoClient && typeof oktoClient.sessionClear === "function") {
        try {
          oktoClient.sessionClear();
          console.log("=======Session Cleared=======");
        } catch (err) {
          console.error("Failed to clear Okto session:", err);
        }
      }
    };
    
    // Only clear session once on mount, don't trigger on oktoClient changes
    // which could interfere with the OTP flow
    if (oktoClient) {
      clearSession();
    }
  }, []); // Remove oktoClient from dependency array

  // No slides anymore; right panel shows onboarding video

  const handleGoogleLogin = async (credentialResponse: any) => {
    console.log(credentialResponse, "credentialResponse...goodhive");
    // Clear all localStorage items
    localStorage.clear();

    // Clear all cookies
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    if (!oktoClient) {
      toast.error("Please connect your wallet to continue");
      return;
    }
    setIsLoading(true);
    try {
      // Decode the JWT token to get user info
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

      const accountData = await checkUserLoginMethod(userEmail);

      if (accountData.loginMethod === "email") {
        toast.error(
          "You already have an account with email login. Please use email login instead.",
        );
        return;
      }

      const user = await oktoClient.loginUsingOAuth({
        idToken: credentialResponse.credential,
        provider: "google",
      });

      // Verify wallet address and create/update user
      const verifyResponse = await fetch("/api/auth/verify-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login_method: "google",
          okto_wallet_address: user,
          user_id: user.id || user, // Okto might return either the ID directly or an object with id
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
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Google login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Mock handler for email login - just logs to console
  const handleEmailLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    console.log("Email login attempted with:", {
      email: formData.get("email"),
      password: formData.get("password"),
    });
    toast.error("Only Google login is supported at this time");
  };

  // Setting Spinner
  if (isLoading) {
    return <HoneybeeSpinner message={"Connecting You To The Hive..."} />;
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.formSection}>
        <div className={styles.formCard}>
          <div className={styles.formWrapper}>
          <div className={styles.logo}>
            <Image
              src="/img/goodhive_light_logo.png"
              alt="GoodHive Logo"
              width={150}
              height={40}
              className="h-10 w-auto"
            />
          </div>

          <div className={styles.header}>
            <h1>Log in to your Account</h1>
            <p>Welcome back to the hive! Select your preferred login method:</p>
          </div>

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
                useOneTap={process.env.NODE_ENV === "production"}
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

          {/* Okto login section commented out as requested */}
          {/*
          <div className={styles.divider}>
            <span>or continue with email</span>
          </div>

          <OktoOTPLogin setIsLoading={setOtpLoading} isLoading={otpLoading} />
          */}

          <div className={styles.divider}>
            <span>or continue with your wallet</span>
          </div>

          <div className={styles.walletWrapper}>
            <WalletConnect />
          </div>
          </div>
        </div>
      </div>

      <div className={styles.showcaseSection}>
        <div className={styles.honeycombDecoration + " " + styles.top}>
          <svg viewBox="0 0 100 100">
            <path
              d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className={styles.honeycombDecoration + " " + styles.bottom}>
          <svg viewBox="0 0 100 100">
            <path
              d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className={styles.videoSection}>
          <h2>Get started in minutes</h2>
          <p>Watch how to create your GoodHive profile and use the platform.</p>
          <div className={styles.videoWrapper}>
            <iframe
              src={onboardingVideoUrl}
              title="GoodHive Onboarding"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <ul className={styles.benefitsList}>
            <li>Sign in with Google, email OTP, or wallet</li>
            <li>Set up your talent or company profile</li>
            <li>Start hiring or get hired on-chain</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
