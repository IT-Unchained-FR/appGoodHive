import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design System - UI Components | GoodHive",
  description:
    "Explore GoodHive's design system and UI components. View our button styles, form elements, and design patterns used throughout the platform.",
  keywords:
    "design system, UI components, GoodHive design, Web3 UI, blockchain interface design",
};

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
