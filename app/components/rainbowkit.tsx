import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { mainnet, polygon, gnosis } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";

const { chains, provider } = configureChains(
  [mainnet, polygon, gnosis],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "GoodHive App",
  projectId: "42",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

interface Props {
  children: React.ReactNode;
}

export const Rainbowkit = ({ children }: Props) => (
  <WagmiConfig client={wagmiClient}>
    <RainbowKitProvider chains={chains}>{children}</RainbowKitProvider>
  </WagmiConfig>
);
