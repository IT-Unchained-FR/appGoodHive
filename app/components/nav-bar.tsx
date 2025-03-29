"use client";

import { Route } from "next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CircleUserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from "wagmi";
import toast from "react-hot-toast";
import { signIn, signOut, useSession } from "next-auth/react";

const commonLinks = [
  { href: "/talents/job-search", label: "Find a Job" },
  { href: "/companies/search-talents", label: "Find a Talent" },
];

const talentsLinks = [
  { href: "/talents/job-search", label: "Job Search" },
  { href: "/talents/my-profile", label: "My Talent Profile" },
];

const companiesLinks = [
  { href: "/companies/search-talents", label: "Search Talents" },
  { href: "/companies/my-profile", label: "My Company Profile" },
];

export const NavBar = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: session, status } = useSession() as any;
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const links = pathname.startsWith("/talents")
    ? talentsLinks
    : pathname.startsWith("/companies")
      ? companiesLinks
      : commonLinks;

  const handleLogout = async () => {
    try {
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Clear localStorage
      localStorage.clear();

      // Disconnect wallet
      disconnect();

      // Sign out from NextAuth
      await signOut({
        redirect: true,
        callbackUrl: "/",
      });

      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout");
    }
  };

  useEffect(() => {
    if (isConnected && address && session?.user?.email) {
      fetch("/api/auth/set-wallet-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          userId: session.userId,
          referralCode: localStorage.getItem("referralCode"),
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            toast.success(data.message);
          } else {
            toast.error(data.message);
            disconnect();
          }
        })
        .catch((error) => {
          console.error("Error wallet address saving:", error);
        });
    }
  }, [address, isConnected, session?.user?.email, session?.userId, disconnect]);

  useEffect(() => {
    if (!session?.user && isConnected && address) {
      fetch("/api/auth/wallet-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet_address: address }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.user_id) {
            router.push("/talents/my-profile");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  }, [isConnected, address, session?.user, router]);

  const handleLogin = () => {
    signIn("google");
  };

  return (
    <header aria-label="Site Header" className="bg-black">
      <div className="flex items-center h-16 gap-8 px-8 mx-auto sm:px-6">
        <Link className="block" href="/">
          <span className="sr-only">Home</span>
          <Image
            className="block sm:hidden"
            src="/img/goodhive_light_logo.png"
            alt="GoodHive Logo"
            width={192}
            height={47}
          />
          <Image
            className="sm:block hidden"
            src="/img/goodhive_logo_icon.png"
            alt="GoodHive Logo Icon"
            width={47}
            height={47}
          />
        </Link>

        <div className="flex items-center sm:justify-end flex-1 justify-between">
          <nav aria-label="Site Nav" className="block sm:hidden">
            <ul className="flex items-center gap-6 text-sm">
              {links.map(({ href, label }) => (
                <li key={`${href}${label}`}>
                  <Link
                    href={href as Route}
                    className="text-white transition hover:text-yellow-500"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-5">
            {session?.user ? (
              <>
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-10 w-40 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                  type="submit"
                  onClick={handleLogout}
                >
                  Logout
                </button>
                <Link href="/user-profile">
                  <CircleUserRound
                    size={36}
                    color="white"
                    className="cursor-pointer"
                  />
                </Link>
              </>
            ) : (
              <>
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-10 w-40 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                  type="submit"
                  onClick={() => router.push("/auth/login")}
                >
                  Login
                </button>
              </>
            )}
            <div className="flex gap-4">
              <ConnectButton />
            </div>

            <button
              onClick={() => setIsOpenMobileMenu(!isOpenMobileMenu)}
              className="hidden sm:block rounded bg-gray-100 p-2.5 text-gray-600 transition hover:text-gray-600/75"
            >
              <span className="sr-only">Toggle menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                {isOpenMobileMenu ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpenMobileMenu && (
        <div>
          <nav aria-label="Site Nav" className="hidden sm:block">
            <ul className="flex flex-col items-center justify-center gap-6 pb-3 text-sm">
              {links.map(({ href, label }) => (
                <li key={`${href}${label}`}>
                  <Link
                    href={href as Route}
                    className="text-white transition hover:text-yellow-500"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};
