import "./globals.css";

import "@rainbow-me/rainbowkit/styles.css";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GoodHive",
  description: "The Decentralized Freelancing Plateform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
