"use client";

import toast, { Toaster } from "react-hot-toast";
import "../globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Rainbowkit } from "../components/rainbowkit";
import { NavBar } from "../components/nav-bar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Rainbowkit>
          <NavBar />
          <Toaster />
        </Rainbowkit>
        {children}
        <footer className="mx-5 my-10 text-sm ">Powered by GoodHive</footer>
      </body>
    </html>
  );
}
