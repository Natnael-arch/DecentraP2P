import { useCallback, useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { ESCROW_ABI, ESCROW_ADDRESS } from "../lib/contract";
import type { Listing } from "../types/escrow";

export function useListings() {
  const publicClient = usePublicClient();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchListings = useCallback(async () => {
    if (!publicClient || !ESCROW_ADDRESS) return;
    setLoading(true);
    try {
      const raw = (await publicClient.readContract({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: "getListings",
      })) as any[];
      const normalized = raw
        .filter((listing) => listing.seller !== "0x0000000000000000000000000000000000000000")
        .map(
          (listing) =>
            ({
              id: BigInt(listing.id),
              seller: listing.seller,
              availableAmount: BigInt(listing.availableAmount),
              price: BigInt(listing.price),
              active: listing.active,
            }) as Listing
        );
      setListings(normalized);
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    if (!publicClient || !ESCROW_ADDRESS) return;
    const events = ["ListingCreated", "ListingDeactivated", "TradeStarted"] as const;
    const unwatchers = events.map((eventName) =>
      publicClient.watchContractEvent({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        eventName,
        onLogs: () => fetchListings(),
      })
    );
    return () => {
      unwatchers.forEach((stop) => stop?.());
    };
  }, [publicClient, fetchListings]);

  return { listings, loading, refresh: fetchListings };
}
