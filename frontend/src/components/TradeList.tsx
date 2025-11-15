import clsx from "clsx";
import type { Trade } from "../types/escrow";
import { TradeStatus } from "../types/escrow";
import { STATUS_LABELS, formatAmount, truncateAddress } from "../lib/format";

type Props = {
  trades: Trade[];
  loading: boolean;
  emptyLabel: string;
  mode: "buyer" | "seller";
  pendingTrade?: bigint | null;
  onLock?(trade: Trade): void;
  onRelease?(trade: Trade): void;
  onRefund?(trade: Trade): void;
  onMarkPaid?(trade: Trade): void;
};

export function TradeList({
  trades,
  loading,
  emptyLabel,
  mode,
  pendingTrade,
  onLock,
  onRelease,
  onRefund,
  onMarkPaid,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Trades</h3>
        {loading && <span className="text-xs text-slate-400 animate-pulse">Syncing…</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-slate-400 uppercase tracking-wide text-xs">
            <tr>
              <th className="py-2 text-left">ID</th>
              <th className="py-2 text-left">{mode === "buyer" ? "Seller" : "Buyer"}</th>
              <th className="py-2 text-left">Amount</th>
              <th className="py-2 text-left">Status</th>
              <th className="py-2 text-left">Timeout</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              trades.map((trade) => (
                <tr key={trade.id.toString()} className="border-t border-slate-800/60">
                  <td className="py-3">{trade.id.toString()}</td>
                  <td>{truncateAddress(mode === "buyer" ? trade.seller : trade.buyer)}</td>
                  <td>{formatAmount(trade.amount)} USDC</td>
                  <td>
                    <StatusBadge status={trade.status} />
                  </td>
                  <td>
                    {trade.timeout && trade.timeout > 0n
                      ? new Date(Number(trade.timeout) * 1000).toLocaleString()
                      : "-"}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {mode === "buyer" && trade.status === TradeStatus.Locked && (
                        <ActionButton
                          label="Mark Paid"
                          onClick={() => onMarkPaid?.(trade)}
                          disabled={pendingTrade === trade.id}
                        />
                      )}
                      {mode === "seller" && trade.status === TradeStatus.AwaitingSellerLock && (
                        <ActionButton
                          label="Lock Funds"
                          onClick={() => onLock?.(trade)}
                          disabled={pendingTrade === trade.id}
                        />
                      )}
                      {mode === "seller" && trade.status === TradeStatus.Paid && (
                        <>
                          <ActionButton
                            label="Release"
                            onClick={() => onRelease?.(trade)}
                            disabled={pendingTrade === trade.id}
                          />
                          <ActionButton
                            label="Timeout Refund"
                            variant="secondary"
                            onClick={() => onRefund?.(trade)}
                            disabled={pendingTrade === trade.id}
                          />
                        </>
                      )}
                    </div>
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

const STATUS_COLORS: Record<TradeStatus, string> = {
  [TradeStatus.None]: "bg-slate-700",
  [TradeStatus.AwaitingSellerLock]: "bg-amber-500/20 text-amber-300",
  [TradeStatus.Locked]: "bg-blue-500/20 text-blue-200",
  [TradeStatus.Paid]: "bg-purple-500/20 text-purple-200",
  [TradeStatus.Released]: "bg-green-500/20 text-green-200",
  [TradeStatus.Refunded]: "bg-rose-500/20 text-rose-200",
};

function StatusBadge({ status }: { status: TradeStatus }) {
  return (
    <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function ActionButton({
  label,
  variant = "primary",
  ...props
}: { label: string; variant?: "primary" | "secondary" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx(
        "rounded-full px-3 py-1 text-xs font-semibold transition",
        variant === "primary"
          ? "bg-blue-600 hover:bg-blue-500"
          : "bg-slate-800 hover:bg-slate-700 border border-slate-500",
        props.disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      {props.disabled ? "…" : label}
    </button>
  );
}

