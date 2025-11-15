import { useCallback, useState } from "react";
import { useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { toast } from "react-hot-toast";
import { ESCROW_ABI, ESCROW_ADDRESS } from "../lib/contract";

export function useBuyerActions(onComplete?: () => void) {
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState(false);

  const startTrade = useCallback(
    async (listingId: bigint, amount: string) => {
      if (!ESCROW_ADDRESS) throw new Error("Escrow address not configured");
      setPending(true);
      try {
        const amountWei = parseUnits(amount, 6);
        await toast.promise(
          writeContractAsync({
            address: ESCROW_ADDRESS,
            abi: ESCROW_ABI,
            functionName: "startTrade",
            args: [listingId, amountWei],
          }),
          {
            loading: "Starting trade…",
            success: "Trade created",
            error: (err) => err?.shortMessage ?? err?.message ?? "Failed to start trade",
          }
        );
        onComplete?.();
      } finally {
        setPending(false);
      }
    },
    [writeContractAsync, onComplete]
  );

  const markPaid = useCallback(
    async (tradeId: bigint) => {
      if (!ESCROW_ADDRESS) throw new Error("Escrow address not configured");
      await toast.promise(
        writeContractAsync({
          address: ESCROW_ADDRESS,
          abi: ESCROW_ABI,
          functionName: "buyerMarkPaid",
          args: [tradeId],
        }),
        {
          loading: "Marking as paid…",
          success: "Marked paid",
          error: (err) => err?.shortMessage ?? err?.message ?? "Failed to mark paid",
        }
      );
      onComplete?.();
    },
    [writeContractAsync, onComplete]
  );

  return { startTrade, markPaid, pending };
}

