"use client";

import OktoOTPLogin from "@/app/components/OktoOTPLogin/OktoOTPLogin";
import { WalletConnect } from "@/app/components/WalletConnect/WalletConnect";
import { HoneybeeSpinner } from "@/app/components/spinners/honey-bee-spinner/honey-bee-spinner";
import { checkUserLoginMethod } from "@/lib/auth/checkUserLoginMethod";
import { useOkto } from "@okto_web3/react-sdk";
import { GoogleLogin } from "@react-oauth/google";
import Cookies from "js-cookie";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import styles from "./login.module.scss";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const oktoClient = useOkto();

  const slides = [
    {
      title: "Connect with every hive member",
      description:
        "Join our buzzing community of professionals and grow together.",
    },
    {
      title: "Build your honey network",
      description:
        "Create meaningful connections in our collaborative ecosystem.",
    },
    {
      title: "Sweet opportunities await",
      description: "Discover and share valuable opportunities within the hive.",
    },
  ];

  //
  useEffect(() => {
    const clearSession = async () => {
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
    clearSession();
  }, [oktoClient]);

  const handleSlideChange = (index: number) => {
    if (isAnimating || index === currentSlide) return;

    setIsAnimating(true);

    // Start exit animation
    const content = document.querySelector(`.${styles.showcaseContent}`);
    const title = content?.querySelector("h2");
    const description = content?.querySelector("p");

    if (title && description) {
      title.classList.add(styles.exiting);
      description.classList.add(styles.exiting);
    }

    // Wait for exit animation to complete
    setTimeout(() => {
      setCurrentSlide(index);

      // Remove exit classes and add enter classes
      if (title && description) {
        title.classList.remove(styles.exiting);
        description.classList.remove(styles.exiting);
        title.classList.add(styles.entering);
        description.classList.add(styles.entering);
      }

      // Remove enter classes after animation completes
      setTimeout(() => {
        if (title && description) {
          title.classList.remove(styles.entering);
          description.classList.remove(styles.entering);
        }
        setIsAnimating(false);
      }, 1200);
    }, 600);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const nextSlide = (currentSlide + 1) % slides.length;
      handleSlideChange(nextSlide);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide, isAnimating]);

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

          <div className={styles.divider}>
            <span>or continue with email</span>
          </div>

          <OktoOTPLogin setIsLoading={setIsLoading} isLoading={isLoading} />

          <div className={styles.divider}>
            <span>or continue with your wallet</span>
          </div>

          <div className={styles.walletWrapper}>
            <WalletConnect />
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

        <div className={styles.showcaseContent}>
          <h2 className={styles.entering}>{slides[currentSlide].title}</h2>
          <p className={styles.entering}>{slides[currentSlide].description}</p>

          <div className={styles.features}>
            <div className={styles.feature}>
              <h3>Professional Network</h3>
              <p>Connect with industry experts and grow your career</p>
            </div>
            <div className={styles.feature}>
              <h3>Collaboration Hub</h3>
              <p>Work together on innovative projects</p>
            </div>
            <div className={styles.feature}>
              <h3>Knowledge Sharing</h3>
              <p>Learn from the best in your field</p>
            </div>
            <div className={styles.feature}>
              <h3>Career Growth</h3>
              <p>Find opportunities that match your expertise</p>
            </div>
          </div>

          <div className={styles.dotsNavigation}>
            {slides.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${currentSlide === index ? styles.active : ""}`}
                onClick={() => handleSlideChange(index)}
                disabled={isAnimating}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
