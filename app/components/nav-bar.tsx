"use client";

import { getAccount, useOkto } from "@okto_web3/react-sdk";
import { googleLogout } from "@react-oauth/google";
import Cookies from "js-cookie";
import { CircleUserRound, Wallet } from "lucide-react";
import { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDisconnect } from "wagmi";
import { WalletPopup } from "./WalletConnect/WalletPopup";

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
  const { disconnect } = useDisconnect();
  const oktoClient = useOkto();
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);
  const [isOpenWalletPopup, setIsOpenWalletPopup] = useState(false);
  const [oktoWalletAddress, setOktoWalletAddress] = useState<string | null>(
    null,
  );
  const walletButtonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const loggedIn_user_id = Cookies.get("user_id");

  const POLYGON_CAIP2_ID = "eip155:137";

  // Fetch Okto wallet address
  useEffect(() => {
    const fetchUserWallet = async () => {
      if (!oktoClient || !loggedIn_user_id) {
        setOktoWalletAddress(null);
        return;
      }

      try {
        const accounts = await getAccount(oktoClient);
        console.log(accounts, "accounts...goodhive");
        const polygonAccount = accounts.find(
          (account: any) => account.caipId === POLYGON_CAIP2_ID,
        );
        if (polygonAccount) {
          setOktoWalletAddress(polygonAccount?.address);
        } else {
          setOktoWalletAddress(null);
        }
      } catch (error: any) {
        console.error("Error fetching user wallet:", error);
        setOktoWalletAddress(null);
      }
    };

    fetchUserWallet();
  }, [oktoClient, loggedIn_user_id]);

  // Close wallet popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        walletButtonRef.current &&
        !walletButtonRef.current.contains(event.target as Node)
      ) {
        setIsOpenWalletPopup(false);
      }
    };

    if (isOpenWalletPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpenWalletPopup]);

  const links = pathname.startsWith("/talents")
    ? talentsLinks
    : pathname.startsWith("/companies")
      ? companiesLinks
      : commonLinks;

  const handleLogout = async () => {
    try {
      googleLogout();
      oktoClient.sessionClear();

      Cookies.remove("user_id");
      Cookies.remove("loggedIn_user");

      disconnect();

      toast.success("Successfully logged out");
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to logout. Please try again.");
    }
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

            {/* Wallet Button - Only show when logged in */}
            {loggedIn_user_id && (
              <div className="relative" ref={walletButtonRef}>
                <button
                  className="relative group flex items-center justify-center px-6 py-2 bg-transparent border-2 border-[#FFC905] text-[#FFC905] rounded-full hover:bg-[#FFC905] hover:text-black transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-[#FFC905]/25 h-10"
                  onClick={() => setIsOpenWalletPopup(!isOpenWalletPopup)}
                >
                  <Wallet
                    size={20}
                    className="mr-2 transition-all duration-300 group-hover:rotate-12"
                  />
                  <span className="font-semibold text-sm sm:text-base">
                    Wallet
                  </span>
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FFC905] to-[#FF8C05] opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
                </button>
                {/* Wallet Popup (refactored) */}
                <WalletPopup
                  isOpen={isOpenWalletPopup}
                  anchorRef={walletButtonRef}
                  onClose={() => setIsOpenWalletPopup(false)}
                  oktoWalletAddress={oktoWalletAddress}
                />
              </div>
            )}

            {loggedIn_user_id && (
              <Link href="/user-profile">
                <CircleUserRound
                  size={36}
                  color="white"
                  className="cursor-pointer"
                />
              </Link>
            )}

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
