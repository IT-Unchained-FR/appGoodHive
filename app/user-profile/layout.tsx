import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Profile - Manage Your Account | GoodHive",
  description:
    "View and manage your GoodHive user profile, connect your email, and track your talent, mentor, and recruiter status in the Web3 recruitment platform.",
  keywords:
    "user profile, account management, Web3 profile, blockchain user account, crypto platform profile",
};

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
