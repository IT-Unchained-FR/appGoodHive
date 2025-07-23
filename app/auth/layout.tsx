import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join GoodHive - the Web3 Revolution",
  description:
    "Sign up or log in to GoodHive, the decentralized Web3 recruitment platform. Connect your wallet, create your profile, and join the future of work.",
  keywords:
    "Web3 login, blockchain authentication, crypto wallet login, decentralized identity, Web3 signup",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
