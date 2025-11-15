import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { toast } from "react-hot-toast";
import { ESCROW_ABI, ESCROW_ADDRESS, ERC20_ABI, STABLECOIN_ADDRESS } from "../lib/contract";

export function useSellerActions(onComplete?: () => void) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState(false);

  const [tokenAddress, setTokenAddress] = useState<`0x${string}` | null>(STABLECOIN_ADDRESS || null);

  useEffect(() => {
    if (tokenAddress || !publicClient || !ESCROW_ADDRESS) return;
    publicClient
      .readContract({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: "stablecoin",
      })
      .then((addr) => setTokenAddress(addr as `0x${string}`))
      .catch(() => null);
  }, [publicClient, tokenAddress]);

  const ensureAllowance = useCallback(
    async (amount: bigint) => {
    if (!publicClient || !walletClient || !address || !tokenAddress) return;
      const allowance = (await publicClient.readContract({
      address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, ESCROW_ADDRESS],
      })) as bigint;
      if (allowance >= amount) return;
      await toast.promise(
        walletClient.writeContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [ESCROW_ADDRESS, amount],
        }),
        {
          loading: "Approving USDC…",
          success: "Approval complete",
          error: (err) => err?.shortMessage ?? err?.message ?? "Approval failed",
        }
      );
    },
    [publicClient, walletClient, address, tokenAddress]
  );

  const createListing = useCallback(
    async (amount: string, price: string) => {
      if (!ESCROW_ADDRESS) throw new Error("Escrow not configured");
      setPending(true);
      try {
        const amountWei = parseUnits(amount, 6);
        const priceWei = parseUnits(price || "0", 6);
        await toast.promise(
          writeContractAsync({
            address: ESCROW_ADDRESS,
            abi: ESCROW_ABI,
            functionName: "createListing",
            args: [amountWei, priceWei],
          }),
          {
            loading: "Creating listing…",
            success: "Listing live",
            error: (err) => err?.shortMessage ?? err?.message ?? "Listing failed",
          }
        );
        onComplete?.();
      } finally {
        setPending(false);
      }
    },
    [writeContractAsync, onComplete]
  );

  const lockFunds = useCallback(
    async (tradeId: bigint, amount: bigint) => {
      setPending(true);
      try {
        await ensureAllowance(amount);
        await toast.promise(
          writeContractAsync({
            address: ESCROW_ADDRESS,
            abi: ESCROW_ABI,
            functionName: "sellerLockFunds",
            args: [tradeId],
          }),
          {
            loading: "Locking funds…",
            success: "Funds locked",
            error: (err) => err?.shortMessage ?? err?.message ?? "Lock failed",
          }
        );
        onComplete?.();
      } finally {
        setPending(false);
      }
    },
    [writeContractAsync, ensureAllowance, onComplete]
  );

  const releaseFunds = useCallback(
    async (tradeId: bigint) => {
      setPending(true);
      try {
        await toast.promise(
          writeContractAsync({
            address: ESCROW_ADDRESS,
            abi: ESCROW_ABI,
            functionName: "sellerRelease",
            args: [tradeId],
          }),
          {
            loading: "Releasing…",
            success: "Released to buyer",
            error: (err) => err?.shortMessage ?? err?.message ?? "Release failed",
          }
        );
        onComplete?.();
      } finally {
        setPending(false);
      }
    },
    [writeContractAsync, onComplete]
  );

  const refundTrade = useCallback(
    async (tradeId: bigint) => {
      setPending(true);
      try {
        await toast.promise(
          writeContractAsync({
            address: ESCROW_ADDRESS,
            abi: ESCROW_ABI,
            functionName: "triggerTimeoutRefund",
            args: [tradeId],
          }),
          {
            loading: "Triggering refund…",
            success: "Refund tx sent",
            error: (err) => err?.shortMessage ?? err?.message ?? "Refund failed",
          }
        );
        onComplete?.();
      } finally {
        setPending(false);
      }
    },
    [writeContractAsync, onComplete]
  );

  return { createListing, lockFunds, releaseFunds, refundTrade, pending };
}

