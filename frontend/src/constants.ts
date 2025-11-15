import type { Address } from "viem";

export const ESCROW_ADDRESS = (import.meta.env.VITE_ESCROW_ADDRESS as Address) ?? "0x0000000000000000000000000000000000000000";
export const STABLECOIN_ADDRESS = (import.meta.env.VITE_STABLECOIN_ADDRESS as Address) ?? "0x0000000000000000000000000000000000000000";
export const USDC_DECIMALS = 6;

