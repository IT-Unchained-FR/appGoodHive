import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login — GoodHive",
  description: "Sign in to the GoodHive admin dashboard",
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
