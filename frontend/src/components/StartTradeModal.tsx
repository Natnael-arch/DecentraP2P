import { useState } from "react";
import type { Listing } from "../types/escrow";
import { formatAmount, truncateAddress } from "../lib/format";

type Props = {
  listing?: Listing;
  open: boolean;
  disabled: boolean;
  onClose(): void;
  onSubmit(amount: string): Promise<void>;
};

export function StartTradeModal({ listing, open, disabled, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);

  if (!open || !listing) return null;

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;
    setPending(true);
    try {
      await onSubmit(amount);
      setAmount("");
      onClose();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl bg-arcCard p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Start Trade</h3>
          <button className="text-slate-400 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="text-sm text-slate-300 mb-4">
          Seller: <span className="font-mono">{truncateAddress(listing.seller)}</span>
        </p>
        <p className="text-sm text-slate-300 mb-4">
          Available: <strong>{formatAmount(listing.availableAmount)} USDC</strong>
        </p>
        <label className="block text-sm">
          Enter amount to buy
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 p-2"
            placeholder="50"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-full border border-slate-600 px-4 py-2" onClick={onClose}>
            Cancel
          </button>
          <button
            disabled={disabled || pending || !amount || Number(amount) <= 0}
            className="rounded-full bg-gradient-to-r from-green-400 to-blue-600 px-5 py-2 disabled:opacity-60"
            onClick={handleSubmit}
          >
            {pending ? "Submitting..." : "Start Trade"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StartTradeModal;

