import { Suspense } from "react";
import { NavBar } from "@components/nav-bar";
import { Footer } from "@components/footer/footer";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import AppProvider from "./components/providers/providers";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export const fetchCache = "force-no-store";
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="min-h-screen">
        <AppProvider session={session}>
          <div className="flex flex-col min-h-screen">
            <NavBar />
            <Suspense>
              <div className="flex-grow">{children}</div>
            </Suspense>
            <Footer />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
