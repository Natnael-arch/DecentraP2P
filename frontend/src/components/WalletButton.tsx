import clsx from "clsx";
import { truncateAddress } from "../lib/format";

type Props = {
  account: string | null;
  isConnecting: boolean;
  isWrongNetwork: boolean;
  connect(): Promise<void>;
  disconnect(): void;
};

export function WalletButton({ account, isConnecting, isWrongNetwork, connect, disconnect }: Props) {
  const label = isWrongNetwork ? "Wrong network" : account ? truncateAddress(account) : "Connect Wallet";
  const action = account ? disconnect : connect;

  return (
    <button
      onClick={action}
      disabled={isConnecting || isWrongNetwork}
      className={clsx(
        "rounded-full px-5 py-2 font-semibold transition",
        account ? "bg-slate-900 border border-slate-700" : "bg-gradient-to-r from-cyan-400 to-blue-600",
        (isConnecting || isWrongNetwork) && "opacity-60 cursor-not-allowed"
      )}
    >
      {isConnecting ? "Connecting..." : label}
    </button>
  );
}

