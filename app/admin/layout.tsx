"use client";

import React from "react";
import { Toaster } from "react-hot-toast";
import Sidebar from "../components/Sidebar/Sidebar";

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <div className="min-h-screen">
      <Toaster />
      <Sidebar>{children}</Sidebar>
    </div>
  );
};

export default RootLayout;
