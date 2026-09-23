// Chain configuration for Thirdweb
import { defineChain } from "thirdweb";

// Get chain configuration from environment variables
const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "80002");
const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME || "polygon-amoy";
const blockExplorer = process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://amoy.polygonscan.com/";
// Must be NEXT_PUBLIC_ so the browser (where wallet txs and contract reads run) sees it.
// Falls back to thirdweb's RPC for this chain — thirdweb appends the client ID automatically.
// (The old default, rpc-amoy.polygon.technology, no longer resolves in DNS.)
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || `https://${chainId}.rpc.thirdweb.com`;

// Define the chain dynamically based on environment variables
export const activeChain = defineChain({
  id: chainId,
  name: chainName,
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  rpc: rpcUrl,
  blockExplorers: [
    {
      name: "PolygonScan",
      url: blockExplorer,
    },
  ],
  testnet: chainName.includes("amoy") || chainName.includes("testnet") ? true : undefined,
});

// Export chain ID and name for use in other parts of the app
export const ACTIVE_CHAIN_ID = chainId;
export const ACTIVE_CHAIN_NAME = chainName;
