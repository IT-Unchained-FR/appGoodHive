import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talent Hub - Web3 & Blockchain Professionals | GoodHive",
  description:
    "Connect with top Web3 talent, blockchain developers, and crypto professionals. Find skilled developers, designers, and experts for your decentralized projects.",
  keywords:
    "Web3 talent, blockchain developers, crypto professionals, decentralized experts, smart contract developers, DeFi developers",
};

export default function TalentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
