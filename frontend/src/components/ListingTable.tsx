import clsx from "clsx";
import type { Listing } from "../types/escrow";
import { formatAmount, truncateAddress } from "../lib/format";

type Props = {
  listings: Listing[];
  loading: boolean;
  emptyLabel: string;
  showStartAction?: boolean;
  onStartTrade?(listing: Listing): void;
};

export function ListingTable({ listings, loading, emptyLabel, showStartAction, onStartTrade }: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Listings</h3>
        {loading && <span className="text-xs text-slate-400 animate-pulse">Refreshing…</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-slate-400 uppercase tracking-wide text-xs">
            <tr>
              <th className="py-2 text-left">ID</th>
              <th className="py-2 text-left">Seller</th>
              <th className="py-2 text-left">Available</th>
              <th className="py-2 text-left">Fiat price</th>
              {showStartAction && <th className="py-2 text-left">Action</th>}
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 ? (
              <tr>
                <td colSpan={showStartAction ? 5 : 4} className="py-8 text-center text-slate-500">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              listings.map((listing) => (
                <tr key={listing.id.toString()} className="border-t border-slate-800/60">
                  <td className="py-3">{listing.id.toString()}</td>
                  <td>{truncateAddress(listing.seller)}</td>
                  <td>{formatAmount(listing.availableAmount)} USDC</td>
                  <td>{formatAmount(listing.price)} fiat</td>
                  {showStartAction && (
                    <td>
                      <button
                        onClick={() => onStartTrade?.(listing)}
                        className={clsx(
                          "rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1 text-xs font-semibold",
                          !listing.active && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={!listing.active}
                      >
                        Start Trade
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

