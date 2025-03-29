"use client";

import { SessionProvider } from "next-auth/react";
import { OktoProvider } from "@okto_web3/react-sdk";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { Toaster } from "react-hot-toast";
import { WagmiProvider, chains } from "./WagmiProvider";
import { AuthProvider, useAuth } from "./AuthProvider";
import { SwitchWalletCheck } from "@components/switch-wallet-check";
import LastActiveHandler from "../LastActiveHandler";
import ReferralCodeHandler from "../referralCodeHandler/ReferralCodeHandler";

function AppContent({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  const { walletAddress, handleWalletChange } = useAuth();

  return (
    <SessionProvider session={session}>
      <OktoProvider
        config={{
          environment: "sandbox",
          clientPrivateKey: process.env.NEXT_PUBLIC_CLIENT_PRIVATE_KEY as any,
          clientSWA: process.env.NEXT_PUBLIC_CLIENT_SWA as any,
        }}
      >
        <SwitchWalletCheck
          walletAddress={walletAddress}
          handleWalletChange={handleWalletChange}
        />
        {children}
        <Toaster />
      </OktoProvider>
    </SessionProvider>
  );
}

function AppProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  return (
    <WagmiProvider>
      <AuthProvider>
        <RainbowKitProvider chains={chains}>
          <LastActiveHandler />
          <ReferralCodeHandler />
          <AppContent session={session}>{children}</AppContent>
        </RainbowKitProvider>
      </AuthProvider>
    </WagmiProvider>
  );
}

export default AppProvider;
