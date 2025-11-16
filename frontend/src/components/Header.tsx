import { truncateAddress } from "../lib/format";

type Props = {
  onConnect(): void;
  onDisconnect(): void;
  account?: string | null;
  isConnecting?: boolean;
  isWrongNetwork?: boolean;
};

export default function Header({ onConnect, onDisconnect, account, isConnecting, isWrongNetwork }: Props) {
  const connected = Boolean(account);
  return (
    <header className="flex items-center justify-between py-4">
      <h1 className="text-2xl font-semibold">DecentraP2P</h1>
      <button
        onClick={connected ? onDisconnect : onConnect}
        disabled={isConnecting || isWrongNetwork}
        className={`rounded-full px-5 py-2 font-semibold transition ${
          connected ? "bg-slate-900 border border-slate-700" : "bg-gradient-to-r from-cyan-400 to-blue-600"
        } ${isConnecting || isWrongNetwork ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {isWrongNetwork
          ? "Wrong network"
          : isConnecting
          ? "Connecting..."
          : connected
          ? truncateAddress(account || "")
          : "Connect Wallet"}
      </button>
    </header>
  );
}


