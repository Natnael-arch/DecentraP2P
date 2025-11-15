import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { ESCROW_ABI, ESCROW_ADDRESS } from "../lib/contract";
import type { Trade } from "../types/escrow";
import { TradeStatus } from "../types/escrow";

export function useTrades() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrades = useCallback(async () => {
    if (!publicClient || !ESCROW_ADDRESS || !address) {
      setTrades([]);
      return;
    }
    setLoading(true);
    try {
      const raw = (await publicClient.readContract({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: "getTradesForUser",
        args: [address],
      })) as any[];
      setTrades(
        raw.map(
          (trade) =>
            ({
              id: BigInt(trade.id),
              listingId: BigInt(trade.listingId),
              seller: trade.seller,
              buyer: trade.buyer,
              amount: BigInt(trade.amount),
              timeout: BigInt(trade.timeout),
              status: Number(trade.status) as TradeStatus,
            }) as Trade
        )
      );
    } finally {
      setLoading(false);
    }
  }, [publicClient, address]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  useEffect(() => {
    if (!publicClient || !ESCROW_ADDRESS) return;
    const events = ["TradeStarted", "FundsLocked", "TradeMarkedPaid", "TradeReleased", "TradeRefunded"] as const;
    const unwatchers = events.map((eventName) =>
      publicClient.watchContractEvent({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        eventName,
        onLogs: () => fetchTrades(),
      })
    );
    return () => {
      unwatchers.forEach((stop) => stop?.());
    };
  }, [publicClient, fetchTrades]);

  return { trades, loading, refresh: fetchTrades };
}
