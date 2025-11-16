import { useState } from "react";

type Props = {
  open: boolean;
  disabled: boolean;
  onClose(): void;
  onSubmit(values: { amount: string; price: string }): Promise<void>;
};

export function CreateListingModal({ open, disabled, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [pending, setPending] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;
    setPending(true);
    try {
      await onSubmit({ amount, price });
      setAmount("");
      setPrice("");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-arcCard p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Create Listing</h3>
          <button className="text-slate-400 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <label className="block text-sm">
            Amount (USDC)
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 p-2"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Reference Price (fiat, 6 decimals)
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 p-2"
              placeholder="1000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-full border border-slate-600 px-4 py-2" onClick={onClose}>
            Cancel
          </button>
          <button
            disabled={disabled || pending || !amount || Number(amount) <= 0}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2 disabled:opacity-60"
            onClick={handleSubmit}
          >
            {pending ? "Submitting..." : "Create Listing"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateListingModal;

