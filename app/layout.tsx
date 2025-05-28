"use client";

import { useMemo, useRef, useState, useEffect } from "react";

import { Suspense } from "react";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { polygon } from "wagmi/chains";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import {
  RainbowKitProvider,
  RainbowKitAuthenticationProvider,
  createAuthenticationAdapter,
  AuthenticationStatus,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { Toaster } from "react-hot-toast";
import { SiweMessage } from "siwe";
import Cookies from "js-cookie";

import { SwitchWalletCheck } from "@components/switch-wallet-check";
import { NavBar } from "@components/nav-bar";
import { Footer } from "@components/footer/footer";
import { GoodhiveInfuraAPILink } from "./constants/common";

import AddressContextWrapper from "./components/addressContextWrapper/AddressContextWrapper";

import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import ReferralCodeHandler from "./components/referralCodeHandler/ReferralCodeHandler";
import LastActiveHandler from "./components/LastActiveHandler";
import OnboardingPopup from "./components/Onboarding/OnboardingPopup";
import { Providers } from "./providers";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [polygon],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: GoodhiveInfuraAPILink,
      }),
    }),
  ],
);

const projectId = "c1de7de6d9dac11ced03c7516792c20c";

const connectors = connectorsForWallets([
  {
    groupName: "My Goodhive App",
    wallets: [
      metaMaskWallet({ projectId, chains }),
      walletConnectWallet({ projectId, chains }), // FIXME: WalletConnect is not working as expected
    ],
  },
]);

export const config = createConfig({
  autoConnect: true,
  publicClient,
  connectors,
  webSocketPublicClient,
});

export const fetchCache = "force-no-store";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetchingStatusRef = useRef(false);
  const verifyingRef = useRef(false);
  const [authStatus, setAuthStatus] = useState<AuthenticationStatus>("loading");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
      // Check if user is logged in
      const loggedInUserCookie = Cookies.get("loggedIn_user");

      if (!loggedInUserCookie) {
        return; // Exit if no user cookie found
      }

      const loggedIn_user = JSON.parse(loggedInUserCookie);

      if (!loggedIn_user) {
        return; // Exit if parsing failed or null value
      }

      // Check if all three statuses are pending or undefined/null (treated as pending)
      const isMentorPending =
        loggedIn_user.mentor_status === "pending" ||
        !loggedIn_user.mentor_status;
      const isRecruiterPending =
        loggedIn_user.recruiter_status === "pending" ||
        !loggedIn_user.recruiter_status;
      const isTalentPending =
        loggedIn_user.talent_status === "pending" ||
        !loggedIn_user.talent_status;

      const allStatusesPending =
        isMentorPending && isRecruiterPending && isTalentPending;

      if (allStatusesPending) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Error checking user status for onboarding:", error);
    }
  }, [authStatus, walletAddress]);

  const authAdapter = useMemo(() => {
    return createAuthenticationAdapter({
      getNonce: async () => {
        const generateCookieNonceResponse = await fetch("/api/auth/nonce");

        return await generateCookieNonceResponse.text();
      },

      createMessage: ({ nonce, address, chainId }) => {
        return new SiweMessage({
          domain: window.location.host,
          address,
          statement: "Sign in with Ethereum to the app.",
          uri: window.location.origin,
          version: "1",
          chainId,
          nonce,
        });
      },

      getMessageBody: ({ message }) => {
        return message.prepareMessage();
      },

      verify: async ({ message, signature }) => {
        verifyingRef.current = true;

        try {
          const singatureVerifyResponse = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, signature }),
          });

          const verifyResponse = await singatureVerifyResponse.json();

          const authenticated = Boolean(verifyResponse?.ok === true);

          if (authenticated) {
            setAuthStatus("authenticated");
            setWalletAddress(verifyResponse?.address);
          } else {
            setAuthStatus("unauthenticated");
          }

          return authenticated;
        } catch (error) {
          console.error(error);

          setAuthStatus("unauthenticated");

          return false;
        } finally {
          verifyingRef.current = false;
        }
      },

      signOut: async () => {
        setAuthStatus("unauthenticated");
        const logoutResponse = await fetch("/api/auth/logout");

        if (!logoutResponse.ok) {
          console.error("Error logging out");
        } else {
          window.location.reload();
        }
      },
    });
  }, []);

  const handleWalletChange = async () => {
    setAuthStatus("unauthenticated");
    const logoutResponse = await fetch("/api/auth/logout");

    if (!logoutResponse.ok) {
      console.error("Error logging out");
    }
  };
  console.log(showOnboarding, "showOnboarding");

  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <OnboardingPopup
            isOpen={showOnboarding}
            onClose={() => {
              setShowOnboarding(false);
            }}
          />
          <WagmiConfig config={config}>
            <RainbowKitAuthenticationProvider
              adapter={authAdapter}
              status={authStatus}
            >
              <RainbowKitProvider chains={chains}>
                <SwitchWalletCheck
                  walletAddress={walletAddress}
                  handleWalletChange={handleWalletChange}
                />
                <div className="flex flex-col min-h-screen">
                  <NavBar />
                  <Toaster />

                  <Suspense>
                    <ReferralCodeHandler />
                    <div className="flex-grow">
                      <AddressContextWrapper setAuthStatus={setAuthStatus}>
                        <LastActiveHandler />
                        {children}
                      </AddressContextWrapper>
                    </div>
                  </Suspense>
                  <Footer />
                </div>
              </RainbowKitProvider>
            </RainbowKitAuthenticationProvider>
          </WagmiConfig>
        </Providers>
      </body>
    </html>
  );
}
