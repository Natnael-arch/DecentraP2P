import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/Header";
import TabsSimple from "../components/TabsSimple";
import BuyersTable from "../components/BuyersTable";
import SellersTable from "../components/SellersTable";
import CreateListingModal from "../components/CreateListingModal";
import SessionModal from "../components/SessionModal";
import StartTradeModal from "../components/StartTradeModal";
import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";
import { toast } from "react-hot-toast";
import { useListings } from "../hooks/useListings";
import { useTrades } from "../hooks/useTrades";
import { useBuyerActions } from "../hooks/useBuyerActions";
import { useSellerActions } from "../hooks/useSellerActions";
import type { Listing, Trade } from "../types/escrow";
import { arcChain } from "../lib/wagmi";
import { parseUnits } from "viem";

type TabId = "BUYERS" | "SELLERS";

export default function Home() {
  const [tab, setTab] = useState<TabId>("BUYERS");
  const [showCreate, setShowCreate] = useState(false);
  const [buyerListing, setBuyerListing] = useState<Listing | undefined>();
  const [startTradeFor, setStartTradeFor] = useState<Listing | undefined>();
  const [activeTrade, setActiveTrade] = useState<Trade | undefined>();
  const [sessionRole, setSessionRole] = useState<"buyer" | "seller">("buyer");
  const prevTradesRef = useRef<Trade[]>([]);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const isWrongNetwork = isConnected && chainId !== arcChain.id;

  const { listings, loading: listingsLoading, refresh: refreshListings } = useListings();
  const { trades, loading: tradesLoading, refresh: refreshTrades } = useTrades();
  const buyerActions = useBuyerActions(() => {
    refreshTrades();
    setActiveTrade(undefined);
  });
  const sellerActions = useSellerActions(() => {
    refreshTrades();
    refreshListings();
  });

  const activeListings = useMemo(() => listings.filter((l) => l.active), [listings]);
  const myListings = useMemo(
    () => listings.filter((l) => l.seller.toLowerCase() === (address ?? "").toLowerCase()),
    [listings, address]
  );
  const myTradesBuyer = useMemo(
    () => trades.filter((t) => t.buyer.toLowerCase() === (address ?? "").toLowerCase()),
    [trades, address]
  );
  const myTradesSeller = useMemo(
    () => trades.filter((t) => t.seller.toLowerCase() === (address ?? "").toLowerCase()),
    [trades, address]
  );

  const handleConnect = async () => {
    // Prefer MetaMask if present, otherwise use the first injected connector.
    const meta = connectors.find((c) => /metamask/i.test(c.name));
    const connector = meta || connectors[0];
    if (!connector) return;
    await connect({ connector });
  };

  const onBuy = async (listing: Listing) => {
    // Open a modal to ask for amount, then startTrade.
    setStartTradeFor(listing);
    setSessionRole("buyer");
  };

  const submitStartTrade = async (amountStr: string) => {
    if (!startTradeFor) return;
    try {
      await buyerActions.startTrade(startTradeFor.id, amountStr);
      await refreshTrades();
      // Try to locate the newly started trade for this buyer & listing by amount.
      const desired = parseUnits(amountStr, 6);
      const mine = trades.find(
        (t) =>
          t.listingId === startTradeFor.id &&
          t.buyer.toLowerCase() === (address ?? "").toLowerCase() &&
          t.amount === desired
      );
      if (mine) {
        setActiveTrade(mine);
        toast.success("Trade started. Waiting for seller to lock funds…");
      } else {
        toast("Trade requested. Awaiting seller.");
      }
    } catch (e: any) {
      toast.error(e?.shortMessage ?? e?.message ?? "Failed to start trade");
    } finally {
      setStartTradeFor(undefined);
    }
  };

  const onBuyerMarkPaid = async () => {
    if (!activeTrade) return;
    await buyerActions.markPaid(activeTrade.id);
  };

  // Notify seller when a new trade targeting them appears; notify buyer when seller locks.
  useEffect(() => {
    const prev = (prevTradesRef.current as Trade[]) || [];
    // New trades for me as seller
    const newForMe = trades.filter(
      (t) =>
        t.seller.toLowerCase() === (address ?? "").toLowerCase() &&
        !prev.some((p) => p.id === t.id)
    );
    newForMe.forEach((t) => {
      toast(`New trade request: ${Number(t.amount) / 1e6} USDC`, { id: `trade-${t.id.toString()}` });
    });
    // Status changes to Locked for my buyer trades
    trades.forEach((t) => {
      const before = prev.find((p) => p.id === t.id);
      if (
        before &&
        before.status !== t.status &&
        t.status === 2 && // Locked
        t.buyer.toLowerCase() === (address ?? "").toLowerCase()
      ) {
        toast.success("Seller locked funds. You can mark as paid.");
        // Auto-open session modal for this trade
        setActiveTrade(t);
        setSessionRole("buyer");
      }
    });
    prevTradesRef.current = trades;
  }, [trades, address]);

  return (
    <div className="min-h-screen px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Header
          onConnect={handleConnect}
          onDisconnect={() => disconnect()}
          account={address ?? null}
          isConnecting={isConnecting}
          isWrongNetwork={isWrongNetwork}
        />

        <TabsSimple active={tab} onChange={setTab} />

        {tab === "BUYERS" && (
          <>
            <BuyersTable
              listings={activeListings}
              loading={listingsLoading}
              onBuy={onBuy}
            />
            <StartTradeModal
              listing={startTradeFor}
              open={Boolean(startTradeFor)}
              disabled={!isConnected || isWrongNetwork}
              onClose={() => setStartTradeFor(undefined)}
              onSubmit={submitStartTrade}
            />
            <SessionModal
              open={Boolean(activeTrade)}
              onClose={() => {
                setActiveTrade(undefined);
              }}
              role={sessionRole}
              trade={activeTrade}
              onBuyerMarkPaid={onBuyerMarkPaid}
            />
          </>
        )}

        {tab === "SELLERS" && (
          <>
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setShowCreate(true)}
                disabled={!isConnected || isWrongNetwork || sellerActions.pending}
                className="rounded-full border border-slate-800 bg-arcCard px-6 py-3 shadow-lg transition hover:border-arcAccent disabled:opacity-60"
              >
                Create Listing
              </button>
            </div>
            <SellersTable
              listings={myListings}
              trades={myTradesSeller}
              onLock={async (t) => {
                await sellerActions.lockFunds(t.id, t.amount);
                refreshTrades();
              }}
              onRelease={async (t) => {
                await sellerActions.releaseFunds(t.id);
                refreshTrades();
              }}
              onRefund={async (t) => {
                await sellerActions.refundTrade(t.id);
                refreshTrades();
              }}
            />
            <CreateListingModal
              open={showCreate}
              disabled={!isConnected || isWrongNetwork || sellerActions.pending}
              onClose={() => setShowCreate(false)}
              onSubmit={async ({ amount, price }) => {
                await sellerActions.createListing(amount, price);
                setShowCreate(false);
                refreshListings();
              }}
            />
          </>
        )}
      </div>
      {/* Toast notifications removed per request */}
    </div>
  );
}


