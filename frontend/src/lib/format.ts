import { formatUnits } from "viem";
import { TradeStatus } from "../types/escrow";

export const STATUS_LABELS: Record<TradeStatus, string> = {
  [TradeStatus.None]: "None",
  [TradeStatus.AwaitingSellerLock]: "Awaiting Seller",
  [TradeStatus.Locked]: "Locked",
  [TradeStatus.Paid]: "Paid",
  [TradeStatus.Released]: "Released",
  [TradeStatus.Refunded]: "Refunded",
};

export const formatAmount = (value: bigint, decimals = 6) =>
  Number(formatUnits(value, decimals)).toLocaleString(undefined, { maximumFractionDigits: 2 });

export const truncateAddress = (addr?: string | null) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

