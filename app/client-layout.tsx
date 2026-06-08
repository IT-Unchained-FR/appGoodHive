"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";

import { Footer } from "@components/footer/footer";
import { NavBar } from "@components/nav-bar";

import LastActiveHandler from "./components/LastActiveHandler";
import ReferralCodeHandler from "./components/referralCodeHandler/ReferralCodeHandler";
import { Providers } from "./providers";
import { AnalyticsProvider } from "./components/AnalyticsProvider";

const SuperbotWidget = dynamic(
  () =>
    import("./components/superbot/SuperbotWidget").then(
      (mod) => mod.SuperbotWidget,
    ),
  { ssr: false },
);

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();

  const isAdminSection = pathname?.startsWith("/admin");
  const isDashboardSection =
    pathname?.startsWith("/recruiter/dashboard") ||
    pathname?.startsWith("/companies/dashboard");
  const showSuperbot = !isAdminSection;

  if (isAdminSection) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        {!isAdminSection && <NavBar />}
        {/* Spacer so page content starts below the fixed navbar */}
        {!isAdminSection && <div className="h-16 shrink-0" />}
        <Toaster />

        <Suspense>
          <AnalyticsProvider />
          <ReferralCodeHandler />
          <div className="flex-grow">
            <LastActiveHandler />
            {children}
          </div>
        </Suspense>
        {/* Hide site footer inside dashboard app views */}
        {!isAdminSection && !isDashboardSection && <Footer />}
        {showSuperbot ? <SuperbotWidget /> : null}
      </div>
    </Providers>
  );
}
