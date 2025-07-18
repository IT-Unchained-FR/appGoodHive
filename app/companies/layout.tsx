import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Profile - Manage Your Business Profile | GoodHive",
  description:
    "Manage your company profile, post jobs, and connect with top Web3 talent. Create and edit your business profile to attract the best blockchain developers and crypto professionals.",
  keywords:
    "company profile management, business profile, Web3 company profile, blockchain company, crypto business profile, job posting platform",
};

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
