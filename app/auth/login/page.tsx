"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import styles from "./login.module.scss";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseBody = await response.json();

      if (response.ok) {
        Cookies.set("user_id", responseBody.user_id);
        Cookies.set("loggedIn_user", JSON.stringify(responseBody.user));
        toast.success("Welcome to the hive! 🐝");
        window.location.href = "/talents/my-profile";
      } else {
        toast.error(responseBody.message);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <button type="button">
              <Image
                src="/google-icon.svg"
                alt="Google"
                width={20}
                height={20}
              />
              <span>Google</span>
            </button>
            <button type="button">
              <Image
                src="/facebook-icon.svg"
                alt="Facebook"
                width={20}
                height={20}
              />
              <span>Facebook</span>
            </button>
          </div>

          <div className={styles.divider}>
            <span>or continue with email</span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  required
                />
                <Mail
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className={styles.rememberForgot}>
              <div className={styles.rememberMe}>
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember">Remember me</label>
              </div>
              <Link
                href={{
                  pathname: "/auth/forgot-password",
                }}
                className={styles.forgotPassword}
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? "Buzzing in..." : "Log in"}
            </button>

            <p className={styles.signupPrompt}>
              New to GoodHive?
              <Link href="/auth/signup">Create an account</Link>
            </p>
          </form>
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
