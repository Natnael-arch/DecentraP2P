import { http, createConfig } from "wagmi";
import { QueryClient } from "@tanstack/react-query";
import { defineChain } from "viem";

const ARC_CHAIN_ID = Number(import.meta.env.VITE_ARC_CHAIN_ID || 5042002);
const ARC_RPC_URL = import.meta.env.VITE_ARC_RPC_URL || "https://rpc.testnet.arc.network";

export const arcChain = defineChain({
  id: ARC_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: [ARC_RPC_URL] },
    public: { http: [ARC_RPC_URL] },
  },
});

export const wagmiConfig = createConfig({
  chains: [arcChain],
  transports: {
    [arcChain.id]: http(ARC_RPC_URL),
  },
  ssr: false,
});

export const queryClient = new QueryClient();

