"use client";

import { Toaster } from "react-hot-toast";

import "../globals.css";
import { NavBar } from "../components/nav-bar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <Toaster />
        {children}
        <footer className="mx-5 my-10 text-sm ">Powered by GoodHive</footer>
      </body>
    </html>
  );
}
