import { formatAmount, truncateAddress } from "../lib/format";
import type { Listing } from "../types/escrow";

type Props = {
  listings: Listing[];
  loading?: boolean;
  onBuy(listing: Listing): void;
};

export default function BuyersTable({ listings, loading, onBuy }: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Active Listings</h2>
        {loading && <span className="text-xs text-slate-400 animate-pulse">Loading…</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-slate-400 uppercase tracking-wide text-xs">
            <tr>
              <th className="py-2 text-left">Seller</th>
              <th className="py-2 text-left">Amount (USDC)</th>
              <th className="py-2 text-left">Rate</th>
              <th className="py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  No active listings
                </td>
              </tr>
            ) : (
              listings.map((l) => (
                <tr key={l.id.toString()} className="border-t border-slate-800/60">
                  <td className="py-3">{truncateAddress(l.seller)}</td>
                  <td>{formatAmount(l.availableAmount)} USDC</td>
                  <td>{formatAmount(l.price)} fiat</td>
                  <td>
                    <button
                      onClick={() => onBuy(l)}
                      className="rounded-full bg-blue-600 hover:bg-blue-500 px-3 py-1 text-xs font-semibold"
                      disabled={!l.active}
                    >
                      Buy
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


