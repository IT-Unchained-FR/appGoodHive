"use client";

import Cookies from "js-cookie";
import { CircleUserRound } from "lucide-react";
import { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

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
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const loggedIn_user_id = Cookies.get("user_id");


  const links = pathname.startsWith("/talents")
    ? talentsLinks
    : pathname.startsWith("/companies")
      ? companiesLinks
      : commonLinks;

  const handleLogout = async () => {
    try {
      Cookies.remove("user_id");
      Cookies.remove("loggedIn_user");

      toast.success("Successfully logged out");
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  return (
    <header
      aria-label="Site Header"
      className="bg-gradient-to-r from-amber-100 via-amber-50 to-yellow-100 shadow-lg border-b border-amber-200 backdrop-blur-sm"
    >
      <div className="flex items-center h-16 gap-8 px-8 mx-auto sm:px-6">
        <Link className="block group" href="/">
          <span className="sr-only">Home</span>
          {/* Enhanced Logo with same styling as hero section */}
          <div className="relative">
            <div className="relative z-10 group-hover:scale-105 transition-transform duration-300">
              <Image
                className="block sm:hidden drop-shadow-lg object-contain"
                src="/img/goodhive-logo.png"
                alt="GoodHive Logo"
                width={160}
                height={39}
              />
              <Image
                className="sm:block hidden drop-shadow-lg object-contain"
                src="/img/goodhive-logo.png"
                alt="GoodHive Logo"
                width={120}
                height={29}
              />
            </div>
            {/* Logo enhancement particles - smaller for navbar */}
            <div
              className="absolute -top-1 -left-1 w-2 h-2 bg-amber-400 rounded-full opacity-60 animate-bounce group-hover:animate-ping"
              style={{ animationDelay: "0s" }}
            ></div>
            <div
              className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-50 animate-bounce group-hover:animate-ping"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </Link>

        <div className="flex items-center sm:justify-end flex-1 justify-between">
          <nav aria-label="Site Nav" className="block sm:hidden">
            <ul className="flex items-center gap-6 text-sm">
              {links.map(({ href, label }) => (
                <li key={`${href}${label}`}>
                  <Link
                    href={href as Route}
                    className="text-gray-700 font-medium transition hover:text-amber-700 hover:scale-105 active:scale-95"
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


            {loggedIn_user_id && (
              <Link href="/user-profile" className="group">
                <CircleUserRound
                  size={36}
                  className="cursor-pointer text-gray-600 hover:text-amber-700 transition-all duration-300 group-hover:scale-110"
                />
              </Link>
            )}

            <button
              onClick={() => setIsOpenMobileMenu(!isOpenMobileMenu)}
              className="hidden sm:block rounded-lg bg-amber-200 border border-amber-300 p-2.5 text-amber-800 transition hover:bg-amber-300 hover:text-amber-900 hover:scale-105 active:scale-95"
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
        <div className="bg-gradient-to-b from-amber-50 to-amber-100 border-t border-amber-200 shadow-inner">
          <nav aria-label="Site Nav" className="hidden sm:block">
            <ul className="flex flex-col items-center justify-center gap-4 py-4 text-sm">
              {links.map(({ href, label }) => (
                <li key={`${href}${label}`}>
                  <Link
                    href={href as Route}
                    className="text-gray-700 font-medium transition hover:text-amber-700 hover:scale-105 active:scale-95"
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
