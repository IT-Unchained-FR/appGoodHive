"use client";

import Cookies from "js-cookie";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

import { Footer } from "@components/footer/footer";
import { NavBar } from "@components/nav-bar";

import LastActiveHandler from "./components/LastActiveHandler";
import OnboardingPopup from "./components/Onboarding/OnboardingPopup";
import ReferralCodeHandler from "./components/referralCodeHandler/ReferralCodeHandler";
import "./globals.css";
import { Providers } from "./providers";

// Suppress hydration warnings for browser extension attributes
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      args[0]?.includes?.(
        "Extra attributes from the server: cz-shortcut-listen",
      )
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export const fetchCache = "force-no-store";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if we're in the admin section
  const isAdminSection = pathname?.startsWith("/admin");

  useEffect(() => {
    try {
      // Check if user is logged in
      const loggedInUserCookie = Cookies.get("loggedIn_user");

      if (!loggedInUserCookie) {
        return; // Exit if no user cookie found
      }

      const loggedIn_user = JSON.parse(loggedInUserCookie);

      if (!loggedIn_user) {
        return; // Exit if parsing failed or null value
      }

      // Check if all three statuses are pending or undefined/null (treated as pending)
      const isMentorPending =
        loggedIn_user.mentor_status === "pending" ||
        !loggedIn_user.mentor_status;
      const isRecruiterPending =
        loggedIn_user.recruiter_status === "pending" ||
        !loggedIn_user.recruiter_status;
      const isTalentPending =
        loggedIn_user.talent_status === "pending" ||
        !loggedIn_user.talent_status;

      const allStatusesPending =
        isMentorPending && isRecruiterPending && isTalentPending;

      // Temporarily disabled - will integrate later with the website
      // if (allStatusesPending) {
      //   setShowOnboarding(true);
      // }
    } catch (error) {
      console.error("Error checking user status for onboarding:", error);
    }
  }, []);

  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <OnboardingPopup
            isOpen={showOnboarding}
            onClose={() => {
              setShowOnboarding(false);
            }}
          />
          <div className="flex flex-col min-h-screen">
            {!isAdminSection && <NavBar />}
            <Toaster />

            <Suspense>
              <ReferralCodeHandler />
              <div className="flex-grow">
                <LastActiveHandler />
                {children}
              </div>
            </Suspense>
            {!isAdminSection && <Footer />}
          </div>
        </Providers>
      </body>
    </html>
  );
}