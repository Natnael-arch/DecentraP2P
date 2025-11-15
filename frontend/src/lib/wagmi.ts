import { QueryClient } from "@tanstack/react-query";
import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

const ARC_RPC_URL = import.meta.env.VITE_ARC_RPC_URL || "https://rpc.testnet.arc.network";
const ARC_CHAIN_ID = Number(import.meta.env.VITE_ARC_CHAIN_ID || 5042002);

export const arcChain = defineChain({
  id: ARC_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: [ARC_RPC_URL] },
    public: { http: [ARC_RPC_URL] },
  },
});

export const wagmiConfig = createConfig({
  chains: [arcChain],
  connectors: [injected({ target: "metaMask" })],
  transports: {
    [arcChain.id]: http(ARC_RPC_URL),
  },
});

export const queryClient = new QueryClient();

