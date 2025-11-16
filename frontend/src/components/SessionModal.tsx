import { truncateAddress, formatAmount } from "../lib/format";
import type { Listing, Trade } from "../types/escrow";
import { TradeStatus } from "../types/escrow";

type Props = {
  open: boolean;
  onClose(): void;
  role: "buyer" | "seller";
  trade?: Trade;
  listing?: Listing;
  onBuyerMarkPaid?(): Promise<void>;
  onSellerRelease?(): Promise<void>;
  onSellerRefund?(): Promise<void>;
};

export default function SessionModal({
  open,
  onClose,
  role,
  trade,
  listing,
  onBuyerMarkPaid,
  onSellerRelease,
  onSellerRefund,
}: Props) {
  if (!open) return null;
  const amount =
    trade?.amount ??
    listing?.availableAmount ??
    (0n as bigint);
  const status =
    trade?.status ??
    TradeStatus.AwaitingSellerLock;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl bg-arcCard p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Trade Session</h3>
          <button className="text-slate-400 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="space-y-2 text-sm">
          {listing && (
            <p>
              <span className="text-slate-400">Seller:</span> {truncateAddress(listing.seller)}
            </p>
          )}
          {trade && (
            <>
              <p>
                <span className="text-slate-400">Seller:</span> {truncateAddress(trade.seller)}
              </p>
              <p>
                <span className="text-slate-400">Buyer:</span> {truncateAddress(trade.buyer)}
              </p>
            </>
          )}
          <p>
            <span className="text-slate-400">Amount:</span> {formatAmount(amount)} USDC
          </p>
          <p>
            <span className="text-slate-400">Status:</span>{" "}
            {status === TradeStatus.AwaitingSellerLock
              ? "Pending"
              : status === TradeStatus.Locked
              ? "Locked"
              : status === TradeStatus.Paid
              ? "Paid"
              : status === TradeStatus.Released
              ? "Released"
              : status === TradeStatus.Refunded
              ? "Refunded"
              : "None"}
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {role === "buyer" && trade && trade.status === TradeStatus.Locked && (
            <button
              className="rounded-full bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-semibold"
              onClick={() => onBuyerMarkPaid?.()}
            >
              Mark as Paid
            </button>
          )}
          {role === "seller" && trade && trade.status === TradeStatus.Paid && (
            <>
              <button
                className="rounded-full bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-semibold"
                onClick={() => onSellerRelease?.()}
              >
                Release
              </button>
              <button
                className="rounded-full bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold border border-slate-600"
                onClick={() => onSellerRefund?.()}
              >
                Timeout Refund
              </button>
            </>
          )}
          <button className="rounded-full border border-slate-600 px-4 py-2 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


