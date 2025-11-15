import { useMemo, useState } from "react";
import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";
import { Toaster } from "react-hot-toast";
import { Tabs } from "./components/Tabs";
import { WalletButton } from "./components/WalletButton";
import { ListingTable } from "./components/ListingTable";
import { TradeList } from "./components/TradeList";
import { CreateListingModal } from "./components/CreateListingModal";
import { StartTradeModal } from "./components/StartTradeModal";
import { useListings } from "./hooks/useListings";
import { useTrades } from "./hooks/useTrades";
import { useBuyerActions } from "./hooks/useBuyerActions";
import { useSellerActions } from "./hooks/useSellerActions";
import type { Listing, Trade } from "./types/escrow";
import { arcChain } from "./lib/wagmi";

type Tab = "BUYER" | "SELLER";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("BUYER");
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [tradeModalListing, setTradeModalListing] = useState<Listing | undefined>();
  const [pendingSellerTrade, setPendingSellerTrade] = useState<bigint | null>(null);
  const [pendingBuyerTrade, setPendingBuyerTrade] = useState<bigint | null>(null);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const { listings, loading: listingsLoading } = useListings();
  const { trades, loading: tradesLoading, refresh: refreshTrades } = useTrades();

  const buyerActions = useBuyerActions(refreshTrades);
  const sellerActions = useSellerActions(() => {
    refreshTrades();
    setListingModalOpen(false);
  });

  const isWrongNetwork = isConnected && chainId !== arcChain.id;

  const activeListings = useMemo(
    () => listings.filter((listing) => listing.active),
    [listings]
  );
  const sellerListings = useMemo(
    () => listings.filter((listing) => listing.seller.toLowerCase() === (address ?? "").toLowerCase()),
    [listings, address]
  );
  const buyerTrades = useMemo(
    () => trades.filter((trade) => trade.buyer.toLowerCase() === (address ?? "").toLowerCase()),
    [trades, address]
  );
  const sellerTrades = useMemo(
    () => trades.filter((trade) => trade.seller.toLowerCase() === (address ?? "").toLowerCase()),
    [trades, address]
  );

  const handleConnect = async () => {
    const connector = connectors[0];
    if (!connector) throw new Error("No wallet connector available");
    await connect({ connector });
  };

  const handleStartTrade = async (amount: string) => {
    if (!tradeModalListing) return;
    setPendingBuyerTrade(tradeModalListing.id);
    try {
      await buyerActions.startTrade(tradeModalListing.id, amount);
    } finally {
      setPendingBuyerTrade(null);
      setTradeModalListing(undefined);
    }
  };

  const handleBuyerMarkPaid = async (trade: Trade) => {
    setPendingBuyerTrade(trade.id);
    try {
      await buyerActions.markPaid(trade.id);
    } finally {
      setPendingBuyerTrade(null);
    }
  };

  const handleSellerLock = async (trade: Trade) => {
    setPendingSellerTrade(trade.id);
    try {
      await sellerActions.lockFunds(trade.id, trade.amount);
    } finally {
      setPendingSellerTrade(null);
    }
  };

  const handleSellerRelease = async (trade: Trade) => {
    setPendingSellerTrade(trade.id);
    try {
      await sellerActions.releaseFunds(trade.id);
    } finally {
      setPendingSellerTrade(null);
    }
  };

  const handleSellerRefund = async (trade: Trade) => {
    setPendingSellerTrade(trade.id);
    try {
      await sellerActions.refundTrade(trade.id);
    } finally {
      setPendingSellerTrade(null);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase text-slate-400">Arc Stable Escrow</p>
            <h1 className="text-3xl font-semibold">Decentra P2P Marketplace</h1>
          </div>
          <WalletButton
            account={address ?? null}
            connect={handleConnect}
            disconnect={() => disconnect()}
            isConnecting={isConnecting}
            isWrongNetwork={isWrongNetwork}
          />
        </header>

        <Tabs active={activeTab} onChange={setActiveTab} />

        {activeTab === "BUYER" && (
          <>
            <ListingTable
              listings={activeListings}
              loading={listingsLoading}
              emptyLabel="No active listings yet."
              showStartAction
              onStartTrade={(listing) => setTradeModalListing(listing)}
            />
            <TradeList
              trades={buyerTrades}
              loading={tradesLoading}
              emptyLabel="You have no trades."
              mode="buyer"
              pendingTrade={pendingBuyerTrade}
              onMarkPaid={handleBuyerMarkPaid}
            />
          </>
        )}

        {activeTab === "SELLER" && (
          <>
            <button
              onClick={() => setListingModalOpen(true)}
              disabled={!isConnected || isWrongNetwork}
              className="rounded-2xl border border-slate-800 bg-arcCard px-6 py-4 text-left shadow-lg transition hover:border-arcAccent disabled:opacity-60"
            >
              <p className="text-lg font-semibold">Create Listing</p>
              <p className="text-sm text-slate-400">Offer liquidity without pre-selecting buyers.</p>
            </button>
            <ListingTable
              listings={sellerListings}
              loading={listingsLoading}
              emptyLabel="You have not created any listings."
            />
            <TradeList
              trades={sellerTrades}
              loading={tradesLoading}
              emptyLabel="No trades yet."
              mode="seller"
              pendingTrade={pendingSellerTrade}
              onLock={handleSellerLock}
              onRelease={handleSellerRelease}
              onRefund={handleSellerRefund}
            />
          </>
        )}
      </div>

      <CreateListingModal
        open={listingModalOpen}
        disabled={!isConnected || isWrongNetwork || sellerActions.pending}
        onClose={() => setListingModalOpen(false)}
        onSubmit={({ amount, price }) => sellerActions.createListing(amount, price)}
      />
      <StartTradeModal
        listing={tradeModalListing}
        open={Boolean(tradeModalListing)}
        disabled={!isConnected || isWrongNetwork}
        onClose={() => setTradeModalListing(undefined)}
        onSubmit={handleStartTrade}
      />
      <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
    </div>
  );
}

export default App;
