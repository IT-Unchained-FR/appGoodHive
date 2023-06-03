"use client";

import { WagmiConfig, createConfig, configureChains, mainnet } from "wagmi";
import { publicProvider } from "wagmi/providers/public";

import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "My Goodhive App",
  projectId: "GOODHIVE",
  chains,
});

const config = createConfig({
  autoConnect: true,
  publicClient,
  connectors,
  webSocketPublicClient,
});

import { NavBar } from "./components/nav-bar";

export default function Home() {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains}>
        <NavBar />
        <main className="mx-5">
          <h1 className="mt-5 text-2xl">Home Page</h1>
          <p className="my-10 text-lg">Freelancing Platform</p>
        </main>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
