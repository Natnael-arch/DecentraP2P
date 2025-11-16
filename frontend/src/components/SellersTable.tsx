import { formatAmount } from "../lib/format";
import type { Listing, Trade } from "../types/escrow";
import { TradeStatus } from "../types/escrow";

type Props = {
  listings: Listing[];
  trades: Trade[];
  onLock?(trade: Trade): void;
  onRelease?(trade: Trade): void;
  onRefund?(trade: Trade): void;
};

export default function SellersTable({ listings, trades, onLock, onRelease, onRefund }: Props) {
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="text-lg font-semibold mb-2">My Listings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-slate-400 uppercase tracking-wide text-xs">
              <tr>
                <th className="py-2 text-left">ListingID</th>
                <th className="py-2 text-left">Available</th>
                <th className="py-2 text-left">Active</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">
                    No listings
                  </td>
                </tr>
              ) : (
                listings.map((l) => (
                  <tr key={l.id.toString()} className="border-t border-slate-800/60">
                    <td className="py-3">{l.id.toString()}</td>
                    <td>{formatAmount(l.availableAmount)} USDC</td>
                    <td>{l.active ? "Yes" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="text-lg font-semibold mb-2">My Trades</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-slate-400 uppercase tracking-wide text-xs">
              <tr>
                <th className="py-2 text-left">TradeID</th>
                <th className="py-2 text-left">ListingID</th>
                <th className="py-2 text-left">Amount</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No trades
                  </td>
                </tr>
              ) : (
                trades.map((t) => (
                  <tr key={t.id.toString()} className="border-t border-slate-800/60">
                    <td className="py-3">{t.id.toString()}</td>
                    <td>{t.listingId.toString()}</td>
                    <td>{formatAmount(t.amount)} USDC</td>
                    <td>
                      {t.status === TradeStatus.AwaitingSellerLock
                        ? "Pending"
                        : t.status === TradeStatus.Locked
                        ? "Locked"
                        : t.status === TradeStatus.Paid
                        ? "Paid"
                        : t.status === TradeStatus.Released
                        ? "Released"
                        : t.status === TradeStatus.Refunded
                        ? "Refunded"
                        : "None"}
                    </td>
                    <td className="flex gap-2">
                      {t.status === TradeStatus.AwaitingSellerLock && (
                        <button
                          className="rounded-full bg-blue-600 hover:bg-blue-500 px-3 py-1 text-xs font-semibold"
                          onClick={() => onLock?.(t)}
                        >
                          Lock Funds
                        </button>
                      )}
                      {t.status === TradeStatus.Paid && (
                        <>
                          <button
                            className="rounded-full bg-green-600 hover:bg-green-500 px-3 py-1 text-xs font-semibold"
                            onClick={() => onRelease?.(t)}
                          >
                            Release
                          </button>
                          <button
                            className="rounded-full bg-slate-800 hover:bg-slate-700 px-3 py-1 text-xs font-semibold border border-slate-600"
                            onClick={() => onRefund?.(t)}
                          >
                            Timeout Refund
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


