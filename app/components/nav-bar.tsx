"use client";

import { Route } from "next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CircleUserRound } from "lucide-react";

import { useEffect, useState } from "react";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Cookies from "js-cookie";
import { useAccount, useDisconnect } from "wagmi";
import toast from "react-hot-toast";
import { useOkto } from "@okto_web3/react-sdk";
import { googleLogout } from "@react-oauth/google";

const commonLinks = [
  { href: "/talents/job-search", label: "Find a Job" },
  { href: "/companies/search-talents", label: "Find a Talent" },
];

const talentsLinks = [
  { href: "/talents/job-search", label: "Job Search" },
  // { href: "/talents/my-applications", label: "My Applications" },
  { href: "/talents/my-profile", label: "My Talent Profile" },
];

const companiesLinks = [
  { href: "/companies/search-talents", label: "Search Talents" },
  // { href: "/companies/create-job", label: "Create Job" },
  { href: "/companies/my-profile", label: "My Company Profile" },
];

export const NavBar = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const oktoClient = useOkto();

  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Get the logged in user email and id from cookies
  const loggedIn_user_id = Cookies.get("user_id");

  const links = pathname.startsWith("/talents")
    ? talentsLinks
    : pathname.startsWith("/companies")
      ? companiesLinks
      : commonLinks;

  const handleLogout = async () => {
    try {
      // Perform Google OAuth logout
      googleLogout();

      // Clear Okto session
      oktoClient.sessionClear();
      console.log("Successfully logged out from Okto");

      // Remove cookies
      Cookies.remove("user_id");
      Cookies.remove("loggedIn_user");

      // Disconnect wallet if connected
      if (isConnected) {
        disconnect();
      }

      // Show success message
      toast.success("Successfully logged out");

      // Redirect to login page
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  const loggedInUserCookie = Cookies.get("loggedIn_user");
  const referralCode = Cookies.get("referralCode");
  const loggedIn_user = loggedInUserCookie
    ? JSON.parse(loggedInUserCookie)
    : null;

  useEffect(() => {
    if (
      isConnected &&
      address &&
      !loggedIn_user?.wallet_address &&
      loggedIn_user_id
    ) {
      if (!loggedIn_user?.email) return;
      fetch("/api/auth/set-wallet-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          userId: loggedIn_user_id,
          referralCode,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            console.log(data.user, "data.user");
            Cookies.set("loggedIn_user", JSON.stringify(data.user));
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
  }, [
    address,
    isConnected,
    loggedIn_user_id,
    loggedIn_user?.wallet_address,
    disconnect,
    loggedIn_user?.email,
    referralCode,
  ]);

  useEffect(() => {
    // Checking if there is a user id in the cookies
    if (!loggedIn_user_id && isConnected && address) {
      // Check if the user exists in the database
      fetch("/api/auth/wallet-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet_address: address }),
      })
        .then((response) => response.json())
        .then((data) => {
          // Set the user id in the cookies
          if (data.user_id) {
            Cookies.set("user_id", data.user_id);
          }
          // Redirect the user to the profile page
          window.location.href = "/talents/my-profile";
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  }, [isConnected, address, loggedIn_user_id]);

  console.log(loggedIn_user, "loggedIn_user");
  return (
    <header aria-label="Site Header" className="bg-black ">
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
            {loggedIn_user_id ? (
              <button
                className="my-2 text-base font-semibold bg-[#FFC905] h-10 w-40 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                type="submit"
                onClick={handleLogout}
              >
                Logout
              </button>
            ) : (
              <button
                className="my-2 text-base font-semibold bg-[#FFC905] h-10 w-40 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                type="submit"
                onClick={() => router.push("/auth/login")}
              >
                Login
              </button>
            )}
            <div className="flex gap-4">
              <ConnectButton />
            </div>
            <div>
              {loggedIn_user_id && (
                <Link href="/user-profile">
                  <CircleUserRound
                    size={36}
                    color="white"
                    className="cursor-pointer"
                  />
                </Link>
              )}
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
